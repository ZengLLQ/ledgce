use rust_decimal::Decimal;
use sqlx::PgPool;

use crate::error::AppError;
use crate::model::{
    CurrencyVolume, EntryFilter, EntryView, OverviewStats, Page, ReconciliationRunSummary,
    TransactionFilter, TransactionSummary,
};

#[derive(Clone)]
pub struct LedgerQueryService {
    pool: PgPool,
}

impl LedgerQueryService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Queries transactions with filtering and keyset cursor-based pagination.
    pub async fn list_transactions(
        &self,
        filter: TransactionFilter,
    ) -> Result<Page<TransactionSummary>, AppError> {
        let limit = filter.limit.unwrap_or(25).clamp(1, 100);
        let fetch_limit = limit + 1;
        let search_pattern = filter.search.as_ref().map(|s| format!("%{}%", s));

        let mut items: Vec<TransactionSummary> = sqlx::query_as(
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
            WHERE ($1::bigint IS NULL OR t.seq < $1)
              AND ($2::text IS NULL OR t.reference ILIKE $2 OR t.description ILIKE $2)
              AND ($3::text IS NULL OR t.status = $3)
              AND ($4::text IS NULL OR t.kind = $4)
              AND ($5::text IS NULL OR t.currency = $5)
              AND ($6::uuid IS NULL OR t.source_account_id = $6 OR t.destination_account_id = $6)
            ORDER BY t.seq DESC
            LIMIT $7
            "#,
        )
        .bind(filter.cursor)
        .bind(&search_pattern)
        .bind(&filter.status)
        .bind(&filter.kind)
        .bind(&filter.currency)
        .bind(filter.account_id)
        .bind(fetch_limit)
        .fetch_all(&self.pool)
        .await?;

        let has_more = items.len() as i64 > limit;
        if has_more {
            items.pop();
        }

        let next_cursor = if has_more {
            items.last().map(|tx| tx.seq.to_string())
        } else {
            None
        };

        Ok(Page {
            items,
            next_cursor,
            has_more,
        })
    }

    /// Queries journal entries with keyset cursor-based pagination.
    pub async fn list_entries(&self, filter: EntryFilter) -> Result<Page<EntryView>, AppError> {
        let limit = filter.limit.unwrap_or(25).clamp(1, 100);
        let fetch_limit = limit + 1;
        let search_pattern = filter.search.as_ref().map(|s| format!("%{}%", s));

        let mut items: Vec<EntryView> = sqlx::query_as(
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
            WHERE ($1::bigint IS NULL OR j.seq < $1)
              AND ($2::text IS NULL OR t.reference ILIKE $2 OR j.memo ILIKE $2 OR a.code ILIKE $2)
              AND ($3::uuid IS NULL OR j.account_id = $3)
              AND ($4::uuid IS NULL OR j.transaction_id = $4)
              AND ($5::text IS NULL OR ($5 = 'debit' AND j.debit > 0) OR ($5 = 'credit' AND j.credit > 0))
              AND ($6::text IS NULL OR j.currency = $6)
            ORDER BY j.seq DESC
            LIMIT $7
            "#,
        )
        .bind(filter.cursor)
        .bind(&search_pattern)
        .bind(filter.account_id)
        .bind(filter.transaction_id)
        .bind(&filter.side)
        .bind(&filter.currency)
        .bind(fetch_limit)
        .fetch_all(&self.pool)
        .await?;

        let has_more = items.len() as i64 > limit;
        if has_more {
            items.pop();
        }

        let next_cursor = if has_more {
            items.last().map(|entry| entry.seq.to_string())
        } else {
            None
        };

        Ok(Page {
            items,
            next_cursor,
            has_more,
        })
    }

    /// Computes platform overview metrics and ledger integrity status.
    pub async fn get_overview(&self) -> Result<OverviewStats, AppError> {
        let account_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM accounts")
                .fetch_one(&self.pool)
                .await?;

        let transaction_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM transactions")
                .fetch_one(&self.pool)
                .await?;

        let entry_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM journal_entries")
                .fetch_one(&self.pool)
                .await?;

        let outbox_pending_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM outbox_events WHERE status IN ('pending', 'processing')",
        )
        .fetch_one(&self.pool)
        .await?;

        let outbox_dead_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM outbox_events WHERE status = 'dead'")
                .fetch_one(&self.pool)
                .await?;

        struct VolumeRow {
            currency: String,
            total_posted_volume: Decimal,
            transaction_count: i64,
        }

        let volume_rows: Vec<VolumeRow> = sqlx::query_as!(
            VolumeRow,
            r#"
            SELECT
                currency,
                COALESCE(SUM(amount), 0) AS "total_posted_volume!",
                COUNT(*) AS "transaction_count!"
            FROM transactions
            GROUP BY currency
            ORDER BY currency ASC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        let volumes = volume_rows
            .into_iter()
            .map(|r| CurrencyVolume {
                currency: r.currency,
                total_posted_volume: r.total_posted_volume,
                transaction_count: r.transaction_count,
            })
            .collect();

        let last_reconciliation: Option<ReconciliationRunSummary> = sqlx::query_as(
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
            LIMIT 1
            "#,
        )
        .fetch_optional(&self.pool)
        .await?;

        // Fast invariant check: sum(debit) == sum(credit) across every currency
        let unbalanced_currencies: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*) FROM (
                SELECT currency FROM journal_entries
                GROUP BY currency
                HAVING SUM(debit) <> SUM(credit)
            ) sub
            "#,
        )
        .fetch_one(&self.pool)
        .await?;

        let ledger_balanced = unbalanced_currencies == 0;

        Ok(OverviewStats {
            account_count,
            transaction_count,
            entry_count,
            outbox_pending_count,
            outbox_dead_count,
            volumes,
            last_reconciliation,
            ledger_balanced,
        })
    }
}
