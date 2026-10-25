use axum::{
    Json,
    extract::{Path, Query, State},
};
use ledgce_application::model::{OutboxFilter, OutboxView, Page};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct OutboxQuery {
    /// Filter by outbox status: 'pending', 'processing', 'completed', 'dead'
    pub status: Option<String>,
    /// Cursor sequence number
    pub cursor: Option<i64>,
    /// Limit (default: 50, max: 200)
    pub limit: Option<i64>,
}

impl From<OutboxQuery> for OutboxFilter {
    fn from(q: OutboxQuery) -> Self {
        Self {
            status: q.status,
            cursor: q.cursor,
            limit: q.limit,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct ProcessBatchRequest {
    /// Number of events to claim and process (default: 25, max: 100)
    pub batch_size: Option<i64>,
    /// Lease duration in seconds (default: 30)
    pub lease_seconds: Option<i64>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ProcessBatchResponse {
    pub processed: usize,
}

#[utoipa::path(
    get,
    path = "/api/v1/outbox/events",
    tag = "Outbox",
    security(
        ("bearer_auth" = [])
    ),
    params(OutboxQuery),
    responses(
        (status = 200, description = "Cursor-paginated transactional outbox events", body = Page<OutboxView>),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_outbox_events(
    State(state): State<AppState>,
    Query(query): Query<OutboxQuery>,
) -> Result<Json<Page<OutboxView>>, ApiError> {
    let filter = OutboxFilter::from(query);
    let page = state.outbox.list_events(filter).await?;
    Ok(Json(page))
}

#[utoipa::path(
    get,
    path = "/api/v1/events/{id}",
    tag = "Events",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Event UUID")
    ),
    responses(
        (status = 200, description = "Event details", body = OutboxView),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Event not found")
    )
)]
pub async fn get_outbox_event(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<OutboxView>, ApiError> {
    let event = state.outbox.get_event(id).await?;
    Ok(Json(event))
}

#[utoipa::path(
    post,
    path = "/api/v1/outbox/events/{id}/requeue",
    tag = "Outbox",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Outbox event UUID to requeue")
    ),
    responses(
        (status = 200, description = "Dead-letter outbox event requeued as pending", body = OutboxView),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required"),
        (status = 404, description = "Outbox event not found"),
        (status = 409, description = "Event is not in dead-letter status")
    )
)]
pub async fn requeue_outbox_event(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<OutboxView>, ApiError> {
    let updated = state.outbox.requeue_dead(id).await?;
    Ok(Json(updated))
}

#[utoipa::path(
    post,
    path = "/api/v1/outbox/process-batch",
    tag = "Outbox",
    security(
        ("bearer_auth" = [])
    ),
    request_body = Option<ProcessBatchRequest>,
    responses(
        (status = 200, description = "Manual batch execution result", body = ProcessBatchResponse),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required")
    )
)]
pub async fn process_outbox_batch(
    State(state): State<AppState>,
    body: Option<Json<ProcessBatchRequest>>,
) -> Result<Json<ProcessBatchResponse>, ApiError> {
    let req = body.map(|b| b.0).unwrap_or(ProcessBatchRequest {
        batch_size: None,
        lease_seconds: None,
    });

    let batch_size = req.batch_size.unwrap_or(25);
    let lease_seconds = req.lease_seconds.unwrap_or(30);

    let processed = state
        .outbox
        .process_next_batch("api-manual-trigger", batch_size, lease_seconds)
        .await?;

    Ok(Json(ProcessBatchResponse { processed }))
}
