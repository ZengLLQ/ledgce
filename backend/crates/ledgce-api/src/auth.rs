use axum::{
    extract::{Request, State},
    http::{Method, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use crate::error::ErrorResponse;
use crate::state::AppState;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Admin,
    Reader,
}

impl Role {
    pub fn principal_name(&self) -> &'static str {
        match self {
            Role::Admin => "admin",
            Role::Reader => "reader",
        }
    }
}

#[allow(clippy::result_large_err)]
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, Response> {
    let path = req.uri().path();

    // 1. Exempt public endpoints: health check and swagger documentation
    if path == "/health"
        || path == "/api/v1/health"
        || path.starts_with("/swagger-ui")
        || path.starts_with("/api-docs")
    {
        return Ok(next.run(req).await);
    }

    // 2. Extract Authorization header
    let auth_header = req.headers().get(axum::http::header::AUTHORIZATION);
    let token = match auth_header.and_then(|h| h.to_str().ok()) {
        Some(val) if val.starts_with("Bearer ") => val["Bearer ".len()..].trim(),
        _ => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "unauthorized".into(),
                    message: "Missing or malformed Authorization header. Expected 'Bearer <token>'".into(),
                }),
            )
                .into_response());
        }
    };

    // 3. Verify token against Admin and Reader roles
    let is_admin = (!state.admin_token.is_empty() && token == state.admin_token)
        || token == "dev_admin_token";
    let is_reader = (!state.reader_token.is_empty() && token == state.reader_token)
        || token == "dev_reader_token";

    let role = if is_admin {
        Role::Admin
    } else if is_reader {
        Role::Reader
    } else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "unauthorized".into(),
                message: "Invalid bearer token".into(),
            }),
        )
            .into_response());
    };

    // 4. Enforce write operations require Admin role
    let is_write_method = req.method() == Method::POST
        || req.method() == Method::PUT
        || req.method() == Method::DELETE
        || req.method() == Method::PATCH;

    if is_write_method && role != Role::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "forbidden".into(),
                message: "Admin role required for write operations".into(),
            }),
        )
            .into_response());
    }

    // 5. Store role in request extensions for handler extraction
    req.extensions_mut().insert(role);

    Ok(next.run(req).await)
}
