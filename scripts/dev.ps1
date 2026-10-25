# Ledgce Local Environment Launcher
Write-Host "=================================================="
Write-Host "  STARTING LEDGCE PLATFORM SERVICES"
Write-Host "=================================================="

# 1. Start PostgreSQL
Write-Host "[1/4] Ensuring PostgreSQL container is healthy..."
docker compose up -d postgres

# 2. Start API
Write-Host "[2/4] Starting REST API daemon (port 8080)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cargo run --manifest-path backend/Cargo.toml -p ledgce-api"

# 3. Start Outbox Worker
Write-Host "[3/4] Starting Background Outbox Worker daemon..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cargo run --manifest-path backend/Cargo.toml -p ledgce-worker"

# 4. Start Frontend
Write-Host "[4/4] Starting Frontend Vite dev server (port 3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm dev --port 3000 --host 127.0.0.1"

Write-Host "`nAll Ledgce services launched!"
Write-Host "  Web Workspace:   http://127.0.0.1:3000"
Write-Host "  API Swagger UI:  http://127.0.0.1:8080/swagger-ui"
Write-Host "  Database:        127.0.0.1:5433"
