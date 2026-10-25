use metrics_exporter_prometheus::{PrometheusBuilder, PrometheusHandle};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initializes JSON structured logging with environment filtering.
pub fn init_tracing(service_name: &str) {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,ledgce=debug,sqlx=warn"));

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer().json().with_current_span(true))
        .init();

    tracing::info!(service = service_name, "Observability tracing initialized");
}

/// Installs the Prometheus metrics exporter and returns a handle for rendering metrics.
pub fn init_metrics() -> Result<PrometheusHandle, Box<dyn std::error::Error + Send + Sync>> {
    let handle = PrometheusBuilder::new().install_recorder()?;
    Ok(handle)
}

/// Prometheus metric names used across Ledgce services.
pub mod metrics_consts {
    pub const TRANSFERS_POSTED: &str = "ledgce_transfers_posted_total";
    pub const TRANSFERS_REJECTED: &str = "ledgce_transfers_rejected_total";
    pub const TRANSFERS_DURATION: &str = "ledgce_transfers_duration_seconds";
    pub const OUTBOX_PROCESSED: &str = "ledgce_outbox_processed_total";
    pub const OUTBOX_FAILED: &str = "ledgce_outbox_failed_total";
    pub const RECONCILIATION_VIOLATIONS: &str = "ledgce_reconciliation_violations_total";
    pub const RECONCILIATION_DURATION: &str = "ledgce_reconciliation_duration_seconds";
}
