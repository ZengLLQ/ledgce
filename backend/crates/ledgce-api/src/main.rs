use axum::{
    Router,
    http::{HeaderValue, Method, header},
};
use ledgce_api::auth;
use ledgce_api::openapi::ApiDoc;
use ledgce_api::routes;
use ledgce_api::state::AppState;
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Load environment variables
    dotenvy::dotenv().ok();

    // 2. Setup structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "info,ledgce_api=debug,ledgce_application=debug,tower_http=debug".into()
            }),
        )
        .json()
        .init();

    tracing::info!("Starting Ledgce Core API Service...");

    // 3. Environment configuration
    let bind_addr = std::env::var("LEDGCE_API_BIND").unwrap_or_else(|_| "127.0.0.1:8080".into());
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://ledgce:ledgce_local_dev@127.0.0.1:5433/ledgce".into());
    let admin_token = std::env::var("LEDGCE_ADMIN_TOKEN").unwrap_or_default();
    let reader_token = std::env::var("LEDGCE_READER_TOKEN").unwrap_or_default();
    let cors_origins_env = std::env::var("LEDGCE_CORS_ORIGINS").unwrap_or_else(|_| "*".into());

    // 4. Database pool initialization
    let pool = PgPoolOptions::new()
        .max_connections(25)
        .acquire_timeout(Duration::from_secs(10))
        .connect(&database_url)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to connect to database");
            e
        })?;

    // 5. Run database migrations
    if let Err(e) = ledgce_application::db::run_migrations(&pool).await {
        tracing::warn!(error = %e, "Database migration check produced an error or already completed");
    }

    // 6. Observability metrics & Application state
    let prometheus_handle = ledgce_observability::init_metrics().ok();
    if prometheus_handle.is_some() {
        tracing::info!("Prometheus metrics recorder initialized");
    }

    let state = AppState::new(pool, admin_token, reader_token).with_prometheus(prometheus_handle);

    // 7. CORS configuration
    let cors = if cors_origins_env == "*" {
        CorsLayer::new().allow_origin(tower_http::cors::Any)
    } else {
        let origins: Vec<HeaderValue> = cors_origins_env
            .split(',')
            .filter_map(|s| s.trim().parse::<HeaderValue>().ok())
            .collect();
        CorsLayer::new().allow_origin(origins)
    }
    .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::DELETE,
        Method::OPTIONS,
    ])
    .allow_headers([
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
        header::HeaderName::from_static("x-idempotency-key"),
    ]);

    // 8. Swagger UI & OpenAPI spec
    let openapi = ApiDoc::openapi();
    let swagger = SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", openapi.clone());

    // 9. API v1 router with auth middleware
    let v1_router = routes::create_v1_router().layer(axum::middleware::from_fn_with_state(
        state.clone(),
        auth::auth_middleware,
    ));

    // 10. Combine root application with root endpoints (health, ready, metrics)
    let app = Router::new()
        .route("/health", axum::routing::get(routes::health::live_health))
        .route("/ready", axum::routing::get(routes::health::ready_check))
        .route("/metrics", axum::routing::get(metrics_handler))
        .merge(swagger)
        .nest("/api/v1", v1_router)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // 11. Bind and serve with graceful shutdown
    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    tracing::info!("Ledgce REST API listening on http://{}", bind_addr);
    tracing::info!(
        "Interactive Swagger UI available at http://{}/swagger-ui",
        bind_addr
    );

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Ledgce Core API stopped.");
    Ok(())
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("Shutdown signal received. Commencing graceful termination...");
}

async fn metrics_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> impl axum::response::IntoResponse {
    let output = state
        .prometheus_handle
        .as_ref()
        .map(|h| h.render())
        .unwrap_or_else(|| "# Metrics recorder not installed\n".to_string());

    axum::response::Response::builder()
        .header(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4; charset=utf-8",
        )
        .body(axum::body::Body::from(output))
        .unwrap_or_default()
}
