-- Ledgce migration 0003: reliability infrastructure (outbox, dedup, reconciliation, audit, workers, faults).

CREATE TABLE outbox_events (
    id               UUID PRIMARY KEY,
    seq              BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    aggregate_type   TEXT        NOT NULL,
    aggregate_id     UUID        NOT NULL,
    event_type       TEXT        NOT NULL,
    payload          JSONB       NOT NULL,
    -- pending -> processing (leased by a worker) -> processed | dead (after max attempts)
    status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'dead')),
    attempts         INTEGER     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    available_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_by        TEXT,
    lease_expires_at TIMESTAMPTZ,
    last_error       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at     TIMESTAMPTZ,
    UNIQUE (aggregate_type, aggregate_id, event_type)
);
CREATE INDEX outbox_claimable_idx ON outbox_events (available_at, seq) WHERE status IN ('pending', 'processing');
CREATE INDEX outbox_status_idx ON outbox_events (status, seq DESC);
CREATE INDEX outbox_aggregate_idx ON outbox_events (aggregate_id);

-- Consumers are idempotent through this table: (consumer, event) may be recorded at most once.
CREATE TABLE processed_events (
    consumer      TEXT        NOT NULL,
    event_id      UUID        NOT NULL REFERENCES outbox_events (id),
    worker_id     TEXT        NOT NULL,
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer, event_id)
);

CREATE TABLE audit_events (
    id           UUID PRIMARY KEY,
    seq          BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    actor        TEXT        NOT NULL,
    action       TEXT        NOT NULL,
    entity_type  TEXT        NOT NULL,
    entity_id    TEXT        NOT NULL,
    detail       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_events (entity_type, entity_id, seq DESC);
CREATE TRIGGER audit_events_immutable
    BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION ledgce_immutable();

CREATE TABLE reconciliation_runs (
    id                    UUID PRIMARY KEY,
    seq                   BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    status                TEXT        NOT NULL CHECK (status IN ('passed', 'failed')),
    triggered_by          TEXT        NOT NULL,
    started_at            TIMESTAMPTZ NOT NULL,
    finished_at           TIMESTAMPTZ NOT NULL,
    duration_ms           BIGINT      NOT NULL,
    accounts_checked      BIGINT      NOT NULL,
    transactions_checked  BIGINT      NOT NULL,
    entries_checked       BIGINT      NOT NULL,
    outbox_checked        BIGINT      NOT NULL,
    violation_count       INTEGER     NOT NULL,
    violations            JSONB       NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX reconciliation_runs_seq_idx ON reconciliation_runs (seq DESC);

CREATE TABLE worker_heartbeats (
    worker_id        TEXT PRIMARY KEY,
    started_at       TIMESTAMPTZ NOT NULL,
    last_seen_at     TIMESTAMPTZ NOT NULL,
    processed_count  BIGINT      NOT NULL DEFAULT 0,
    failed_count     BIGINT      NOT NULL DEFAULT 0
);

-- Development-only fault injection points consumed by workers (see docs/reliability.md).
CREATE TABLE fault_injections (
    point       TEXT PRIMARY KEY CHECK (point IN ('crash_before_process', 'crash_after_publish', 'duplicate_delivery', 'fail_processing')),
    remaining   INTEGER     NOT NULL CHECK (remaining >= 0),
    armed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commit-time invariant: a posted transaction MUST have its outbox record in the same DB transaction.
CREATE FUNCTION ledgce_transaction_outbox_check() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM outbox_events WHERE aggregate_type = 'transaction' AND aggregate_id = NEW.id) THEN
        RAISE EXCEPTION 'ledgce: transaction % has no outbox event', NEW.id USING ERRCODE = 'P0003';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER transactions_outbox_required
    AFTER INSERT ON transactions DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION ledgce_transaction_outbox_check();
