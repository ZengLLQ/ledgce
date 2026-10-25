# ADR 0003: Deterministic Row Locking Order for Deadlock Prevention

## Context
Under high concurrent transaction volume, two workers transferring funds between the same accounts in opposite directions (e.g. Account A -> Account B and Account B -> Account A) will encounter circular lock wait conditions, causing database transactions to abort with deadlock exceptions (`40P01`).

## Decision
All transfer operations must sort involved account UUIDs in ascending lexicographical order prior to acquiring row-level locks:
```sql
SELECT id FROM accounts WHERE id IN ($1, $2) ORDER BY id ASC FOR UPDATE;
SELECT account_id FROM account_balances WHERE account_id IN ($1, $2) ORDER BY account_id ASC FOR UPDATE;
```
Because all concurrent transactions acquire locks in the exact same deterministic sequence, deadlocks are mathematically impossible.

## Status
Accepted and Implemented.
