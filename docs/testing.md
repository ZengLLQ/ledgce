# Ledgce Automated Testing Suite Specification

## 1. Testing Philosophy

Ledgce employs a multi-tiered verification hierarchy to guarantee both financial invariant preservation and operational reliability under high concurrency.

---

## 2. Test Execution Commands

### 2.1 Backend Tests (Rust)
```bash
# Run all 23 unit, domain, integration, and OpenAPI tests
cargo test --manifest-path backend/Cargo.toml --workspace

# Run property-based tests specifically
cargo test --manifest-path backend/Cargo.toml -p ledgce-domain

# Run PostgreSQL integration lifecycle test
cargo test --manifest-path backend/Cargo.toml -p ledgce-application --test integration
```

### 2.2 High-Concurrency Load & Stress Benchmark
```bash
cargo run --manifest-path backend/Cargo.toml -p ledgce-bench
```
Executes 500 concurrent operations across 10 asynchronous workers, verifies deadlock-free row locking, measures latency percentiles, and triggers automated post-stress reconciliation to verify zero ledger drift.

### 2.3 Live REST API Automated Suite
```powershell
pwsh scripts/test_rest_api.ps1
```
Tests all 15 REST endpoints against the live Axum daemon with positive, negative, and role-based access validation.

### 2.4 Frontend Unit Tests
```bash
cd frontend
pnpm test
```
Executes Vitest tests verifying financial decimal formatters, double-entry validation invariants, and idempotency key length guards.
