//! Read and write models used across the application and API layers.
//! Amounts are `Decimal` serialised as JSON **strings** to guarantee that
//! no API client ever accidentally parses financial amounts into floating point numbers.

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct Page<T> {
    pub items: Vec<T>,
    /// Opaque cursor for the next (older) page, absent on the last page.
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct AccountView {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub kind: String,
    pub currency: String,
    pub status: String,
    pub synthetic: bool,
    /// Book balance = SUM(credit) - SUM(debit), maintained atomically with posting.
    #[schema(value_type = String, example = "1250.00")]
    pub balance: Decimal,
    pub balance_version: i64,
    #[schema(value_type = String)]
    pub created_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct AccountTotals {
    #[schema(value_type = String)]
    pub total_debits: Decimal,
    #[schema(value_type = String)]
    pub total_credits: Decimal,
    pub entry_count: i64,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct AccountDetail {
    #[serde(flatten)]
    pub account: AccountView,
    pub totals: AccountTotals,
    /// Balance recomputed directly from the journal at read time.
    #[schema(value_type = String)]
    pub journal_balance: Decimal,
    pub projection_matches_journal: bool,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct TransactionSummary {
    pub id: Uuid,
    pub seq: i64,
    pub reference: String,
    pub kind: String,
    pub status: String,
    pub currency: String,
    #[schema(value_type = String)]
    pub amount: Decimal,
    pub source_account_id: Uuid,
    pub source_account_code: String,
    pub destination_account_id: Uuid,
    pub destination_account_code: String,
    pub description: Option<String>,
    pub reverses_transaction_id: Option<Uuid>,
    #[schema(value_type = String)]
    pub created_at: OffsetDateTime,
    #[schema(value_type = String)]
    pub posted_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct EntryView {
    pub id: Uuid,
    pub seq: i64,
    pub transaction_id: Uuid,
    pub transaction_reference: String,
    pub transaction_kind: String,
    pub transaction_status: String,
    pub account_id: Uuid,
    pub account_code: String,
    pub account_name: String,
    pub currency: String,
    #[schema(value_type = String)]
    pub debit: Decimal,
    #[schema(value_type = String)]
    pub credit: Decimal,
    pub memo: Option<String>,
    #[schema(value_type = String)]
    pub posted_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct LifecycleEvent {
    pub id: Uuid,
    pub state: String,
    pub detail: Option<String>,
    #[schema(value_type = String)]
    pub occurred_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct OutboxView {
    pub id: Uuid,
    pub seq: i64,
    pub aggregate_id: Uuid,
    pub event_type: String,
    pub status: String,
    pub attempts: i32,
    #[schema(value_type = String)]
    pub available_at: OffsetDateTime,
    pub locked_by: Option<String>,
    pub last_error: Option<String>,
    #[schema(value_type = String)]
    pub created_at: OffsetDateTime,
    #[schema(value_type = Option<String>)]
    pub processed_at: Option<OffsetDateTime>,
    pub age_seconds: f64,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct TransactionDetail {
    #[serde(flatten)]
    pub summary: TransactionSummary,
    #[schema(value_type = Option<String>)]
    pub published_at: Option<OffsetDateTime>,
    #[schema(value_type = Option<String>)]
    pub processed_at: Option<OffsetDateTime>,
    pub reversed_by_transaction_id: Option<Uuid>,
    pub idempotency_key: Option<String>,
    pub entries: Vec<EntryView>,
    #[schema(value_type = String)]
    pub total_debit: Decimal,
    #[schema(value_type = String)]
    pub total_credit: Decimal,
    pub balanced: bool,
    pub lifecycle: Vec<LifecycleEvent>,
    pub outbox_events: Vec<OutboxView>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct TransferOutcome {
    pub transaction: TransactionDetail,
    pub replayed: bool,
}

// ----------------- Request DTOs -----------------

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct CreateAccountRequest {
    pub code: String,
    pub name: String,
    pub kind: Option<String>,
    pub currency: String,
    pub synthetic: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct InitOpeningBalanceRequest {
    pub account_id: Uuid,
    #[schema(value_type = String, example = "1000.00")]
    pub amount: Decimal,
    pub reference: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct PostTransferRequest {
    pub source_account_id: Uuid,
    pub destination_account_id: Uuid,
    #[schema(value_type = String, example = "250.00")]
    pub amount: Decimal,
    pub currency: String,
    pub reference: Option<String>,
    pub description: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct ReverseTransferRequest {
    pub transaction_id: Uuid,
    pub reason: Option<String>,
    pub idempotency_key: Option<String>,
}

// ----------------- Reconciliation DTOs -----------------

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ReconciliationViolation {
    pub violation_type: String,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub message: String,
    pub details: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct ReconciliationRunSummary {
    pub id: Uuid,
    pub seq: i64,
    pub status: String,
    pub triggered_by: String,
    #[schema(value_type = String)]
    pub started_at: OffsetDateTime,
    #[schema(value_type = String)]
    pub finished_at: OffsetDateTime,
    pub duration_ms: i64,
    pub accounts_checked: i64,
    pub transactions_checked: i64,
    pub entries_checked: i64,
    pub outbox_checked: i64,
    pub violation_count: i32,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ReconciliationRunDetail {
    #[serde(flatten)]
    pub summary: ReconciliationRunSummary,
    pub violations: Vec<ReconciliationViolation>,
}

// ----------------- System & Overview DTOs -----------------

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CurrencyVolume {
    pub currency: String,
    #[schema(value_type = String)]
    pub total_posted_volume: Decimal,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct OverviewStats {
    pub account_count: i64,
    pub transaction_count: i64,
    pub entry_count: i64,
    pub outbox_pending_count: i64,
    pub outbox_dead_count: i64,
    pub volumes: Vec<CurrencyVolume>,
    pub last_reconciliation: Option<ReconciliationRunSummary>,
    pub ledger_balanced: bool,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct WorkerHeartbeatView {
    pub worker_id: String,
    #[schema(value_type = String)]
    pub started_at: OffsetDateTime,
    #[schema(value_type = String)]
    pub last_seen_at: OffsetDateTime,
    pub processed_count: i64,
    pub failed_count: i64,
    pub is_healthy: bool,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct FaultInjectionView {
    pub point: String,
    pub remaining: i32,
    #[schema(value_type = String)]
    pub armed_at: OffsetDateTime,
}

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct ArmFaultRequest {
    pub point: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SystemHealthView {
    pub status: String,
    pub database_connected: bool,
    pub ledger_invariants_pass: bool,
    pub outbox_backlog: i64,
    pub dead_letter_count: i64,
    pub workers: Vec<WorkerHeartbeatView>,
    pub active_faults: Vec<FaultInjectionView>,
}

// ----------------- Filter DTOs -----------------

#[derive(Debug, Clone, Default, Deserialize)]
pub struct AccountFilter {
    pub search: Option<String>,
    pub kind: Option<String>,
    pub currency: Option<String>,
    pub status: Option<String>,
    pub sort: Option<String>,
    pub descending: Option<bool>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct AccountPage {
    pub items: Vec<AccountView>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct TransactionFilter {
    pub search: Option<String>,
    pub status: Option<String>,
    pub kind: Option<String>,
    pub currency: Option<String>,
    pub account_id: Option<Uuid>,
    pub cursor: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct EntryFilter {
    pub search: Option<String>,
    pub account_id: Option<Uuid>,
    pub transaction_id: Option<Uuid>,
    pub side: Option<String>,
    pub currency: Option<String>,
    pub cursor: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct OutboxFilter {
    pub status: Option<String>,
    pub cursor: Option<i64>,
    pub limit: Option<i64>,
}
