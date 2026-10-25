# Ledgce Local Seeding Script
param(
    [string]$ApiUrl = "http://127.0.0.1:8080/api/v1",
    [string]$AdminToken = "dev_admin_token"
)

Write-Host "=================================================="
Write-Host "  LEDGCE LOCAL SEED DATA GENERATOR"
Write-Host "=================================================="

$headers = @{
    "Authorization" = "Bearer $AdminToken"
    "Content-Type"  = "application/json"
}

# 1. Create Customer Accounts
$accounts = @(
    @{ code = "CUST-TREASURY-01"; name = "Global Treasury Reserve"; kind = "customer"; currency = "USD"; initial = "2500000.00" },
    @{ code = "CUST-MERCHANT-ALPHA"; name = "Alpha Merchant Escrow"; kind = "customer"; currency = "USD"; initial = "750000.00" },
    @{ code = "CUST-VENTURES-EUR"; name = "Ventures Europe Liquidity"; kind = "customer"; currency = "EUR"; initial = "1200000.00" },
    @{ code = "CUST-INDONESIA-CORP"; name = "PT Ledgce Digital Solusi"; kind = "customer"; currency = "IDR"; initial = "5000000000" }
)

foreach ($acct in $accounts) {
    Write-Host "Creating account $($acct.code)..."
    $body = @{
        code = $acct.code
        name = $acct.name
        kind = $acct.kind
        currency = $acct.currency
        synthetic = $true
    } | ConvertTo-Json

    try {
        $created = Invoke-RestMethod -Uri "$ApiUrl/accounts" -Method Post -Headers $headers -Body $body
        Write-Host "  ✓ Account created: $($created.id)"

        # Inject opening balance
        $initBody = @{
            account_id = $created.id
            amount = $acct.initial
            idempotency_key = "seed-init-$($acct.code)"
        } | ConvertTo-Json

        $initRes = Invoke-RestMethod -Uri "$ApiUrl/accounts/opening-balance" -Method Post -Headers $headers -Body $initBody
        Write-Host "  ✓ Opening balance injected: $($acct.initial) $($acct.currency)"
    } catch {
        Write-Host "  ! Account $($acct.code) may already exist or error: $_"
    }
}

Write-Host "`nSeeding completed successfully!"
