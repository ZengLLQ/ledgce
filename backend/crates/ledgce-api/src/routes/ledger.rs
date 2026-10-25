use axum::{
    extract::{Query, State},
    Json,
};
use ledgce_application::model::{EntryFilter, EntryView, Page};
use serde::Deserialize;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct EntryQuery {
    /// Search by transaction reference or entry memo
    pub search: Option<String>,
    /// Filter by account ID
    pub account_id: Option<Uuid>,
    /// Filter by transaction ID
    pub transaction_id: Option<Uuid>,
    /// Filter side: 'debit' or 'credit'
    pub side: Option<String>,
    /// Filter by ISO 4217 currency
    pub currency: Option<String>,
    /// Cursor sequence number
    pub cursor: Option<i64>,
    /// Number of items to return (default: 50, max: 200)
    pub limit: Option<i64>,
}

impl From<EntryQuery> for EntryFilter {
    fn from(q: EntryQuery) -> Self {
        Self {
            search: q.search,
            account_id: q.account_id,
            transaction_id: q.transaction_id,
            side: q.side,
            currency: q.currency,
            cursor: q.cursor,
            limit: q.limit,
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/ledger/entries",
    tag = "Ledger",
    security(
        ("bearer_auth" = [])
    ),
    params(EntryQuery),
    responses(
        (status = 200, description = "Cursor-paginated immutable journal entries", body = Page<EntryView>),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_entries(
    State(state): State<AppState>,
    Query(query): Query<EntryQuery>,
) -> Result<Json<Page<EntryView>>, ApiError> {
    let filter = EntryFilter::from(query);
    let page = state.queries.list_entries(filter).await?;
    Ok(Json(page))
}
