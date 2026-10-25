use axum::{Json, extract::State};
use ledgce_application::model::{
    ArmFaultRequest, FaultInjectionView, OverviewStats, SystemHealthView,
};
use serde::Serialize;
use utoipa::ToSchema;

use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthCheckResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ReadinessResponse {
    pub status: String,
    pub database: String,
    pub pool_size: u32,
    pub pool_idle: usize,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ClearFaultsResponse {
    pub status: String,
}

#[utoipa::path(
    get,
    path = "/api/v1/health",
    tag = "System",
    responses(
        (status = 200, description = "Service is live and healthy", body = HealthCheckResponse)
    )
)]
pub async fn live_health() -> Json<HealthCheckResponse> {
    Json(HealthCheckResponse {
        status: "ok".into(),
        service: "ledgce-api".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    })
}

#[utoipa::path(
    get,
    path = "/api/v1/ready",
    tag = "System",
    responses(
        (status = 200, description = "Service is ready to accept traffic", body = ReadinessResponse),
        (status = 503, description = "Service is not ready (e.g. database down)")
    )
)]
pub async fn ready_check(
    State(state): State<AppState>,
) -> Result<Json<ReadinessResponse>, ApiError> {
    match sqlx::query("SELECT 1").execute(&state.pool).await {
        Ok(_) => Ok(Json(ReadinessResponse {
            status: "ready".into(),
            database: "connected".into(),
            pool_size: state.pool.size(),
            pool_idle: state.pool.num_idle(),
        })),
        Err(e) => {
            tracing::error!(error = %e, "Readiness check failed - database connection unavailable");
            Err(ApiError(ledgce_application::AppError::Database(e)))
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/overview",
    tag = "System",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "Ledger overview statistics", body = OverviewStats),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn get_overview(State(state): State<AppState>) -> Result<Json<OverviewStats>, ApiError> {
    let overview = state.queries.get_overview().await?;
    Ok(Json(overview))
}

#[utoipa::path(
    get,
    path = "/api/v1/system/health",
    tag = "System",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "Comprehensive system and worker health", body = SystemHealthView),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn get_system_health(
    State(state): State<AppState>,
) -> Result<Json<SystemHealthView>, ApiError> {
    let health = state.system.get_health().await?;
    Ok(Json(health))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/faults/arm",
    tag = "System",
    security(
        ("bearer_auth" = [])
    ),
    request_body = ArmFaultRequest,
    responses(
        (status = 200, description = "Fault injection armed successfully", body = FaultInjectionView),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required")
    )
)]
pub async fn arm_fault(
    State(state): State<AppState>,
    Json(req): Json<ArmFaultRequest>,
) -> Result<Json<FaultInjectionView>, ApiError> {
    let view = state.system.arm_fault(req).await?;
    Ok(Json(view))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/faults/clear",
    tag = "System",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "All active fault injections cleared", body = ClearFaultsResponse),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required")
    )
)]
pub async fn clear_faults(
    State(state): State<AppState>,
) -> Result<Json<ClearFaultsResponse>, ApiError> {
    state.system.clear_faults().await?;
    Ok(Json(ClearFaultsResponse {
        status: "cleared".into(),
    }))
}
