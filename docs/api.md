# Ledgce REST API Specification

Base URL: `http://127.0.0.1:8080/api/v1`  
Interactive Swagger UI: `http://127.0.0.1:8080/swagger-ui`  
OpenAPI 3.1 Spec: `http://127.0.0.1:8080/api-docs/openapi.json`

---

## 1. Authentication

Ledgce uses HTTP Bearer token authentication:
```http
Authorization: Bearer <token>
```
- **Admin Role** (`LEDGCE_ADMIN_TOKEN` or `dev_admin_token`): Full read and write permissions (posting transfers, creating accounts, triggering audits, arming chaos faults).
- **Reader Role** (`LEDGCE_READER_TOKEN` or `dev_reader_token`): Read-only access (`GET` requests). Any mutating `POST` request returns `403 Forbidden`.
- **Public**: `/health`, `/swagger-ui`, and `/api-docs/openapi.json` require no authentication header.

---

## 2. Standard Error Response

All error responses return the following JSON envelope:
```json
{
  "error": "insufficient_funds",
  "message": "insufficient funds: available 100.00, requested 250.00"
}
```

---

## 3. Endpoints

### 3.1 Platform Overview
`GET /api/v1/overview`
- **Description**: Returns global account counts, transaction metrics, multi-currency volume totals, and invariant status.
- **Role**: Reader or Admin

### 3.2 Accounts
- `GET /api/v1/accounts`: Paginated accounts list with filters (`search`, `kind`, `currency`, `status`, `page`, `page_size`).
- `POST /api/v1/accounts`: Creates customer or system account.
- `GET /api/v1/accounts/{id}`: Account detail including totals and real-time journal verification.
- `POST /api/v1/accounts/opening-balance`: Injects opening capital via balanced transfer from System Equity.

### 3.3 Transfers & Transactions
- `POST /api/v1/transfers`: Executes atomic double-entry transfer. Supports `Idempotency-Key` header.
- `GET /api/v1/transfers`: Keyset cursor paginated list of transactions.
- `GET /api/v1/transfers/{id}`: Detailed transaction view with debit/credit entries, lifecycle history, and outbox records.
- `POST /api/v1/transfers/reversal`: Posts a compensating double-entry reversal transaction.

### 3.4 Journal Entries
- `GET /api/v1/ledger/entries`: Keyset cursor paginated general ledger journal entries (`seq < cursor`).

### 3.5 Reconciliation
- `POST /api/v1/reconciliation/run`: Triggers comprehensive invariant audit.
- `GET /api/v1/reconciliation/runs`: Lists historical audit run summaries.
- `GET /api/v1/reconciliation/runs/{id}`: Fetches specific audit run with violation breakdown.

### 3.6 Transactional Outbox
- `GET /api/v1/outbox/events`: Inspects outbox queue and lease states.
- `POST /api/v1/outbox/events/{id}/requeue`: Requeues dead-lettered events back into `pending`.
- `POST /api/v1/outbox/process-batch`: Manually triggers batch processing.

### 3.7 System Health & Diagnostics
- `GET /api/v1/system/health`: Live health status, worker heartbeats, and queue backlog depth.
- `POST /api/v1/system/faults/arm`: Arms chaos fault injection point (`crash_before_process`, `fail_processing`, etc.).
- `POST /api/v1/system/faults/clear`: Disarms all active chaos faults.
