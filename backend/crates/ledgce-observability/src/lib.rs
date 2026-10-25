use metrics_exporter_prometheus::PrometheusBuilder;
pub use metrics_exporter_prometheus::PrometheusHandle;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

/// Initializes JSON structured logging with environment filtering.
pub fn init_tracing(service_name: &str) {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,ledgce=debug,sqlx=warn"));

    tracing_subscriber::registry()
        .with(filter)
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_current_span(true),
        )
        .init();

    tracing::info!(service = service_name, "Observability tracing initialized");
}

/// Installs the Prometheus metrics exporter and returns a handle for rendering metrics.
pub fn init_metrics() -> Result<PrometheusHandle, Box<dyn std::error::Error + Send + Sync>> {
    let handle = PrometheusBuilder::new().install_recorder()?;

    metrics::describe_gauge!("ledgce_up", "Indicates if the Ledgce service is running");
    metrics::gauge!("ledgce_up").set(1.0);

    metrics::describe_counter!(
        metrics_consts::TRANSFERS_POSTED,
        "Total number of transfers posted"
    );
    metrics::describe_counter!(
        metrics_consts::TRANSFERS_REJECTED,
        "Total number of transfers rejected"
    );
    metrics::describe_counter!(
        metrics_consts::OUTBOX_PROCESSED,
        "Total number of outbox events processed"
    );
    metrics::describe_counter!(
        metrics_consts::OUTBOX_FAILED,
        "Total number of outbox events failed"
    );
    metrics::describe_counter!(
        metrics_consts::RECONCILIATION_VIOLATIONS,
        "Total reconciliation violations detected"
    );

    metrics::counter!(metrics_consts::TRANSFERS_POSTED).absolute(0);
    metrics::counter!(metrics_consts::TRANSFERS_REJECTED).absolute(0);
    metrics::counter!(metrics_consts::OUTBOX_PROCESSED).absolute(0);
    metrics::counter!(metrics_consts::OUTBOX_FAILED).absolute(0);
    metrics::counter!(metrics_consts::RECONCILIATION_VIOLATIONS).absolute(0);

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
