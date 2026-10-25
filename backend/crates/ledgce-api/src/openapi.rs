use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

use ledgce_application::model::{
    AccountDetail, AccountPage, AccountTotals, AccountView, ArmFaultRequest, CreateAccountRequest,
    CurrencyVolume, EntryView, FaultInjectionView, InitOpeningBalanceRequest, LifecycleEvent,
    OutboxView, OverviewStats, Page, PostTransferRequest, ReconciliationRunDetail,
    ReconciliationRunSummary, ReconciliationViolation, ReverseTransferRequest, SystemHealthView,
    TransactionDetail, TransactionSummary, TransferOutcome, WorkerHeartbeatView,
};

use crate::error::ErrorResponse;
use crate::routes::{
    accounts,
    health::{self, ClearFaultsResponse, HealthCheckResponse},
    ledger,
    outbox::{self, ProcessBatchRequest, ProcessBatchResponse},
    reconciliation::{self, TriggerReconciliationRequest},
    transfers,
};

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("API Token")
                        .description(Some(
                            "Enter admin bearer token (e.g. dev_admin_token) or reader token (e.g. dev_reader_token)",
                        ))
                        .build(),
                ),
            );
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health::live_health,
        health::get_overview,
        health::get_system_health,
        health::arm_fault,
        health::clear_faults,
        accounts::list_accounts,
        accounts::create_account,
        accounts::get_account,
        accounts::init_opening_balance,
        transfers::list_transfers,
        transfers::post_transfer,
        transfers::get_transfer,
        transfers::reverse_transfer,
        ledger::list_entries,
        reconciliation::trigger_reconciliation,
        reconciliation::list_reconciliation_runs,
        reconciliation::get_reconciliation_run,
        outbox::list_outbox_events,
        outbox::requeue_outbox_event,
        outbox::process_outbox_batch,
    ),
    components(
        schemas(
            AccountView,
            AccountTotals,
            AccountDetail,
            AccountPage,
            CreateAccountRequest,
            InitOpeningBalanceRequest,
            TransactionSummary,
            TransactionDetail,
            TransferOutcome,
            PostTransferRequest,
            ReverseTransferRequest,
            EntryView,
            Page<EntryView>,
            Page<TransactionSummary>,
            Page<OutboxView>,
            LifecycleEvent,
            OutboxView,
            ReconciliationViolation,
            ReconciliationRunSummary,
            ReconciliationRunDetail,
            TriggerReconciliationRequest,
            CurrencyVolume,
            OverviewStats,
            WorkerHeartbeatView,
            FaultInjectionView,
            ArmFaultRequest,
            SystemHealthView,
            HealthCheckResponse,
            ClearFaultsResponse,
            ProcessBatchRequest,
            ProcessBatchResponse,
            ErrorResponse,
        )
    ),
    modifiers(&SecurityAddon),
    info(
        title = "Ledgce Core Ledger API",
        version = "0.1.0",
        description = "Production-grade, double-entry financial ledger engine with transactional outbox, automated reconciliation, and invariant enforcement."
    ),
    tags(
        (name = "System", description = "System metrics, live health checks, and fault injection control"),
        (name = "Accounts", description = "Account creation, retrieval, and opening balance seeding"),
        (name = "Transfers", description = "Atomic double-entry money transfers and reversals"),
        (name = "Ledger", description = "Immutable audit journal entries and inspection"),
        (name = "Reconciliation", description = "Continuous automated reconciliation runs and invariant verification"),
        (name = "Outbox", description = "Transactional outbox events queue and manual dispatch")
    )
)]
pub struct ApiDoc;
