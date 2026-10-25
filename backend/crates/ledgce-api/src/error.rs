use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use ledgce_application::error::AppError;
use ledgce_domain::DomainError;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

#[derive(Debug)]
pub struct ApiError(pub AppError);

impl From<AppError> for ApiError {
    fn from(err: AppError) -> Self {
        ApiError(err)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, err_type, message) = match &self.0 {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "validation", msg.clone()),
            AppError::IdempotencyKeyReuse => (
                StatusCode::CONFLICT,
                "idempotency_key_reuse",
                "Idempotency key was already used with a different request payload".into(),
            ),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "conflict", msg.clone()),
            AppError::InsufficientFundsDetectedByDatabase => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "insufficient_funds",
                "Insufficient funds".into(),
            ),
            AppError::Domain(DomainError::InsufficientFunds {
                available,
                requested,
            }) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "insufficient_funds",
                format!(
                    "Insufficient funds: available {}, requested {}",
                    available, requested
                ),
            ),
            AppError::Domain(DomainError::CurrencyMismatch { expected, found }) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "currency_mismatch",
                format!("Currency mismatch: expected {}, found {}", expected, found),
            ),
            AppError::Domain(err) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "domain_error",
                err.to_string(),
            ),
            AppError::Database(err) => {
                tracing::error!(error = %err, "Database error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database_error",
                    "An internal database error occurred".into(),
                )
            }
        };

        (
            status,
            Json(ErrorResponse {
                error: err_type.to_string(),
                message,
            }),
        )
            .into_response()
    }
}
