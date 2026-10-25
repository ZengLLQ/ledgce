use hex::ToHex;
use rust_decimal::Decimal;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::str::FromStr;
use time::OffsetDateTime;
use uuid::Uuid;

use ledgce_domain::{Currency, DomainError, Money};

use crate::error::AppError;
use crate::model::{
    EntryView, LifecycleEvent, OutboxView, PostTransferRequest, ReverseTransferRequest,
    TransactionDetail, TransactionSummary, TransferOutcome,
};

#[derive(Clone)]
pub struct TransferService {
    pool: PgPool,
}

impl TransferService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Computes a canonical SHA-256 hash for a transfer payload.
    pub fn hash_transfer_payload(
        source_id: Uuid,
        destination_id: Uuid,
        amount: Decimal,
        currency: &str,
        desc: Option<&str>,
    ) -> String {
        let mut hasher = Sha256::new();
        hasher.update(
            format!(
                "{}:{}:{}:{}:{}",
                source_id,
                destination_id,
                amount,
                currency,
                desc.unwrap_or("")
            )
            .as_bytes(),
        );
        hasher.finalize().encode_hex::<String>()
    }

    /// Computes a canonical SHA-256 hash for a reversal payload.
    pub fn hash_reversal_payload(transaction_id: Uuid, reason: Option<&str>) -> String {
        let mut hasher = Sha256::new();
        hasher.update(format!("reversal:{}:{}", transaction_id, reason.unwrap_or("")).as_bytes());
        hasher.finalize().encode_hex::<String>()
    }

    /// Posts an internal transfer atomically with double-entry journal entries,
    /// outbox event generation, and idempotency protection.
    pub async fn post_transfer(
        &self,
        req: PostTransferRequest,
        principal: &str,
    ) -> Result<TransferOutcome, AppError> {
        // 1. Validate currency & monetary amount
        let currency = Currency::from_str(&req.currency)?;
        let money = Money::new(req.amount, currency)?;

        if req.source_account_id == req.destination_account_id {
            return Err(AppError::Validation(
                "Source and destination accounts must be different".into(),
            ));
        }

        // 2. Check idempotency if a key was provided
        let expected_hash = Self::hash_transfer_payload(
            req.source_account_id,
            req.destination_account_id,
            money.amount(),
            currency.code(),
            req.description.as_deref(),
        );

        if let Some(ref key) = req.idempotency_key {
            let existing: Option<(String, Option<Uuid>)> = sqlx::query_as(
                "SELECT request_hash, transaction_id FROM idempotency_records WHERE principal = $1 AND idempotency_key = $2",
            )
            .bind(principal)
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

            if let Some((stored_hash, tx_id)) = existing {
                if stored_hash == expected_hash {
                    if let Some(id) = tx_id {
                        let tx = self.get_transaction(id).await?;
                        return Ok(TransferOutcome {
                            transaction: tx,
                            replayed: true,
                        });
                    }
                } else {
                    return Err(AppError::IdempotencyKeyReuse);
                }
            }
        }

        // 3. Begin atomic transaction
        let mut tx = self.pool.begin().await?;

        // Lock accounts in deterministic order (smaller UUID first) to prevent deadlocks
        let (first_id, second_id) = if req.source_account_id < req.destination_account_id {
            (req.source_account_id, req.destination_account_id)
        } else {
            (req.destination_account_id, req.source_account_id)
        };

        struct LockedAccount {
            id: Uuid,
            currency: String,
            status: String,
        }

        let locked_accounts: Vec<LockedAccount> = sqlx::query_as!(
            LockedAccount,
            r#"SELECT id, currency, status FROM accounts WHERE id IN ($1, $2) ORDER BY id ASC FOR UPDATE"#,
            first_id,
            second_id
        )
        .fetch_all(&mut *tx)
        .await?;

        if locked_accounts.len() < 2 {
            return Err(AppError::NotFound(
                "One or both accounts were not found".into(),
            ));
        }

        let src_acct = locked_accounts
            .iter()
            .find(|a| a.id == req.source_account_id)
            .ok_or_else(|| AppError::NotFound("Source account not found".into()))?;
        let dst_acct = locked_accounts
            .iter()
            .find(|a| a.id == req.destination_account_id)
            .ok_or_else(|| AppError::NotFound("Destination account not found".into()))?;

        if src_acct.status != "active" {
            return Err(AppError::Validation(format!(
                "Source account {} is {}",
                src_acct.id, src_acct.status
            )));
        }
        if dst_acct.status != "active" {
            return Err(AppError::Validation(format!(
                "Destination account {} is {}",
                dst_acct.id, dst_acct.status
            )));
        }
        if src_acct.currency != currency.code() || dst_acct.currency != currency.code() {
            return Err(AppError::Validation(format!(
                "Cross-currency transfers are not supported (requested {}, source {}, destination {})",
                currency.code(),
                src_acct.currency,
                dst_acct.currency
            )));
        }

        // Lock balances in deterministic order
        struct LockedBalance {
            account_id: Uuid,
            is_system: bool,
            balance: Decimal,
        }

        let balances: Vec<LockedBalance> = sqlx::query_as!(
            LockedBalance,
            r#"SELECT account_id, is_system, balance FROM account_balances WHERE account_id IN ($1, $2) ORDER BY account_id ASC FOR UPDATE"#,
            first_id,
            second_id
        )
        .fetch_all(&mut *tx)
        .await?;

        let src_bal = balances
            .iter()
            .find(|b| b.account_id == req.source_account_id)
            .ok_or_else(|| AppError::NotFound("Source balance row not found".into()))?;

        if !src_bal.is_system && src_bal.balance < money.amount() {
            return Err(AppError::Domain(DomainError::InsufficientFunds {
                available: src_bal.balance,
                requested: money.amount(),
            }));
        }

        let tx_id = Uuid::now_v7();
        let reference = req
            .reference
            .unwrap_or_else(|| format!("TX-{}", tx_id.simple()));

        // Insert into transactions
        sqlx::query!(
            r#"
            INSERT INTO transactions (
                id, reference, kind, status, currency, amount,
                source_account_id, destination_account_id, description,
                reverses_transaction_id, created_at, posted_at
            ) VALUES (
                $1, $2, 'transfer', 'posted', $3, $4,
                $5, $6, $7,
                NULL, now(), now()
            )
            "#,
            tx_id,
            reference,
            currency.code(),
            money.amount(),
            req.source_account_id,
            req.destination_account_id,
            req.description
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Insert double-entry journal entries
        let debit_entry_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO journal_entries (
                id, transaction_id, account_id, currency, debit, credit, memo, posted_at
            ) VALUES (
                $1, $2, $3, $4, $5, 0, $6, now()
            )
            "#,
            debit_entry_id,
            tx_id,
            req.source_account_id,
            currency.code(),
            money.amount(),
            req.description
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        let credit_entry_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO journal_entries (
                id, transaction_id, account_id, currency, debit, credit, memo, posted_at
            ) VALUES (
                $1, $2, $3, $4, 0, $5, $6, now()
            )
            "#,
            credit_entry_id,
            tx_id,
            req.destination_account_id,
            currency.code(),
            money.amount(),
            req.description
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Insert outbox event
        let outbox_id = Uuid::now_v7();
        let outbox_payload = serde_json::json!({
            "transaction_id": tx_id,
            "reference": reference,
            "kind": "transfer",
            "currency": currency.code(),
            "amount": money.amount().to_string(),
            "source_account_id": req.source_account_id,
            "destination_account_id": req.destination_account_id,
        });

        sqlx::query!(
            r#"
            INSERT INTO outbox_events (
                id, aggregate_type, aggregate_id, event_type, payload, status, available_at, created_at
            ) VALUES (
                $1, 'transaction', $2, 'transaction_posted', $3, 'pending', now(), now()
            )
            "#,
            outbox_id,
            tx_id,
            outbox_payload
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Insert transaction event
        let event_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO transaction_events (
                id, transaction_id, state, detail, occurred_at
            ) VALUES (
                $1, $2, 'posted', 'Transaction posted to ledger', now()
            )
            "#,
            event_id,
            tx_id
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Record idempotency claim if key provided
        if let Some(ref key) = req.idempotency_key {
            let idem_id = Uuid::now_v7();
            sqlx::query!(
                r#"
                INSERT INTO idempotency_records (
                    id, principal, idempotency_key, request_hash, transaction_id, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, now()
                )
                "#,
                idem_id,
                principal,
                key,
                expected_hash,
                tx_id
            )
            .execute(&mut *tx)
            .await
            .map_err(Self::map_db_error)?;
        }

        // Record audit event
        let audit_id = Uuid::now_v7();
        let audit_detail = serde_json::json!({
            "reference": reference,
            "amount": money.amount().to_string(),
            "currency": currency.code(),
            "source": req.source_account_id,
            "destination": req.destination_account_id,
        });
        sqlx::query!(
            r#"
            INSERT INTO audit_events (
                id, actor, action, entity_type, entity_id, detail, occurred_at
            ) VALUES (
                $1, $2, 'post_transfer', 'transaction', $3, $4, now()
            )
            "#,
            audit_id,
            principal,
            tx_id.to_string(),
            audit_detail
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        tx.commit().await.map_err(Self::map_db_error)?;

        metrics::counter!("ledgce_transfers_posted_total").increment(1);

        let detail = self.get_transaction(tx_id).await?;
        Ok(TransferOutcome {
            transaction: detail,
            replayed: false,
        })
    }

    /// Reverses an existing posted transaction.
    /// Creates a compensatory double-entry transaction that debits the original destination
    /// and credits the original source.
    pub async fn reverse_transfer(
        &self,
        req: ReverseTransferRequest,
        principal: &str,
    ) -> Result<TransferOutcome, AppError> {
        let expected_hash = Self::hash_reversal_payload(req.transaction_id, req.reason.as_deref());

        // 1. Idempotency check
        if let Some(ref key) = req.idempotency_key {
            let existing: Option<(String, Option<Uuid>)> = sqlx::query_as(
                "SELECT request_hash, transaction_id FROM idempotency_records WHERE principal = $1 AND idempotency_key = $2",
            )
            .bind(principal)
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

            if let Some((stored_hash, tx_id)) = existing {
                if stored_hash == expected_hash {
                    if let Some(id) = tx_id {
                        let tx = self.get_transaction(id).await?;
                        return Ok(TransferOutcome {
                            transaction: tx,
                            replayed: true,
                        });
                    }
                } else {
                    return Err(AppError::IdempotencyKeyReuse);
                }
            }
        }

        let mut tx = self.pool.begin().await?;

        // 2. Query original transaction
        struct OrigTx {
            id: Uuid,
            reference: String,
            kind: String,
            currency: String,
            amount: Decimal,
            source_account_id: Uuid,
            destination_account_id: Uuid,
        }

        let orig = sqlx::query_as!(
            OrigTx,
            r#"
            SELECT id, reference, kind, currency, amount, source_account_id, destination_account_id
            FROM transactions
            WHERE id = $1
            FOR UPDATE
            "#,
            req.transaction_id
        )
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| {
            AppError::NotFound(format!("Transaction {} not found", req.transaction_id))
        })?;

        if orig.kind == "reversal" {
            return Err(AppError::Validation(
                "Cannot reverse a reversal transaction".into(),
            ));
        }

        // Check if already reversed
        let already_reversed: Option<Uuid> = sqlx::query_scalar(
            "SELECT id FROM transactions WHERE reverses_transaction_id = $1 LIMIT 1",
        )
        .bind(orig.id)
        .fetch_optional(&mut *tx)
        .await?;

        if let Some(reversal_id) = already_reversed {
            return Err(AppError::Conflict(format!(
                "Transaction {} has already been reversed by {}",
                orig.id, reversal_id
            )));
        }

        // Lock accounts in deterministic order
        let (first_id, second_id) = if orig.source_account_id < orig.destination_account_id {
            (orig.source_account_id, orig.destination_account_id)
        } else {
            (orig.destination_account_id, orig.source_account_id)
        };

        // Note: For reversal, original destination is source (funds taken back), original source is destination
        let reversal_source = orig.destination_account_id;
        let reversal_destination = orig.source_account_id;

        struct LockedBalance {
            account_id: Uuid,
            is_system: bool,
            balance: Decimal,
        }

        let balances: Vec<LockedBalance> = sqlx::query_as!(
            LockedBalance,
            r#"SELECT account_id, is_system, balance FROM account_balances WHERE account_id IN ($1, $2) ORDER BY account_id ASC FOR UPDATE"#,
            first_id,
            second_id
        )
        .fetch_all(&mut *tx)
        .await?;

        let rev_src_bal = balances
            .iter()
            .find(|b| b.account_id == reversal_source)
            .ok_or_else(|| AppError::NotFound("Reversal source balance not found".into()))?;

        if !rev_src_bal.is_system && rev_src_bal.balance < orig.amount {
            return Err(AppError::Domain(DomainError::InsufficientFunds {
                available: rev_src_bal.balance,
                requested: orig.amount,
            }));
        }

        let rev_tx_id = Uuid::now_v7();
        let rev_reference = format!("REV-{}", orig.reference);
        let rev_description = req
            .reason
            .clone()
            .unwrap_or_else(|| format!("Reversal of transaction {}", orig.reference));

        // Insert reversal transaction
        sqlx::query!(
            r#"
            INSERT INTO transactions (
                id, reference, kind, status, currency, amount,
                source_account_id, destination_account_id, description,
                reverses_transaction_id, created_at, posted_at
            ) VALUES (
                $1, $2, 'reversal', 'posted', $3, $4,
                $5, $6, $7,
                $8, now(), now()
            )
            "#,
            rev_tx_id,
            rev_reference,
            orig.currency,
            orig.amount,
            reversal_source,
            reversal_destination,
            rev_description,
            orig.id
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Reversal journal entries: debit reversal_source, credit reversal_destination
        let debit_entry_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO journal_entries (
                id, transaction_id, account_id, currency, debit, credit, memo, posted_at
            ) VALUES (
                $1, $2, $3, $4, $5, 0, $6, now()
            )
            "#,
            debit_entry_id,
            rev_tx_id,
            reversal_source,
            orig.currency,
            orig.amount,
            rev_description
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        let credit_entry_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO journal_entries (
                id, transaction_id, account_id, currency, debit, credit, memo, posted_at
            ) VALUES (
                $1, $2, $3, $4, 0, $5, $6, now()
            )
            "#,
            credit_entry_id,
            rev_tx_id,
            reversal_destination,
            orig.currency,
            orig.amount,
            rev_description
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Outbox event
        let outbox_id = Uuid::now_v7();
        let outbox_payload = serde_json::json!({
            "transaction_id": rev_tx_id,
            "reference": rev_reference,
            "kind": "reversal",
            "reverses_transaction_id": orig.id,
            "currency": orig.currency,
            "amount": orig.amount.to_string(),
        });

        sqlx::query!(
            r#"
            INSERT INTO outbox_events (
                id, aggregate_type, aggregate_id, event_type, payload, status, available_at, created_at
            ) VALUES (
                $1, 'transaction', $2, 'transaction_reversed', $3, 'pending', now(), now()
            )
            "#,
            outbox_id,
            rev_tx_id,
            outbox_payload
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        // Transaction lifecycle events
        let event_id = Uuid::now_v7();
        sqlx::query!(
            r#"
            INSERT INTO transaction_events (
                id, transaction_id, state, detail, occurred_at
            ) VALUES (
                $1, $2, 'posted', $3, now()
            )
            "#,
            event_id,
            rev_tx_id,
            format!("Reversal of {}", orig.reference)
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        if let Some(ref key) = req.idempotency_key {
            let idem_id = Uuid::now_v7();
            sqlx::query!(
                r#"
                INSERT INTO idempotency_records (
                    id, principal, idempotency_key, request_hash, transaction_id, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, now()
                )
                "#,
                idem_id,
                principal,
                key,
                expected_hash,
                rev_tx_id
            )
            .execute(&mut *tx)
            .await
            .map_err(Self::map_db_error)?;
        }

        let audit_id = Uuid::now_v7();
        let audit_detail = serde_json::json!({
            "reversal_of": orig.reference,
            "amount": orig.amount.to_string(),
            "currency": orig.currency,
        });
        sqlx::query!(
            r#"
            INSERT INTO audit_events (
                id, actor, action, entity_type, entity_id, detail, occurred_at
            ) VALUES (
                $1, $2, 'reverse_transfer', 'transaction', $3, $4, now()
            )
            "#,
            audit_id,
            principal,
            rev_tx_id.to_string(),
            audit_detail
        )
        .execute(&mut *tx)
        .await
        .map_err(Self::map_db_error)?;

        tx.commit().await.map_err(Self::map_db_error)?;

        let detail = self.get_transaction(rev_tx_id).await?;
        Ok(TransferOutcome {
            transaction: detail,
            replayed: false,
        })
    }

    /// Fetches a complete transaction detail with journal entries,
    /// outbox events, and lifecycle progression.
    pub async fn get_transaction(&self, id: Uuid) -> Result<TransactionDetail, AppError> {
        let summary: TransactionSummary = sqlx::query_as(
            r#"
            SELECT
                t.id,
                t.seq,
                t.reference,
                t.kind,
                t.status,
                t.currency,
                t.amount,
                t.source_account_id,
                src.code AS source_account_code,
                t.destination_account_id,
                dst.code AS destination_account_code,
                t.description,
                t.reverses_transaction_id,
                t.created_at,
                t.posted_at
            FROM transactions t
            JOIN accounts src ON src.id = t.source_account_id
            JOIN accounts dst ON dst.id = t.destination_account_id
            WHERE t.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Transaction {} not found", id)))?;

        let (published_at, processed_at): (Option<OffsetDateTime>, Option<OffsetDateTime>) =
            sqlx::query_as("SELECT published_at, processed_at FROM transactions WHERE id = $1")
                .bind(id)
                .fetch_one(&self.pool)
                .await?;

        let reversed_by_transaction_id: Option<Uuid> = sqlx::query_scalar(
            "SELECT id FROM transactions WHERE reverses_transaction_id = $1 LIMIT 1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        let idempotency_key: Option<String> = sqlx::query_scalar(
            "SELECT idempotency_key FROM idempotency_records WHERE transaction_id = $1 LIMIT 1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        let entries: Vec<EntryView> = sqlx::query_as(
            r#"
            SELECT
                j.id,
                j.seq,
                j.transaction_id,
                t.reference AS transaction_reference,
                t.kind AS transaction_kind,
                t.status AS transaction_status,
                j.account_id,
                a.code AS account_code,
                a.name AS account_name,
                j.currency,
                j.debit,
                j.credit,
                j.memo,
                j.posted_at
            FROM journal_entries j
            JOIN transactions t ON t.id = j.transaction_id
            JOIN accounts a ON a.id = j.account_id
            WHERE j.transaction_id = $1
            ORDER BY j.seq ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await?;

        let total_debit: Decimal = entries.iter().map(|e| e.debit).sum();
        let total_credit: Decimal = entries.iter().map(|e| e.credit).sum();
        let balanced = total_debit == total_credit && !entries.is_empty();

        let lifecycle: Vec<LifecycleEvent> = sqlx::query_as(
            r#"
            SELECT id, state, detail, occurred_at
            FROM transaction_events
            WHERE transaction_id = $1
            ORDER BY occurred_at ASC, id ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await?;

        let outbox_events: Vec<OutboxView> = sqlx::query_as(
            r#"
            SELECT
                id,
                seq,
                aggregate_id,
                event_type,
                status,
                attempts,
                available_at,
                locked_by,
                last_error,
                created_at,
                processed_at,
                EXTRACT(EPOCH FROM (COALESCE(processed_at, now()) - created_at))::float8 AS age_seconds
            FROM outbox_events
            WHERE aggregate_id = $1
            ORDER BY seq ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await?;

        Ok(TransactionDetail {
            summary,
            published_at,
            processed_at,
            reversed_by_transaction_id,
            idempotency_key,
            entries,
            total_debit,
            total_credit,
            balanced,
            lifecycle,
            outbox_events,
        })
    }

    /// Fetches a transaction by its business reference (e.g. `TX-...`).
    pub async fn get_transaction_by_reference(
        &self,
        reference: &str,
    ) -> Result<TransactionDetail, AppError> {
        let id: Uuid = sqlx::query_scalar("SELECT id FROM transactions WHERE reference = $1")
            .bind(reference)
            .fetch_optional(&self.pool)
            .await?
            .ok_or_else(|| {
                AppError::NotFound(format!(
                    "Transaction with reference '{}' not found",
                    reference
                ))
            })?;

        self.get_transaction(id).await
    }

    fn map_db_error(err: sqlx::Error) -> AppError {
        if let Some(db_err) = err.as_database_error() {
            match db_err.code().as_deref() {
                Some("23514") => {
                    let constraint = db_err.constraint().unwrap_or_default();
                    if constraint.contains("customer_balance_nonnegative")
                        || constraint.contains("balance")
                    {
                        return AppError::InsufficientFundsDetectedByDatabase;
                    }
                }
                Some("23505") => {
                    return AppError::Conflict(db_err.message().to_string());
                }
                _ => {}
            }
        }
        AppError::Database(err)
    }
}
