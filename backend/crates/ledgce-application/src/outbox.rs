use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::model::{OutboxFilter, OutboxView, Page};

#[derive(Debug)]
pub struct ClaimedEvent {
    pub id: Uuid,
    pub seq: i64,
    pub aggregate_type: String,
    pub aggregate_id: Uuid,
    pub event_type: String,
    pub attempts: i32,
}

#[derive(Clone)]
pub struct OutboxService {
    pool: PgPool,
}

impl OutboxService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Lists outbox events with keyset cursor pagination.
    pub async fn list_events(&self, filter: OutboxFilter) -> Result<Page<OutboxView>, AppError> {
        let limit = filter.limit.unwrap_or(25).clamp(1, 100);
        let fetch_limit = limit + 1;

        let mut items: Vec<OutboxView> = sqlx::query_as(
            r#"
            SELECT
                id,
                seq,
                aggregate_id,
                event_type,
                status,
                attempts,
                available_at,
                locked_by,
                last_error,
                created_at,
                processed_at,
                EXTRACT(EPOCH FROM (COALESCE(processed_at, now()) - created_at))::float8 AS age_seconds
            FROM outbox_events
            WHERE ($1::bigint IS NULL OR seq < $1)
              AND ($2::text IS NULL OR status = $2)
            ORDER BY seq DESC
            LIMIT $3
            "#,
        )
        .bind(filter.cursor)
        .bind(&filter.status)
        .bind(fetch_limit)
        .fetch_all(&self.pool)
        .await?;

        let has_more = items.len() as i64 > limit;
        if has_more {
            items.pop();
        }

        let next_cursor = if has_more {
            items.last().map(|e| e.seq.to_string())
        } else {
            None
        };

        Ok(Page {
            items,
            next_cursor,
            has_more,
        })
    }

    /// Fetches a specific outbox event by ID.
    pub async fn get_event(&self, id: Uuid) -> Result<OutboxView, AppError> {
        sqlx::query_as(
            r#"
            SELECT
                id,
                seq,
                aggregate_id,
                event_type,
                status,
                attempts,
                available_at,
                locked_by,
                last_error,
                created_at,
                processed_at,
                EXTRACT(EPOCH FROM (COALESCE(processed_at, now()) - created_at))::float8 AS age_seconds
            FROM outbox_events
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Outbox event {} not found", id)))
    }

    /// Re-queues a dead-lettered event back into 'pending' status for retry.
    pub async fn requeue_dead(&self, id: Uuid) -> Result<OutboxView, AppError> {
        let updated = sqlx::query!(
            r#"
            UPDATE outbox_events
            SET status = 'pending',
                attempts = 0,
                available_at = now(),
                locked_by = NULL,
                lease_expires_at = NULL,
                last_error = NULL
            WHERE id = $1 AND status = 'dead'
            RETURNING id
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        if updated.is_none() {
            return Err(AppError::NotFound(format!(
                "Dead outbox event {} not found or not in dead status",
                id
            )));
        }

        self.get_event(id).await
    }

    /// Claims and processes a batch of outbox events using PostgreSQL's `FOR UPDATE SKIP LOCKED`.
    /// Guaranteed concurrency safe across any number of competing worker processes.
    pub async fn process_next_batch(
        &self,
        worker_id: &str,
        batch_size: i64,
        lease_seconds: i64,
    ) -> Result<usize, AppError> {
        // 1. Claim batch with lease
        let claimed: Vec<ClaimedEvent> = sqlx::query_as!(
            ClaimedEvent,
            r#"
            WITH claimable AS (
                SELECT id FROM outbox_events
                WHERE (status = 'pending' AND available_at <= now())
                   OR (status = 'processing' AND lease_expires_at <= now())
                ORDER BY seq ASC
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            )
            UPDATE outbox_events
               SET status = 'processing',
                   locked_by = $2,
                   lease_expires_at = now() + ($3 * INTERVAL '1 second'),
                   attempts = attempts + 1
             WHERE id IN (SELECT id FROM claimable)
            RETURNING id, seq, aggregate_type, aggregate_id, event_type, attempts
            "#,
            batch_size.clamp(1, 100),
            worker_id,
            lease_seconds.max(5) as f64
        )
        .fetch_all(&self.pool)
        .await?;

        if claimed.is_empty() {
            return Ok(0);
        }

        let mut processed_count = 0;
        let mut failed_count = 0;

        for event in &claimed {
            match self.process_single_event(worker_id, event).await {
                Ok(()) => {
                    processed_count += 1;
                }
                Err(err) => {
                    failed_count += 1;
                    tracing::error!(
                        worker_id,
                        event_id = %event.id,
                        error = %err,
                        "Failed processing outbox event"
                    );
                }
            }
        }

        // Update worker heartbeats
        sqlx::query!(
            r#"
            INSERT INTO worker_heartbeats (worker_id, started_at, last_seen_at, processed_count, failed_count)
            VALUES ($1, now(), now(), $2, $3)
            ON CONFLICT (worker_id) DO UPDATE SET
                last_seen_at = now(),
                processed_count = worker_heartbeats.processed_count + EXCLUDED.processed_count,
                failed_count = worker_heartbeats.failed_count + EXCLUDED.failed_count
            "#,
            worker_id,
            processed_count,
            failed_count
        )
        .execute(&self.pool)
        .await?;

        Ok(processed_count as usize)
    }

    async fn process_single_event(
        &self,
        worker_id: &str,
        event: &ClaimedEvent,
    ) -> Result<(), AppError> {
        // 1. Check fault injection points
        let simulated_crash: Option<i32> = sqlx::query_scalar(
            r#"
            UPDATE fault_injections
            SET remaining = remaining - 1
            WHERE point = 'fail_processing' AND remaining > 0
            RETURNING remaining
            "#,
        )
        .fetch_optional(&self.pool)
        .await?;

        if simulated_crash.is_some() {
            let error_msg = "Simulated fault injection: processing failure";
            self.handle_event_failure(event.id, event.attempts, error_msg)
                .await?;
            return Err(AppError::Conflict(error_msg.into()));
        }

        // 2. Dedup consumer check
        let consumer_name = "default_ledger_dispatcher";
        let inserted = sqlx::query!(
            r#"
            INSERT INTO processed_events (consumer, event_id, worker_id, processed_at)
            VALUES ($1, $2, $3, now())
            ON CONFLICT (consumer, event_id) DO NOTHING
            RETURNING event_id
            "#,
            consumer_name,
            event.id,
            worker_id
        )
        .fetch_optional(&self.pool)
        .await?;

        if inserted.is_none() {
            // Already processed by this consumer, mark outbox event as processed
            sqlx::query!(
                r#"
                UPDATE outbox_events
                SET status = 'processed',
                    processed_at = now(),
                    locked_by = NULL,
                    lease_expires_at = NULL
                WHERE id = $1
                "#,
                event.id
            )
            .execute(&self.pool)
            .await?;
            return Ok(());
        }

        // 3. Dispatch based on aggregate
        if event.aggregate_type == "transaction" {
            let mut tx = self.pool.begin().await?;

            // Transition transaction lifecycle: posted -> published -> processed
            // (Database constraint enforces strictly sequential transitions)
            let current_status: String = sqlx::query_scalar!(
                "SELECT status FROM transactions WHERE id = $1 FOR UPDATE",
                event.aggregate_id
            )
            .fetch_one(&mut *tx)
            .await?;

            if current_status == "posted" {
                sqlx::query!(
                    r#"
                    UPDATE transactions
                    SET status = 'published', published_at = now()
                    WHERE id = $1
                    "#,
                    event.aggregate_id
                )
                .execute(&mut *tx)
                .await?;

                sqlx::query!(
                    r#"
                    INSERT INTO transaction_events (id, transaction_id, state, detail, occurred_at)
                    VALUES ($1, $2, 'published', 'Dispatched to outbox pipeline', now())
                    "#,
                    Uuid::now_v7(),
                    event.aggregate_id
                )
                .execute(&mut *tx)
                .await?;
            }

            // Now transition to processed
            sqlx::query!(
                r#"
                UPDATE transactions
                SET status = 'processed', processed_at = now()
                WHERE id = $1
                "#,
                event.aggregate_id
            )
            .execute(&mut *tx)
            .await?;

            sqlx::query!(
                r#"
                INSERT INTO transaction_events (id, transaction_id, state, detail, occurred_at)
                VALUES ($1, $2, 'processed', 'Acknowledged by downstream consumers', now())
                "#,
                Uuid::now_v7(),
                event.aggregate_id
            )
            .execute(&mut *tx)
            .await?;

            // Mark outbox event as processed
            sqlx::query!(
                r#"
                UPDATE outbox_events
                SET status = 'processed',
                    processed_at = now(),
                    locked_by = NULL,
                    lease_expires_at = NULL,
                    last_error = NULL
                WHERE id = $1
                "#,
                event.id
            )
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;
        } else {
            sqlx::query!(
                r#"
                UPDATE outbox_events
                SET status = 'processed',
                    processed_at = now(),
                    locked_by = NULL,
                    lease_expires_at = NULL
                WHERE id = $1
                "#,
                event.id
            )
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    async fn handle_event_failure(
        &self,
        event_id: Uuid,
        attempts: i32,
        error_msg: &str,
    ) -> Result<(), AppError> {
        const MAX_ATTEMPTS: i32 = 5;
        if attempts >= MAX_ATTEMPTS {
            // Dead-letter
            sqlx::query!(
                r#"
                UPDATE outbox_events
                SET status = 'dead',
                    locked_by = NULL,
                    lease_expires_at = NULL,
                    last_error = $2
                WHERE id = $1
                "#,
                event_id,
                error_msg
            )
            .execute(&self.pool)
            .await?;
        } else {
            // Exponential backoff: 2^attempts seconds
            let delay_seconds = 2_i64.pow(attempts as u32);
            sqlx::query!(
                r#"
                UPDATE outbox_events
                SET status = 'pending',
                    available_at = now() + ($2 * INTERVAL '1 second'),
                    locked_by = NULL,
                    lease_expires_at = NULL,
                    last_error = $3
                WHERE id = $1
                "#,
                event_id,
                delay_seconds as f64,
                error_msg
            )
            .execute(&self.pool)
            .await?;
        }
        Ok(())
    }
}
