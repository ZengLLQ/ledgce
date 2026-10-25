use sqlx::PgPool;

use crate::error::AppError;
use crate::model::{ArmFaultRequest, FaultInjectionView, SystemHealthView, WorkerHeartbeatView};

#[derive(Clone)]
pub struct SystemService {
    pool: PgPool,
}

impl SystemService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Evaluates live platform health across database connectivity,
    /// ledger invariant assertions, outbox queue depths, and worker liveness.
    pub async fn get_health(&self) -> Result<SystemHealthView, AppError> {
        let db_ping: Result<i32, _> = sqlx::query_scalar("SELECT 1")
            .fetch_one(&self.pool)
            .await;
        let database_connected = db_ping.is_ok();

        let unbalanced_currencies: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*) FROM (
                SELECT currency FROM journal_entries
                GROUP BY currency
                HAVING SUM(debit) <> SUM(credit)
            ) sub
            "#,
        )
        .fetch_one(&self.pool)
        .await
        .unwrap_or(1);

        let ledger_invariants_pass = unbalanced_currencies == 0;

        let outbox_backlog: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM outbox_events WHERE status IN ('pending', 'processing')",
        )
        .fetch_one(&self.pool)
        .await
        .unwrap_or(0);

        let dead_letter_count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM outbox_events WHERE status = 'dead'")
                .fetch_one(&self.pool)
                .await
                .unwrap_or(0);

        let workers: Vec<WorkerHeartbeatView> = sqlx::query_as(
            r#"
            SELECT
                worker_id,
                started_at,
                last_seen_at,
                processed_count,
                failed_count,
                (last_seen_at >= now() - INTERVAL '30 seconds') AS is_healthy
            FROM worker_heartbeats
            ORDER BY last_seen_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .unwrap_or_default();

        let active_faults: Vec<FaultInjectionView> = sqlx::query_as(
            r#"
            SELECT point, remaining, armed_at
            FROM fault_injections
            WHERE remaining > 0
            ORDER BY armed_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .unwrap_or_default();

        let status = if !database_connected || !ledger_invariants_pass {
            "critical".to_string()
        } else if dead_letter_count > 0 || !active_faults.is_empty() {
            "degraded".to_string()
        } else {
            "healthy".to_string()
        };

        Ok(SystemHealthView {
            status,
            database_connected,
            ledger_invariants_pass,
            outbox_backlog,
            dead_letter_count,
            workers,
            active_faults,
        })
    }

    /// Arms a simulated fault injection point for testing failure and recovery.
    pub async fn arm_fault(&self, req: ArmFaultRequest) -> Result<FaultInjectionView, AppError> {
        let valid_points = [
            "crash_before_process",
            "crash_after_publish",
            "duplicate_delivery",
            "fail_processing",
        ];
        if !valid_points.contains(&req.point.as_str()) {
            return Err(AppError::Validation(format!(
                "Invalid fault injection point '{}'. Must be one of: {:?}",
                req.point, valid_points
            )));
        }

        let view: FaultInjectionView = sqlx::query_as(
            r#"
            INSERT INTO fault_injections (point, remaining, armed_at)
            VALUES ($1, $2, now())
            ON CONFLICT (point) DO UPDATE SET
                remaining = EXCLUDED.remaining,
                armed_at = now()
            RETURNING point, remaining, armed_at
            "#,
        )
        .bind(&req.point)
        .bind(req.count.max(1))
        .fetch_one(&self.pool)
        .await?;

        Ok(view)
    }

    /// Clears all armed fault injection points.
    pub async fn clear_faults(&self) -> Result<(), AppError> {
        sqlx::query("DELETE FROM fault_injections")
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
