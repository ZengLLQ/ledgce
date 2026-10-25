use rust_decimal::Decimal;
use sqlx::PgPool;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::error::AppError;
use crate::model::{ReconciliationRunDetail, ReconciliationRunSummary, ReconciliationViolation};

#[derive(Clone)]
pub struct ReconciliationService {
    pool: PgPool,
}

impl ReconciliationService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Performs a full ledger reconciliation run across all invariants:
    /// 1. Currency double-entry zero sum.
    /// 2. Account balance projection vs. full journal entry aggregation.
    /// 3. Customer non-negative balance enforcement.
    /// 4. Transaction balancing and completeness (>=2 entries per tx).
    /// 5. Stuck or abandoned outbox events.
    pub async fn run_reconciliation(
        &self,
        triggered_by: &str,
    ) -> Result<ReconciliationRunDetail, AppError> {
        let started_at = OffsetDateTime::now_utc();
        let mut violations: Vec<ReconciliationViolation> = Vec::new();

        // 1. Double-entry sum per currency: SUM(debit) MUST EQUAL SUM(credit)
        struct CurrencyCheck {
            currency: String,
            debit_sum: Decimal,
            credit_sum: Decimal,
        }

        let currency_checks: Vec<CurrencyCheck> = sqlx::query_as!(
            CurrencyCheck,
            r#"
            SELECT
                currency,
                COALESCE(SUM(debit), 0) AS "debit_sum!",
                COALESCE(SUM(credit), 0) AS "credit_sum!"
            FROM journal_entries
            GROUP BY currency
            HAVING SUM(debit) <> SUM(credit)
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        for c in currency_checks {
            violations.push(ReconciliationViolation {
                violation_type: "DoubleEntryCurrencyUnbalanced".into(),
                entity_type: "currency".into(),
                entity_id: Some(c.currency.clone()),
                message: format!(
                    "Currency {} has unbalanced journal: total debits {} != total credits {}",
                    c.currency, c.debit_sum, c.credit_sum
                ),
                details: serde_json::json!({
                    "currency": c.currency,
                    "debit_sum": c.debit_sum.to_string(),
                    "credit_sum": c.credit_sum.to_string(),
                    "diff": (c.credit_sum - c.debit_sum).to_string(),
                }),
            });
        }

        // 2. Account balance projection verification
        struct AccountMismatch {
            id: Uuid,
            code: String,
            currency: String,
            projected: Decimal,
            journal: Decimal,
        }

        let mismatches: Vec<AccountMismatch> = sqlx::query_as!(
            AccountMismatch,
            r#"
            SELECT
                a.id,
                a.code,
                a.currency,
                ab.balance AS "projected!",
                COALESCE(SUM(j.credit) - SUM(j.debit), 0) AS "journal!"
            FROM accounts a
            JOIN account_balances ab ON ab.account_id = a.id
            LEFT JOIN journal_entries j ON j.account_id = a.id
            GROUP BY a.id, a.code, a.currency, ab.balance
            HAVING ab.balance <> COALESCE(SUM(j.credit) - SUM(j.debit), 0)
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        for m in mismatches {
            violations.push(ReconciliationViolation {
                violation_type: "AccountProjectionMismatch".into(),
                entity_type: "account".into(),
                entity_id: Some(m.id.to_string()),
                message: format!(
                    "Account {} ({}) projection {} does not match journal recalculation {}",
                    m.code, m.currency, m.projected, m.journal
                ),
                details: serde_json::json!({
                    "account_code": m.code,
                    "projected_balance": m.projected.to_string(),
                    "journal_balance": m.journal.to_string(),
                }),
            });
        }

        // 3. Customer non-negative balance check
        struct NegativeCustomer {
            id: Uuid,
            code: String,
            currency: String,
            balance: Decimal,
        }

        let negative_customers: Vec<NegativeCustomer> = sqlx::query_as!(
            NegativeCustomer,
            r#"
            SELECT a.id, a.code, a.currency, ab.balance AS "balance!"
            FROM accounts a
            JOIN account_balances ab ON ab.account_id = a.id
            WHERE a.kind = 'customer' AND ab.balance < 0
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        for n in negative_customers {
            violations.push(ReconciliationViolation {
                violation_type: "NegativeCustomerBalance".into(),
                entity_type: "account".into(),
                entity_id: Some(n.id.to_string()),
                message: format!(
                    "Customer account {} has illegal negative balance: {} {}",
                    n.code, n.balance, n.currency
                ),
                details: serde_json::json!({
                    "account_code": n.code,
                    "balance": n.balance.to_string(),
                    "currency": n.currency,
                }),
            });
        }

        // 4. Transaction balancing and entry completeness
        struct UnbalancedTx {
            id: Uuid,
            reference: String,
            entry_count: Option<i64>,
            debit_sum: Option<Decimal>,
            credit_sum: Option<Decimal>,
        }

        let unbalanced_txs: Vec<UnbalancedTx> = sqlx::query_as!(
            UnbalancedTx,
            r#"
            SELECT
                t.id,
                t.reference,
                COUNT(j.id) AS entry_count,
                COALESCE(SUM(j.debit), 0) AS debit_sum,
                COALESCE(SUM(j.credit), 0) AS credit_sum
            FROM transactions t
            LEFT JOIN journal_entries j ON j.transaction_id = t.id
            GROUP BY t.id, t.reference
            HAVING COUNT(j.id) < 2 OR COALESCE(SUM(j.debit), 0) <> COALESCE(SUM(j.credit), 0)
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        for tx in unbalanced_txs {
            violations.push(ReconciliationViolation {
                violation_type: "TransactionUnbalancedOrIncomplete".into(),
                entity_type: "transaction".into(),
                entity_id: Some(tx.id.to_string()),
                message: format!(
                    "Transaction {} entries are invalid: count={:?}, debits={:?}, credits={:?}",
                    tx.reference, tx.entry_count, tx.debit_sum, tx.credit_sum
                ),
                details: serde_json::json!({
                    "reference": tx.reference,
                    "entry_count": tx.entry_count,
                    "debit_sum": tx.debit_sum.map(|d| d.to_string()),
                    "credit_sum": tx.credit_sum.map(|c| c.to_string()),
                }),
            });
        }

        // 5. Stuck outbox events check
        struct StuckOutbox {
            id: Uuid,
            event_type: String,
            status: String,
            attempts: i32,
        }

        let stuck_outbox: Vec<StuckOutbox> = sqlx::query_as!(
            StuckOutbox,
            r#"
            SELECT id, event_type, status, attempts
            FROM outbox_events
            WHERE (status = 'processing' AND lease_expires_at < now() - INTERVAL '60 seconds')
               OR (status = 'pending' AND created_at < now() - INTERVAL '15 minutes')
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        for st in stuck_outbox {
            violations.push(ReconciliationViolation {
                violation_type: "StuckOutboxEvent".into(),
                entity_type: "outbox_event".into(),
                entity_id: Some(st.id.to_string()),
                message: format!(
                    "Outbox event {} ({}) is stuck in status '{}' after {} attempts",
                    st.id, st.event_type, st.status, st.attempts
                ),
                details: serde_json::json!({
                    "event_id": st.id,
                    "event_type": st.event_type,
                    "status": st.status,
                    "attempts": st.attempts,
                }),
            });
        }

        // Aggregate counts
        let accounts_checked: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM accounts")
            .fetch_one(&self.pool)
            .await?;

        let transactions_checked: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM transactions")
            .fetch_one(&self.pool)
            .await?;

        let entries_checked: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM journal_entries")
            .fetch_one(&self.pool)
            .await?;

        let outbox_checked: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM outbox_events")
            .fetch_one(&self.pool)
            .await?;

        let finished_at = OffsetDateTime::now_utc();
        let duration_ms = ((finished_at - started_at).whole_milliseconds() as i64).max(1);
        let status = if violations.is_empty() { "passed" } else { "failed" };
        let run_id = Uuid::now_v7();
        let violation_count = violations.len() as i32;
        let violations_json = serde_json::to_value(&violations).unwrap_or_default();

        let row = sqlx::query!(
            r#"
            INSERT INTO reconciliation_runs (
                id, status, triggered_by, started_at, finished_at, duration_ms,
                accounts_checked, transactions_checked, entries_checked, outbox_checked,
                violation_count, violations
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10,
                $11, $12
            )
            RETURNING seq
            "#,
            run_id,
            status,
            triggered_by,
            started_at,
            finished_at,
            duration_ms,
            accounts_checked,
            transactions_checked,
            entries_checked,
            outbox_checked,
            violation_count,
            violations_json
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(ReconciliationRunDetail {
            summary: ReconciliationRunSummary {
                id: run_id,
                seq: row.seq,
                status: status.into(),
                triggered_by: triggered_by.into(),
                started_at,
                finished_at,
                duration_ms,
                accounts_checked,
                transactions_checked,
                entries_checked,
                outbox_checked,
                violation_count,
            },
            violations,
        })
    }

    /// Lists past reconciliation runs.
    pub async fn list_runs(
        &self,
        limit: i64,
    ) -> Result<Vec<ReconciliationRunSummary>, AppError> {
        let rows = sqlx::query_as(
            r#"
            SELECT
                id,
                seq,
                status,
                triggered_by,
                started_at,
                finished_at,
                duration_ms,
                accounts_checked,
                transactions_checked,
                entries_checked,
                outbox_checked,
                violation_count
            FROM reconciliation_runs
            ORDER BY seq DESC
            LIMIT $1
            "#,
        )
        .bind(limit.clamp(1, 50))
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Fetches a specific reconciliation run with all violation records.
    pub async fn get_run(&self, id: Uuid) -> Result<ReconciliationRunDetail, AppError> {
        struct RunRow {
            id: Uuid,
            seq: i64,
            status: String,
            triggered_by: String,
            started_at: OffsetDateTime,
            finished_at: OffsetDateTime,
            duration_ms: i64,
            accounts_checked: i64,
            transactions_checked: i64,
            entries_checked: i64,
            outbox_checked: i64,
            violation_count: i32,
            violations: serde_json::Value,
        }

        let row = sqlx::query_as!(
            RunRow,
            r#"
            SELECT
                id,
                seq,
                status,
                triggered_by,
                started_at,
                finished_at,
                duration_ms,
                accounts_checked,
                transactions_checked,
                entries_checked,
                outbox_checked,
                violation_count,
                violations
            FROM reconciliation_runs
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Reconciliation run {} not found", id)))?;

        let violations: Vec<ReconciliationViolation> =
            serde_json::from_value(row.violations).unwrap_or_default();

        Ok(ReconciliationRunDetail {
            summary: ReconciliationRunSummary {
                id: row.id,
                seq: row.seq,
                status: row.status,
                triggered_by: row.triggered_by,
                started_at: row.started_at,
                finished_at: row.finished_at,
                duration_ms: row.duration_ms,
                accounts_checked: row.accounts_checked,
                transactions_checked: row.transactions_checked,
                entries_checked: row.entries_checked,
                outbox_checked: row.outbox_checked,
                violation_count: row.violation_count,
            },
            violations,
        })
    }
}
