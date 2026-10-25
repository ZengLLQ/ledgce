# ADR 0002: Transactional Outbox with SKIP LOCKED Worker Leasing

## Context
Publishing domain events to external messaging systems (Kafka, webhooks) from a database transaction risks dual-write discrepancies: if the database commits but network publishing fails, events are lost; if events publish but database rolls back, phantom events are distributed.

## Decision
1. Persist domain events into an `outbox_events` table within the same ACID database transaction as the financial journal entries.
2. Background worker instances poll the outbox using PostgreSQL's `FOR UPDATE SKIP LOCKED`, acquiring short-lived leases without cross-worker coordination locks.
3. Once processed, events transition to `published`; after exceeding maximum retry attempts, events move to `dead` letter status for operator inspection and retry.

## Status
Accepted and Implemented.
