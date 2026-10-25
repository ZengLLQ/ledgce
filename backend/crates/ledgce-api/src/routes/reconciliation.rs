use axum::{
    Extension, Json,
    extract::{Path, Query, State},
};
use ledgce_application::model::{ReconciliationRunDetail, ReconciliationRunSummary};
use serde::Deserialize;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::auth::Role;
use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Deserialize, ToSchema)]
pub struct TriggerReconciliationRequest {
    /// Identifier or source triggering the run (defaults to principal name)
    pub triggered_by: Option<String>,
}

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct ReconciliationListQuery {
    /// Number of past runs to retrieve (default: 20, max: 50)
    pub limit: Option<i64>,
}

#[utoipa::path(
    post,
    path = "/api/v1/reconciliation/run",
    tag = "Reconciliation",
    security(
        ("bearer_auth" = [])
    ),
    request_body = Option<TriggerReconciliationRequest>,
    responses(
        (status = 200, description = "Reconciliation run completed with violation analysis", body = ReconciliationRunDetail),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required")
    )
)]
pub async fn trigger_reconciliation(
    State(state): State<AppState>,
    Extension(role): Extension<Role>,
    body: Option<Json<TriggerReconciliationRequest>>,
) -> Result<Json<ReconciliationRunDetail>, ApiError> {
    let triggered_by = body
        .and_then(|b| b.0.triggered_by)
        .unwrap_or_else(|| role.principal_name().to_string());

    let result = state
        .reconciliation
        .run_reconciliation(&triggered_by)
        .await?;
    Ok(Json(result))
}

#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/runs",
    tag = "Reconciliation",
    security(
        ("bearer_auth" = [])
    ),
    params(ReconciliationListQuery),
    responses(
        (status = 200, description = "History of reconciliation runs", body = Vec<ReconciliationRunSummary>),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_reconciliation_runs(
    State(state): State<AppState>,
    Query(query): Query<ReconciliationListQuery>,
) -> Result<Json<Vec<ReconciliationRunSummary>>, ApiError> {
    let limit = query.limit.unwrap_or(20);
    let runs = state.reconciliation.list_runs(limit).await?;
    Ok(Json(runs))
}

#[utoipa::path(
    get,
    path = "/api/v1/reconciliation/runs/{id}",
    tag = "Reconciliation",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Reconciliation run UUID")
    ),
    responses(
        (status = 200, description = "Detailed reconciliation run findings", body = ReconciliationRunDetail),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Reconciliation run not found")
    )
)]
pub async fn get_reconciliation_run(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ReconciliationRunDetail>, ApiError> {
    let detail = state.reconciliation.get_run(id).await?;
    Ok(Json(detail))
}
