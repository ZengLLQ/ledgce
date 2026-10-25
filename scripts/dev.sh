#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "  STARTING LEDGCE PLATFORM SERVICES"
echo "=================================================="

echo "[1/4] Starting PostgreSQL..."
docker compose up -d postgres

echo "[2/4] Starting REST API daemon (port 8080)..."
cargo run --manifest-path backend/Cargo.toml -p ledgce-api &

echo "[3/4] Starting Outbox Worker daemon..."
cargo run --manifest-path backend/Cargo.toml -p ledgce-worker &

echo "[4/4] Starting Frontend dev server..."
(cd frontend && pnpm dev --port 3000 --host 127.0.0.1) &

echo "All services running in background!"
wait
