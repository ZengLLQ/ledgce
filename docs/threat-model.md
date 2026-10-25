# Ledgce Threat Model & Security Specification

## 1. Scope & Boundaries

Ledgce is a financial recordkeeping engine. The threat model addresses attacks targeting financial integrity, transaction injection, double-spending, and denial of service.

---

## 2. Threat Analysis (STRIDE)

| Threat | Description | Mitigation in Ledgce |
| :--- | :--- | :--- |
| **Spoofing** | Unauthorized actors posting transfers or altering balances | Bearer token authentication with role-based access (`Role::Admin` vs `Role::Reader`). Vite proxy enforces token injection server-side. |
| **Tampering** | Modifying historical journal entries or account balances | Database triggers reject `UPDATE`, `DELETE`, and `TRUNCATE` on `journal_entries` and `transaction_events`. Financial balance projections are derived solely from trigger execution. |
| **Repudiation** | Denying having submitted a transfer | Append-only `audit_events` table records actor identity, action type, entity ID, and request details with immutable trigger. |
| **Information Disclosure** | Leakage of internal errors or database connection strings | Axum error handler maps internal SQLx/Postgres errors to opaque status codes (400, 401, 403, 404, 409, 422, 500) with sanitized JSON error messages. |
| **Denial of Service** | Concurrent racing transfers exhausting account funds or crashing DB with deadlocks | Deterministic row locking (`ORDER BY id ASC FOR UPDATE`) prevents deadlocks. `CHECK (balance >= 0)` constraint backstops concurrency overspending. Keyset cursor pagination limits result sets. |
| **Elevation of Privilege** | Reader token executing transfer mutations or fault injections | Auth middleware inspects request method (`POST`, `PUT`, `DELETE`) and rejects non-admin principals with HTTP 403 Forbidden. |

---

## 3. Secret Management & Environment Isolation

- No production credentials exist in the codebase.
- `.env` is ignored by Git. `.env.example` provides template defaults.
- All network listeners (`LEDGCE_API_BIND`, `docker-compose.yml`) bind to loopback (`127.0.0.1`) only by default, ensuring zero accidental LAN/WAN exposure.
