use ledgce_application::OutboxService;
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Load environment variables
    dotenvy::dotenv().ok();

    // 2. Setup structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,ledgce_worker=debug,ledgce_application=debug".into()),
        )
        .json()
        .init();

    // 3. Generate or resolve worker ID
    let worker_id = std::env::var("LEDGCE_WORKER_ID")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| {
            let host = std::env::var("COMPUTERNAME")
                .or_else(|_| std::env::var("HOSTNAME"))
                .unwrap_or_else(|_| "node".into());
            let short_id = &Uuid::now_v7().to_string()[..8];
            format!("worker-{}-{}", host, short_id)
        });

    tracing::info!(worker_id = %worker_id, "Starting Ledgce Outbox Worker...");

    // 4. Connect to PostgreSQL
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://ledgce:ledgce_local_dev@127.0.0.1:5433/ledgce".into());

    let lease_seconds: i64 = std::env::var("LEDGCE_OUTBOX_LEASE_SECONDS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(30);

    let batch_size: i64 = 25;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .connect(&database_url)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to connect to database");
            e
        })?;

    // Attempt migrations on startup if necessary
    if let Err(e) = ledgce_application::db::run_migrations(&pool).await {
        tracing::warn!(error = %e, "Migration check produced an error or migrations already run");
    }

    let outbox_service = OutboxService::new(pool.clone());

    // Record initial heartbeat
    let _ = sqlx::query!(
        r#"
        INSERT INTO worker_heartbeats (worker_id, started_at, last_seen_at, processed_count, failed_count)
        VALUES ($1, now(), now(), 0, 0)
        ON CONFLICT (worker_id) DO UPDATE SET last_seen_at = now()
        "#,
        worker_id
    )
    .execute(&pool)
    .await;

    let mut consecutive_errors = 0;
    let mut last_heartbeat = tokio::time::Instant::now();

    tracing::info!(
        worker_id = %worker_id,
        batch_size = batch_size,
        lease_seconds = lease_seconds,
        "Worker loop initialized"
    );

    loop {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                tracing::info!(worker_id = %worker_id, "Graceful shutdown signal received. Stopping worker...");
                break;
            }
            _ = async {
                // Periodic heartbeat if idle
                if last_heartbeat.elapsed() >= Duration::from_secs(15) {
                    let _ = sqlx::query!(
                        r#"
                        UPDATE worker_heartbeats
                        SET last_seen_at = now()
                        WHERE worker_id = $1
                        "#,
                        worker_id
                    )
                    .execute(&pool)
                    .await;
                    last_heartbeat = tokio::time::Instant::now();
                }

                match outbox_service.process_next_batch(&worker_id, batch_size, lease_seconds).await {
                    Ok(count) => {
                        consecutive_errors = 0;
                        if count > 0 {
                            tracing::info!(worker_id = %worker_id, processed = count, "Processed outbox batch");
                            // Back-to-back check for more items with a tiny pause
                            sleep(Duration::from_millis(50)).await;
                        } else {
                            // No events pending; poll delay
                            sleep(Duration::from_millis(800)).await;
                        }
                    }
                    Err(err) => {
                        consecutive_errors += 1;
                        let backoff = Duration::from_millis(std::cmp::min(1000 * (1 << std::cmp::min(consecutive_errors, 5)), 15000));
                        tracing::error!(
                            worker_id = %worker_id,
                            error = %err,
                            consecutive_errors = consecutive_errors,
                            backoff_ms = backoff.as_millis(),
                            "Error while processing outbox batch. Backing off..."
                        );
                        sleep(backoff).await;
                    }
                }
            } => {}
        }
    }

    tracing::info!(worker_id = %worker_id, "Worker shutdown complete.");
    Ok(())
}
