pub mod accounts;
pub mod health;
pub mod ledger;
pub mod outbox;
pub mod reconciliation;
pub mod transfers;

use crate::state::AppState;
use axum::{
    Router,
    routing::{get, post},
};

pub fn create_v1_router() -> Router<AppState> {
    Router::new()
        // Health & System
        .route("/health", get(health::live_health))
        .route("/ready", get(health::ready_check))
        .route("/overview", get(health::get_overview))
        .route("/system/health", get(health::get_system_health))
        .route("/system/faults/arm", post(health::arm_fault))
        .route("/system/faults/clear", post(health::clear_faults))
        // Accounts
        .route(
            "/accounts",
            get(accounts::list_accounts).post(accounts::create_account),
        )
        .route(
            "/accounts/opening-balance",
            post(accounts::init_opening_balance),
        )
        .route("/accounts/{id}", get(accounts::get_account))
        .route("/accounts/{id}/balance", get(accounts::get_account_balance))
        // Transfers
        .route(
            "/transfers",
            get(transfers::list_transfers).post(transfers::post_transfer),
        )
        .route("/transfers/reversal", post(transfers::reverse_transfer))
        .route("/transfers/{id}", get(transfers::get_transfer))
        // Ledger
        .route("/ledger/entries", get(ledger::list_entries))
        .route("/ledger/entries/{id}", get(ledger::get_entry))
        .route(
            "/ledger/accounts/{account_id}/entries",
            get(ledger::list_account_entries),
        )
        // Reconciliation
        .route(
            "/reconciliation/run",
            post(reconciliation::trigger_reconciliation),
        )
        .route(
            "/reconciliation/runs",
            get(reconciliation::list_reconciliation_runs)
                .post(reconciliation::trigger_reconciliation),
        )
        .route(
            "/reconciliation/runs/{id}",
            get(reconciliation::get_reconciliation_run),
        )
        // Outbox & Events
        .route("/events", get(outbox::list_outbox_events))
        .route("/events/{id}", get(outbox::get_outbox_event))
        .route("/outbox/events", get(outbox::list_outbox_events))
        .route("/outbox/events/{id}", get(outbox::get_outbox_event))
        .route(
            "/outbox/events/{id}/requeue",
            post(outbox::requeue_outbox_event),
        )
        .route("/outbox/process-batch", post(outbox::process_outbox_batch))
}
