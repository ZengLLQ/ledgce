# Ledgce Data Model Specification

## 1. Schema Overview

Ledgce uses PostgreSQL 17 as its authoritative system of record. All numeric monetary fields use `NUMERIC(28, 8)` with database-enforced scale constraints:
- `USD`, `EUR`: Fixed to 2 decimal places (`amount = round(amount, 2)`).
- `IDR`: Fixed to 0 decimal places (`amount = trunc(amount)`).

---

## 2. Entity Relational Diagram

```mermaid
erDiagram
    ACCOUNTS ||--o{ JOURNAL_ENTRIES : contains
    ACCOUNTS ||--|| ACCOUNT_BALANCES : projects
    TRANSACTIONS ||--|{ JOURNAL_ENTRIES : posts
    TRANSACTIONS ||--o{ OUTBOX_EVENTS : triggers
    TRANSACTIONS ||--o{ TRANSACTION_EVENTS : tracks
    TRANSACTIONS ||--o| IDEMPOTENCY_RECORDS : resolves
    OUTBOX_EVENTS ||--o{ PROCESSED_EVENTS : consumes

    ACCOUNTS {
        uuid id PK
        text code UK
        text name
        text kind
        char currency
        text status
        boolean synthetic
        timestamptz created_at
    }

    ACCOUNT_BALANCES {
        uuid account_id PK, FK
        boolean is_system
        numeric balance
        bigint version
        timestamptz updated_at
    }

    TRANSACTIONS {
        uuid id PK
        bigint seq UK
        text reference UK
        text kind
        text status
        char currency
        numeric amount
        uuid source_account_id FK
        uuid destination_account_id FK
        text description
        uuid reverses_transaction_id FK
        timestamptz created_at
        timestamptz posted_at
        timestamptz published_at
        timestamptz processed_at
    }

    JOURNAL_ENTRIES {
        uuid id PK
        bigint seq UK
        uuid transaction_id FK
        uuid account_id FK
        char currency
        numeric debit
        numeric credit
        text memo
        timestamptz posted_at
    }

    OUTBOX_EVENTS {
        uuid id PK
        bigint seq UK
        text aggregate_type
        uuid aggregate_id
        text event_type
        jsonb payload
        text status
        integer attempts
        timestamptz available_at
        text locked_by
        timestamptz lease_expires_at
        text last_error
        timestamptz created_at
        timestamptz processed_at
    }

    IDEMPOTENCY_RECORDS {
        uuid id PK
        text principal
        text idempotency_key
        text request_hash
        uuid transaction_id FK
        timestamptz created_at
    }
```

---

## 3. Database Triggers & Constraints Summary

1. `accounts_create_balance`: Automatically inserts corresponding `account_balances` row upon account creation.
2. `accounts_guard`: Prohibits deletion of accounts and mutation of immutable identity fields (`id`, `code`, `currency`, `kind`).
3. `journal_entries_before_insert`: Validates that the referenced account is in `'active'` status.
4. `journal_entries_apply_balance`: Atomically increments or decrements `account_balances.balance = balance + credit - debit` upon entry insertion.
5. `journal_entries_immutable`: Prohibits `UPDATE`, `DELETE`, or `TRUNCATE` operations on posted journal entries.
6. `transactions_guard`: Prevents modification of financial fields and validates forward-only status transitions (`posted` $\to$ `published` $\to$ `processed`).
7. `transactions_balanced` (`DEFERRED`): Asserts that $\sum \text{debits} = \sum \text{credits}$ and entry count $\ge 2$ at transaction commit.
8. `transactions_outbox_required` (`DEFERRED`): Asserts that a corresponding outbox event was created within the same database transaction.
