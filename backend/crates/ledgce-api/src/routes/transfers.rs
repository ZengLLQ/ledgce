use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use ledgce_application::model::{
    Page, PostTransferRequest, ReverseTransferRequest, TransactionDetail, TransactionFilter,
    TransactionSummary, TransferOutcome,
};
use serde::Deserialize;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::auth::Role;
use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct TransferQuery {
    /// Substring search on reference or description
    pub search: Option<String>,
    /// Filter by status: 'posted', 'reversed', etc.
    pub status: Option<String>,
    /// Filter by transaction kind: 'transfer', 'reversal', etc.
    pub kind: Option<String>,
    /// Filter by ISO 4217 currency
    pub currency: Option<String>,
    /// Filter transactions involving this account ID
    pub account_id: Option<Uuid>,
    /// Cursor sequence number for pagination
    pub cursor: Option<i64>,
    /// Limit (default: 20, max: 100)
    pub limit: Option<i64>,
}

impl From<TransferQuery> for TransactionFilter {
    fn from(q: TransferQuery) -> Self {
        Self {
            search: q.search,
            status: q.status,
            kind: q.kind,
            currency: q.currency,
            account_id: q.account_id,
            cursor: q.cursor,
            limit: q.limit,
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/transfers",
    tag = "Transfers",
    security(
        ("bearer_auth" = [])
    ),
    params(TransferQuery),
    responses(
        (status = 200, description = "Cursor-paginated transactions list", body = Page<TransactionSummary>),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_transfers(
    State(state): State<AppState>,
    Query(query): Query<TransferQuery>,
) -> Result<Json<Page<TransactionSummary>>, ApiError> {
    let filter = TransactionFilter::from(query);
    let page = state.queries.list_transactions(filter).await?;
    Ok(Json(page))
}

#[utoipa::path(
    post,
    path = "/api/v1/transfers",
    tag = "Transfers",
    security(
        ("bearer_auth" = [])
    ),
    request_body = PostTransferRequest,
    responses(
        (status = 200, description = "Transfer posted atomically with double-entry journal", body = TransferOutcome),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required"),
        (status = 409, description = "Idempotency key reuse with mismatched payload"),
        (status = 422, description = "Insufficient funds or currency mismatch")
    )
)]
pub async fn post_transfer(
    State(state): State<AppState>,
    Extension(role): Extension<Role>,
    Json(req): Json<PostTransferRequest>,
) -> Result<Json<TransferOutcome>, ApiError> {
    let outcome = state
        .transfers
        .post_transfer(req, role.principal_name())
        .await?;
    Ok(Json(outcome))
}

#[utoipa::path(
    get,
    path = "/api/v1/transfers/{id}",
    tag = "Transfers",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Transaction UUID")
    ),
    responses(
        (status = 200, description = "Full transaction detail including journal entries and outbox events", body = TransactionDetail),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Transaction not found")
    )
)]
pub async fn get_transfer(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<TransactionDetail>, ApiError> {
    let detail = state.transfers.get_transaction(id).await?;
    Ok(Json(detail))
}

#[utoipa::path(
    post,
    path = "/api/v1/transfers/reversal",
    tag = "Transfers",
    security(
        ("bearer_auth" = [])
    ),
    request_body = ReverseTransferRequest,
    responses(
        (status = 200, description = "Transfer reversed with opposing double-entry entries", body = TransferOutcome),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required"),
        (status = 404, description = "Transaction not found"),
        (status = 409, description = "Already reversed or conflict"),
        (status = 422, description = "Insufficient funds to execute reversal")
    )
)]
pub async fn reverse_transfer(
    State(state): State<AppState>,
    Extension(role): Extension<Role>,
    Json(req): Json<ReverseTransferRequest>,
) -> Result<Json<TransferOutcome>, ApiError> {
    let outcome = state
        .transfers
        .reverse_transfer(req, role.principal_name())
        .await?;
    Ok(Json(outcome))
}
