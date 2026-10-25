#![allow(clippy::unwrap_used)]

use axum::{
    Router,
    body::Body,
    http::{Method, Request, StatusCode, header},
    middleware,
    routing::{get, post},
};
use http_body_util::BodyExt;
use ledgce_api::auth::{Role, auth_middleware};
use ledgce_api::state::AppState;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;

// Helper to construct a lightweight test router with auth middleware
fn build_test_router(admin_token: &str, reader_token: &str) -> Router {
    // Construct dummy AppState with disconnected pool (state is only used for tokens in auth middleware)
    let pool = PgPoolOptions::new()
        .connect_lazy("postgres://localhost/test")
        .unwrap();
    let state = AppState::new(pool, admin_token.into(), reader_token.into());

    Router::new()
        .route("/api/v1/health", get(|| async { "health_ok" }))
        .route(
            "/api/v1/read-data",
            get(|axum::Extension(role): axum::Extension<Role>| async move {
                format!("read:{}", role.principal_name())
            }),
        )
        .route(
            "/api/v1/write-data",
            post(|axum::Extension(role): axum::Extension<Role>| async move {
                format!("written:{}", role.principal_name())
            }),
        )
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .with_state(state)
}

#[tokio::test]
async fn test_public_health_check_exempt_from_auth() {
    let app = build_test_router("admin_secret", "reader_secret");

    let req = Request::builder()
        .uri("/api/v1/health")
        .body(Body::empty())
        .unwrap();

    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_missing_auth_header_rejected() {
    let app = build_test_router("admin_secret", "reader_secret");

    let req = Request::builder()
        .uri("/api/v1/read-data")
        .body(Body::empty())
        .unwrap();

    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_invalid_bearer_token_rejected() {
    let app = build_test_router("admin_secret", "reader_secret");

    let req = Request::builder()
        .uri("/api/v1/read-data")
        .header(header::AUTHORIZATION, "Bearer wrong_token")
        .body(Body::empty())
        .unwrap();

    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_reader_token_allows_read_denies_write() {
    let app = build_test_router("admin_secret", "reader_secret");

    // 1. GET with reader token should succeed
    let read_req = Request::builder()
        .uri("/api/v1/read-data")
        .header(header::AUTHORIZATION, "Bearer reader_secret")
        .body(Body::empty())
        .unwrap();

    let read_res = app.clone().oneshot(read_req).await.unwrap();
    assert_eq!(read_res.status(), StatusCode::OK);
    let body_bytes = read_res.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(&body_bytes[..], b"read:reader");

    // 2. POST with reader token should fail with 403 Forbidden
    let write_req = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/write-data")
        .header(header::AUTHORIZATION, "Bearer reader_secret")
        .body(Body::empty())
        .unwrap();

    let write_res = app.oneshot(write_req).await.unwrap();
    assert_eq!(write_res.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_admin_token_allows_read_and_write() {
    let app = build_test_router("admin_secret", "reader_secret");

    // 1. GET with admin token
    let read_req = Request::builder()
        .uri("/api/v1/read-data")
        .header(header::AUTHORIZATION, "Bearer admin_secret")
        .body(Body::empty())
        .unwrap();

    let read_res = app.clone().oneshot(read_req).await.unwrap();
    assert_eq!(read_res.status(), StatusCode::OK);
    let body_bytes = read_res.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(&body_bytes[..], b"read:admin");

    // 2. POST with admin token
    let write_req = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/write-data")
        .header(header::AUTHORIZATION, "Bearer admin_secret")
        .body(Body::empty())
        .unwrap();

    let write_res = app.oneshot(write_req).await.unwrap();
    assert_eq!(write_res.status(), StatusCode::OK);
    let body_bytes = write_res.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(&body_bytes[..], b"written:admin");
}

#[tokio::test]
async fn test_dev_tokens_fallback() {
    // Both env tokens empty
    let app = build_test_router("", "");

    // 1. dev_reader_token allows read
    let req1 = Request::builder()
        .uri("/api/v1/read-data")
        .header(header::AUTHORIZATION, "Bearer dev_reader_token")
        .body(Body::empty())
        .unwrap();
    let res1 = app.clone().oneshot(req1).await.unwrap();
    assert_eq!(res1.status(), StatusCode::OK);

    // 2. dev_reader_token denies write
    let req2 = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/write-data")
        .header(header::AUTHORIZATION, "Bearer dev_reader_token")
        .body(Body::empty())
        .unwrap();
    let res2 = app.clone().oneshot(req2).await.unwrap();
    assert_eq!(res2.status(), StatusCode::FORBIDDEN);

    // 3. dev_admin_token allows write
    let req3 = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/write-data")
        .header(header::AUTHORIZATION, "Bearer dev_admin_token")
        .body(Body::empty())
        .unwrap();
    let res3 = app.oneshot(req3).await.unwrap();
    assert_eq!(res3.status(), StatusCode::OK);
}
