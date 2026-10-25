# Ledgce Architecture & System Specification

## 1. Executive Summary

**Ledgce** is a portfolio-grade distributed financial ledger platform implemented in Rust with an asynchronous web workspace. It guarantees mathematical financial correctness, strict double-entry invariant preservation ($\sum\text{debit} = \sum\text{credit}$ per currency at all times), deadlock-free atomic postings, transactional outbox durability, and continuous automated reconciliation.

---

## 2. System Architecture (C4 Model)

### Container Architecture Diagram

```mermaid
graph TD
    Client["Web Browser / Client\n(React 19 + TypeScript + Tailwind)"] -->|HTTP / JSON (Port 3000 -> 8080)| API["Ledgce REST API\n(Axum + Utoipa OpenAPI)"]
    
    subgraph Rust Backend Platform
        API -->|Service Calls| Core["Ledgce Application Engine\n(AccountService, TransferService, ReconciliationService)"]
        Core -->|Types & Invariants| Domain["Ledgce Domain Core\n(Currency, Money, Invariants)"]
        Worker["Ledgce Outbox Worker\n(SKIP LOCKED Lease Loop)"] -->|Process Events| Core
        Bench["Ledgce Bench Harness\n(High-Concurrency Stress)"] -->|Load Testing| Core
    end

    subgraph Persistence & Infrastructure
        Core -->|Atomic Transactions & Constraints| Postgres[("PostgreSQL 17 Database\n(Port 5433)\n- accounts\n- account_balances\n- transactions\n- journal_entries\n- outbox_events\n- idempotency_records")]
        Worker -->|FOR UPDATE SKIP LOCKED| Postgres
    end
```

---

## 3. Financial Invariant Guarantees

### 3.1 Strict Double-Entry Bookkeeping
Every transaction requires at least two journal entries with identical currency. The sum of all debits must equal the sum of all credits for that transaction:
$$\sum_{i} \text{debit}_i = \sum_{i} \text{credit}_i$$
This rule is checked at:
1. **Domain Layer**: Checked before database submission in `ledgce-domain`.
2. **Database Layer**: Enforced by a deferred constraint trigger (`transactions_balanced` and `journal_entries_balanced`). An unbalanced transaction cannot be committed under any circumstance.

### 3.2 Immutability of Financial Records
Posted transactions and journal entries are strictly append-only.
- `UPDATE`, `DELETE`, and `TRUNCATE` operations on `journal_entries` and `transaction_events` are blocked by database-level triggers (`ledgce_immutable()`).
- Corrections are made exclusively via compensating **reversal transactions** (`kind = 'reversal'`) that reference the original transaction (`reverses_transaction_id`).

### 3.3 No Overdraft on Customer Accounts
Customer accounts must always maintain non-negative balances:
$$\text{balance} \ge 0$$
Enforced by:
- In-memory domain validation.
- Database `CHECK` constraint: `CONSTRAINT customer_balance_nonnegative CHECK (is_system OR balance >= 0)`.
- System clearing/equity accounts (`is_system = true`) are permitted to carry negative balances to represent seed capital or clearing house liabilities.

### 3.4 Deadlock Prevention via Deterministic Row Locking
To eliminate concurrency deadlocks when multiple workers transfer between the same accounts simultaneously, accounts and balances are ordered deterministically by UUID:
```sql
SELECT id FROM accounts WHERE id IN ($1, $2) ORDER BY id ASC FOR UPDATE;
SELECT account_id FROM account_balances WHERE account_id IN ($1, $2) ORDER BY account_id ASC FOR UPDATE;
```

---

## 4. Idempotency & Replay Protocol

Every mutating request accepts an optional `Idempotency-Key` header.
- The request payload is hashed using canonical SHA-256:
  $$\text{Hash} = \text{SHA-256}(\text{source} \mathbin{\Vert} \text{destination} \mathbin{\Vert} \text{amount} \mathbin{\Vert} \text{currency} \mathbin{\Vert} \text{description})$$
- Stored atomically in `idempotency_records (principal, idempotency_key, request_hash, transaction_id)`.
- **Exact Match Replay**: If the same key is received with an identical payload hash, the committed transaction detail is returned with `replayed: true` (no new journal entries or balance mutations occur).
- **Mismatched Key Reuse**: If the same key is received with a differing payload hash, the request is immediately rejected with HTTP 409 Conflict (`IdempotencyKeyReuse`).
