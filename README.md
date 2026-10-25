# Ledgce — Distributed Financial Ledger Infrastructure

[![Rust](https://img.shields.io/badge/Rust-1.85%2B-blue.svg?logo=rust)](https://www.rust-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Ledgce** is a portfolio-grade distributed financial ledger platform built with Rust, Axum, SQLx, and a modern web frontend. It enforces mathematical double-entry invariants, provides deadlock-free atomic transaction posting, ensures at-least-once outbox delivery with competing worker leases, and performs continuous automated reconciliation.

---

## 1. Architectural Highlights

- **Strict Double-Entry Bookkeeping**: Every transaction balances to zero per currency ($\sum\text{debits} = \sum\text{credits}$). Enforced at both the domain layer and by database-level deferred constraint triggers.
- **Append-Only Immutability**: Posted journal entries and lifecycle states can never be modified or deleted. Corrections are executed exclusively via compensating reversal transactions.
- **Transactional Outbox Pattern**: State mutations and event records are committed within the same database transaction, eliminating dual-write vulnerabilities.
- **Competing Consumer Leasing**: Background workers lease events using PostgreSQL's `FOR UPDATE SKIP LOCKED`, preventing race conditions across distributed worker instances without coordinator locks.
- **Deterministic Concurrency & Deadlock Prevention**: Account locks are acquired in sorted UUID order (`ORDER BY id ASC FOR UPDATE`), eliminating database deadlocks under high concurrency.
- **Idempotency with Payload Verification**: Client idempotency keys are hashed against canonical request payloads (SHA-256). Identical replays return the committed transaction; payload tampering triggers immediate rejection.
- **Continuous Automated Reconciliation**: Full integrity sweeps verify zero-sum currency balances, detect projection drift, identify overdraft violations, and flag abandoned outbox events.

---

## 2. Workspace & Crate Structure

```
Ledgce/
├── backend/
│   ├── Cargo.toml                     # Cargo workspace definition
│   └── crates/
│       ├── ledgce-domain/             # Pure financial domain models (Currency, Money, Invariants)
│       ├── ledgce-application/        # Services (Account, Transfer, Query, Reconciliation, Outbox)
│       ├── ledgce-api/                # Axum REST API with Utoipa OpenAPI docs and Bearer Auth
│       ├── ledgce-worker/             # Standalone background outbox worker loop (SKIP LOCKED)
│       ├── ledgce-bench/              # High-concurrency load testing and invariant harness
│       └── ledgce-observability/       # Prometheus metrics recorder and structured JSON tracing
├── frontend/                          # React 19 + TypeScript + Tailwind CSS workspace
│   ├── src/
│   │   ├── api/client.ts              # Typed API client with Vite dev proxy
│   │   ├── components/                # SpaceX-inspired high-contrast UI component library
│   │   └── views/                     # Overview, Accounts, Transfers, Explorer, Reconciliation, Health
│   └── vite.config.ts                 # Dev server proxying /api to http://127.0.0.1:8080
├── migrations/                        # SQLx PostgreSQL schema migrations
│   ├── 0001_core.sql                  # Core accounts, transactions, journal entries, idempotency
│   ├── 0002_integrity.sql             # Triggers enforcing immutability and balanced transactions
│   └── 0003_reliability.sql           # Outbox, dedup, reconciliation, heartbeats, fault injection
├── docs/                              # Architecture, design research, reliability, benchmarks
│   ├── architecture.md
│   ├── reliability.md
│   ├── benchmarks.md
│   └── design-research/spacex-starlink-observations.md
└── docker-compose.yml                 # Local PostgreSQL 17 development container
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- [Rust 1.85+](https://www.rust-lang.org/tools/install)
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/)

### 1. Start PostgreSQL
```bash
docker compose up -d
```
*PostgreSQL 17 starts on `127.0.0.1:5433` (database: `ledgce`, user: `ledgce`, password: `ledgce_local_dev`).*

### 2. Run Automated Test Suites
```bash
cargo test --manifest-path backend/Cargo.toml --workspace
```
*Runs all 25 unit, property, auth middleware, OpenAPI, and database integration tests.*

### 3. Run High-Concurrency Benchmark
```bash
cargo run --manifest-path backend/Cargo.toml -p ledgce-bench
```
*Executes 500 concurrent transfers across 10 async workers, measuring throughput and verifying post-stress reconciliation.*

### 4. Start Services

**Terminal A — Start Core REST API:**
```bash
cargo run --manifest-path backend/Cargo.toml -p ledgce-api
```
- API Base: `http://127.0.0.1:8080`
- Interactive Swagger UI: `http://127.0.0.1:8080/swagger-ui`

**Terminal B — Start Outbox Background Worker:**
```bash
cargo run --manifest-path backend/Cargo.toml -p ledgce-worker
```

**Terminal C — Start Frontend Web Workspace:**
```bash
cd frontend
pnpm install
pnpm dev
```
- Open browser at: `http://127.0.0.1:3000`

---

## 4. API Endpoints Reference

All mutating endpoints require an `Authorization: Bearer <token>` header (`Role::Admin`).

| Method | Path | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Live service health check | Public |
| `GET` | `/api/v1/overview` | Platform summary statistics & balance check | Reader / Admin |
| `GET` | `/api/v1/accounts` | Paginated list of accounts with filters | Reader / Admin |
| `POST` | `/api/v1/accounts` | Create new customer or system account | Admin |
| `POST` | `/api/v1/accounts/opening-balance` | Inject opening balance from System Equity | Admin |
| `GET` | `/api/v1/accounts/{id}` | Account details with live journal verification | Reader / Admin |
| `POST` | `/api/v1/transfers` | Atomic double-entry transfer with idempotency | Admin |
| `POST` | `/api/v1/transfers/reversal` | Issue compensating reversal transaction | Admin |
| `GET` | `/api/v1/transfers/{id}` | Full transaction details, entries, and lifecycle | Reader / Admin |
| `GET` | `/api/v1/ledger/entries` | Append-only journal entries with keyset pagination | Reader / Admin |
| `POST` | `/api/v1/reconciliation/run` | Execute full ledger invariant reconciliation | Admin |
| `GET` | `/api/v1/reconciliation/runs` | List historical reconciliation audits | Reader / Admin |
| `GET` | `/api/v1/outbox/events` | Inspect transactional outbox event queue | Reader / Admin |
| `POST` | `/api/v1/outbox/events/{id}/requeue` | Requeue dead-letter outbox event | Admin |
| `GET` | `/api/v1/system/health` | System health, worker fleet, and fault status | Reader / Admin |
| `POST` | `/api/v1/system/faults/arm` | Arm chaos fault injection point | Admin |
| `POST` | `/api/v1/system/faults/clear` | Clear all armed fault injection points | Admin |

---

## 5. Frontend Design Philosophy

The web interface is designed with **fintech precision × technical confidence × restrained cinematic minimalism**:
- **Palette**: Dark operational surfaces (`#090B12`, `#111522`, `#171C2C`, `#20263A`) with crisp borders (`rgba(255,255,255,0.09)`) and deliberate accents (`#526CFF`, `#35D6A0`).
- **Typography**: Clean editorial hierarchy (`Inter`) combined with monospaced tabular figures (`JetBrains Mono`, `tabular-nums`) across all currency balances, audit sequence numbers, and timestamps.
- **Real-Time Telemetry**: Persistent topbar indicator dynamically broadcasting invariant preservation status (`Σ=0.00`) and worker fleet activity.
- **Zero Fiction**: Every UI metric, table row, outbox state, and reconciliation run is wired directly to real PostgreSQL data via the Axum API.

---

## 6. License

This project is licensed under the MIT License.
