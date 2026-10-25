use axum::{
    Extension, Json,
    extract::{Path, Query, State},
};
use ledgce_application::model::{
    AccountDetail, AccountFilter, AccountPage, AccountView, CreateAccountRequest,
    InitOpeningBalanceRequest, TransferOutcome,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::auth::Role;
use crate::error::ApiError;
use crate::state::AppState;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct AccountQuery {
    /// Substring search on account code or name
    pub search: Option<String>,
    /// Filter by account kind: 'customer' or 'system'
    pub kind: Option<String>,
    /// Filter by ISO 4217 currency code (e.g. USD, EUR)
    pub currency: Option<String>,
    /// Filter by account status (e.g. active)
    pub status: Option<String>,
    /// Sort column
    pub sort: Option<String>,
    /// Sort order descending if true
    pub descending: Option<bool>,
    /// 1-based page number (default: 1)
    pub page: Option<i64>,
    /// Items per page (default: 20, max: 100)
    pub page_size: Option<i64>,
}

impl From<AccountQuery> for AccountFilter {
    fn from(q: AccountQuery) -> Self {
        Self {
            search: q.search,
            kind: q.kind,
            currency: q.currency,
            status: q.status,
            sort: q.sort,
            descending: q.descending,
            page: q.page,
            page_size: q.page_size,
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/accounts",
    tag = "Accounts",
    security(
        ("bearer_auth" = [])
    ),
    params(AccountQuery),
    responses(
        (status = 200, description = "Paginated list of accounts", body = AccountPage),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_accounts(
    State(state): State<AppState>,
    Query(query): Query<AccountQuery>,
) -> Result<Json<AccountPage>, ApiError> {
    let filter = AccountFilter::from(query);
    let page = state.accounts.list_accounts(filter).await?;
    Ok(Json(page))
}

#[utoipa::path(
    post,
    path = "/api/v1/accounts",
    tag = "Accounts",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateAccountRequest,
    responses(
        (status = 200, description = "Account created successfully", body = AccountView),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required"),
        (status = 409, description = "Account code conflict")
    )
)]
pub async fn create_account(
    State(state): State<AppState>,
    Extension(role): Extension<Role>,
    Json(req): Json<CreateAccountRequest>,
) -> Result<Json<AccountView>, ApiError> {
    let account = state
        .accounts
        .create_account(req, role.principal_name())
        .await?;
    Ok(Json(account))
}

#[utoipa::path(
    get,
    path = "/api/v1/accounts/{id}",
    tag = "Accounts",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Account UUID")
    ),
    responses(
        (status = 200, description = "Detailed account view with journal verification", body = AccountDetail),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Account not found")
    )
)]
pub async fn get_account(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountDetail>, ApiError> {
    let account = state.accounts.get_account(id).await?;
    Ok(Json(account))
}

#[utoipa::path(
    post,
    path = "/api/v1/accounts/opening-balance",
    tag = "Accounts",
    security(
        ("bearer_auth" = [])
    ),
    request_body = InitOpeningBalanceRequest,
    responses(
        (status = 200, description = "Opening balance injected from system equity", body = TransferOutcome),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden - Admin required"),
        (status = 404, description = "Target account not found")
    )
)]
pub async fn init_opening_balance(
    State(state): State<AppState>,
    Extension(role): Extension<Role>,
    Json(req): Json<InitOpeningBalanceRequest>,
) -> Result<Json<TransferOutcome>, ApiError> {
    let outcome = state
        .accounts
        .init_opening_balance(req, role.principal_name())
        .await?;
    Ok(Json(outcome))
}

#[derive(Debug, Serialize, ToSchema)]
pub struct AccountBalanceView {
    pub account_id: Uuid,
    pub code: String,
    pub currency: String,
    #[schema(value_type = String)]
    pub balance: Decimal,
    pub version: i64,
    #[schema(value_type = String)]
    pub journal_balance: Decimal,
    pub projection_matches_journal: bool,
}

#[utoipa::path(
    get,
    path = "/api/v1/accounts/{id}/balance",
    tag = "Accounts",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Account UUID")
    ),
    responses(
        (status = 200, description = "Current balance and projection audit", body = AccountBalanceView),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Account not found")
    )
)]
pub async fn get_account_balance(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountBalanceView>, ApiError> {
    let detail = state.accounts.get_account(id).await?;
    Ok(Json(AccountBalanceView {
        account_id: detail.account.id,
        code: detail.account.code,
        currency: detail.account.currency,
        balance: detail.account.balance,
        version: detail.account.balance_version,
        journal_balance: detail.journal_balance,
        projection_matches_journal: detail.projection_matches_journal,
    }))
}
