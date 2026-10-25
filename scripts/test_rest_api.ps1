# Ledgce Automated REST API Test Suite
# Tests all public and authenticated endpoints against the live backend

param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$AdminToken = "dev_admin_token",
    [string]$ReaderToken = "dev_reader_token"
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  LEDGCE REST API AUTOMATED TEST SUITE" -ForegroundColor Cyan
Write-Host "  Target Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Test {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name - $Details" -ForegroundColor Red
        $script:failed++
    }
}

function Invoke-SafeApi {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        if ($Body) {
            $params["Body"] = $Body
        }
        $resp = Invoke-WebRequest @params
        $json = $null
        if ($resp.Content) {
            try { $json = $resp.Content | ConvertFrom-Json } catch {}
        }
        return @{
            StatusCode = [int]$resp.StatusCode
            Content = $resp.Content
            Json = $json
            Error = $null
        }
    } catch {
        $ex = $_.Exception
        $statusCode = $null
        $content = $null
        if ($ex.Response) {
            $statusCode = [int]$ex.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
            } catch {}
        }
        $json = $null
        if ($content) {
            try { $json = $content | ConvertFrom-Json } catch {}
        }
        return @{
            StatusCode = $statusCode
            Content = $content
            Json = $json
            Error = $_.ToString()
        }
    }
}

$testId = [System.Guid]::NewGuid().ToString().Substring(0, 8)
$adminHeaders = @{
    "Authorization" = "Bearer $AdminToken"
    "Content-Type"  = "application/json"
}
$readerHeaders = @{
    "Authorization" = "Bearer $ReaderToken"
    "Content-Type"  = "application/json"
}

# 1. Health & Public Docs
$healthRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/health" -Method "GET"
Assert-Test -Name "GET /api/v1/health returns status 'ok'" -Condition ($healthRes.StatusCode -eq 200 -and $healthRes.Json.status -eq "ok" -and $healthRes.Json.service -eq "ledgce-api") -Details $healthRes.Content

$rootHealthRes = Invoke-SafeApi -Uri "$BaseUrl/health" -Method "GET"
Assert-Test -Name "GET /health (root) returns status 'ok'" -Condition ($rootHealthRes.StatusCode -eq 200 -and $rootHealthRes.Json.status -eq "ok") -Details $rootHealthRes.Content

$readyRes = Invoke-SafeApi -Uri "$BaseUrl/ready" -Method "GET"
Assert-Test -Name "GET /ready (root) returns status 'ready' & db 'connected'" -Condition ($readyRes.StatusCode -eq 200 -and $readyRes.Json.status -eq "ready" -and $readyRes.Json.database -eq "connected") -Details $readyRes.Content

$metricsRes = Invoke-SafeApi -Uri "$BaseUrl/metrics" -Method "GET"
Assert-Test -Name "GET /metrics (root) returns Prometheus metrics text" -Condition ($metricsRes.StatusCode -eq 200 -and $metricsRes.Content -like "*# HELP*") -Details "Length: $($metricsRes.Content.Length)"

$swaggerRes = Invoke-SafeApi -Uri "$BaseUrl/swagger-ui" -Method "GET"
Assert-Test -Name "GET /swagger-ui returns HTTP 200" -Condition ($swaggerRes.StatusCode -eq 200 -or $swaggerRes.StatusCode -eq 301) -Details "Status: $($swaggerRes.StatusCode)"

$openapiRes = Invoke-SafeApi -Uri "$BaseUrl/api-docs/openapi.json" -Method "GET"
Assert-Test -Name "GET /api-docs/openapi.json returns valid spec" -Condition ($openapiRes.StatusCode -eq 200 -and $openapiRes.Json.openapi -ne $null -and $openapiRes.Json.info.title -like "*Ledgce*") -Details $openapiRes.Content

# 2. Auth Guard & Role Enforcement
$unauthRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/overview" -Method "GET"
Assert-Test -Name "GET /api/v1/overview without token is 401 Unauthorized" -Condition ($unauthRes.StatusCode -eq 401) -Details "Status: $($unauthRes.StatusCode)"

$readerOverview = Invoke-SafeApi -Uri "$BaseUrl/api/v1/overview" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/overview with Reader role is 200 OK" -Condition ($readerOverview.StatusCode -eq 200 -and $readerOverview.Json.ledger_balanced -eq $true) -Details $readerOverview.Content

$forbiddenRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts" -Method "POST" -Headers $readerHeaders -Body "{}"
Assert-Test -Name "POST /api/v1/accounts with Reader role is 403 Forbidden" -Condition ($forbiddenRes.StatusCode -eq 403) -Details "Status: $($forbiddenRes.StatusCode)"

# 3. Account Lifecycle & Balances
$acctAId = $null
$acctBId = $null

$createABody = @{
    code = "REST-A-$testId"
    name = "REST Test Account Alpha"
    kind = "customer"
    currency = "USD"
    synthetic = $true
} | ConvertTo-Json

$acctARes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts" -Method "POST" -Headers $adminHeaders -Body $createABody
$acctAId = $acctARes.Json.id
Assert-Test -Name "POST /api/v1/accounts creates Account A" -Condition ($acctARes.StatusCode -eq 200 -and $acctARes.Json.id -ne $null -and $acctARes.Json.balance -eq "0") -Details $acctARes.Content

$createBBody = @{
    code = "REST-B-$testId"
    name = "REST Test Account Beta"
    kind = "customer"
    currency = "USD"
    synthetic = $true
} | ConvertTo-Json

$acctBRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts" -Method "POST" -Headers $adminHeaders -Body $createBBody
$acctBId = $acctBRes.Json.id
Assert-Test -Name "POST /api/v1/accounts creates Account B" -Condition ($acctBRes.StatusCode -eq 200 -and $acctBRes.Json.id -ne $null -and $acctBRes.Json.balance -eq "0") -Details $acctBRes.Content

$initBody = @{
    account_id = $acctAId
    amount = "10000.00"
    idempotency_key = "init-rest-$testId"
} | ConvertTo-Json

$initRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts/opening-balance" -Method "POST" -Headers $adminHeaders -Body $initBody
Assert-Test -Name "POST /api/v1/accounts/opening-balance injects 10,000 USD via System Equity" -Condition ($initRes.StatusCode -eq 200 -and $initRes.Json.replayed -eq $false -and $initRes.Json.transaction.balanced -eq $true) -Details $initRes.Content

$acctADetail = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts/$acctAId" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/accounts/{id} verifies balance projection matches journal" -Condition ($acctADetail.StatusCode -eq 200 -and $acctADetail.Json.balance -eq "10000.00000000" -and $acctADetail.Json.projection_matches_journal -eq $true) -Details $acctADetail.Content

$acctABalance = Invoke-SafeApi -Uri "$BaseUrl/api/v1/accounts/$acctAId/balance" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/accounts/{id}/balance returns dedicated balance view" -Condition ($acctABalance.StatusCode -eq 200 -and $acctABalance.Json.account_id -eq $acctAId -and $acctABalance.Json.balance -eq "10000.00000000") -Details $acctABalance.Content

# 4. Atomic Transfer & Idempotency
$txId = $null
$transferKey = "tx-rest-$testId"

$txBody = @{
    source_account_id = $acctAId
    destination_account_id = $acctBId
    amount = "2500.00"
    currency = "USD"
    description = "Automated REST peer transfer"
    idempotency_key = $transferKey
} | ConvertTo-Json

$txRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers" -Method "POST" -Headers $adminHeaders -Body $txBody
$txId = $txRes.Json.transaction.id
Assert-Test -Name "POST /api/v1/transfers posts atomic 2,500 USD transfer" -Condition ($txRes.StatusCode -eq 200 -and $txRes.Json.replayed -eq $false -and $txRes.Json.transaction.balanced -eq $true -and $txRes.Json.transaction.entries.Count -eq 2) -Details $txRes.Content

$replayRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers" -Method "POST" -Headers $adminHeaders -Body $txBody
Assert-Test -Name "POST /api/v1/transfers exact replay returns replayed: true" -Condition ($replayRes.StatusCode -eq 200 -and $replayRes.Json.replayed -eq $true -and $replayRes.Json.transaction.id -eq $txId) -Details $replayRes.Content

$mismatchBody = @{
    source_account_id = $acctAId
    destination_account_id = $acctBId
    amount = "3500.00" # altered amount!
    currency = "USD"
    idempotency_key = $transferKey
} | ConvertTo-Json

$mismatchRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers" -Method "POST" -Headers $adminHeaders -Body $mismatchBody
Assert-Test -Name "POST /api/v1/transfers altered payload returns 409 Conflict" -Condition ($mismatchRes.StatusCode -eq 409) -Details "Status: $($mismatchRes.StatusCode)"

$insufficientBody = @{
    source_account_id = $acctAId
    destination_account_id = $acctBId
    amount = "500000.00" # excessive amount!
    currency = "USD"
} | ConvertTo-Json

$insufficientRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers" -Method "POST" -Headers $adminHeaders -Body $insufficientBody
Assert-Test -Name "POST /api/v1/transfers with excessive amount returns 422 Unprocessable" -Condition ($insufficientRes.StatusCode -eq 422) -Details "Status: $($insufficientRes.StatusCode)"

# 5. Transaction Details & Compensating Reversal
$txDetail = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers/$txId" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/transfers/{id} returns entries and lifecycle history" -Condition ($txDetail.StatusCode -eq 200 -and $txDetail.Json.entries.Count -eq 2 -and $txDetail.Json.lifecycle.Count -ge 1) -Details $txDetail.Content

$revBody = @{
    transaction_id = $txId
    reason = "Automated test reversal"
    idempotency_key = "rev-rest-$testId"
} | ConvertTo-Json

$revRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/transfers/reversal" -Method "POST" -Headers $adminHeaders -Body $revBody
Assert-Test -Name "POST /api/v1/transfers/reversal posts balanced compensating entries" -Condition ($revRes.StatusCode -eq 200 -and $revRes.Json.transaction.kind -eq "reversal" -and $revRes.Json.transaction.reverses_transaction_id -eq $txId) -Details $revRes.Content

# 6. Ledger Explorer, Reconciliation & Outbox
$entriesRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/ledger/entries?limit=10" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/ledger/entries returns paginated entries" -Condition ($entriesRes.StatusCode -eq 200 -and $entriesRes.Json.items.Count -ge 2) -Details $entriesRes.Content

$firstEntryId = $entriesRes.Json.items[0].id
$singleEntryRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/ledger/entries/$firstEntryId" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/ledger/entries/{id} returns single entry" -Condition ($singleEntryRes.StatusCode -eq 200 -and $singleEntryRes.Json.id -eq $firstEntryId) -Details $singleEntryRes.Content

$acctEntriesRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/ledger/accounts/$acctAId/entries" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/ledger/accounts/{id}/entries returns account specific entries" -Condition ($acctEntriesRes.StatusCode -eq 200 -and $acctEntriesRes.Json.items.Count -ge 1) -Details $acctEntriesRes.Content

$reconBody = @{
    triggered_by = "test-automator"
} | ConvertTo-Json

$reconRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/reconciliation/run" -Method "POST" -Headers $adminHeaders -Body $reconBody
Assert-Test -Name "POST /api/v1/reconciliation/run executes audit: status 'passed', 0 violations" -Condition ($reconRes.StatusCode -eq 200 -and $reconRes.Json.status -eq "passed" -and $reconRes.Json.violation_count -eq 0) -Details $reconRes.Content

$runsRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/reconciliation/runs" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/reconciliation/runs returns historical audits" -Condition ($runsRes.StatusCode -eq 200 -and ($runsRes.Json.Count -ge 1 -or $runsRes.Json.items.Count -ge 1)) -Details $runsRes.Content

$eventsRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/events?limit=5" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/events returns events list" -Condition ($eventsRes.StatusCode -eq 200 -and $eventsRes.Json.items.Count -ge 1) -Details $eventsRes.Content

$firstEventId = $eventsRes.Json.items[0].id
$singleEventRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/events/$firstEventId" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/events/{id} returns single event" -Condition ($singleEventRes.StatusCode -eq 200 -and $singleEventRes.Json.id -eq $firstEventId) -Details $singleEventRes.Content

$outboxRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/outbox/events?limit=5" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/outbox/events returns outbox queue events" -Condition ($outboxRes.StatusCode -eq 200 -and $outboxRes.Json.items.Count -ge 1) -Details $outboxRes.Content

# 7. System Health & Chaos Injections
$armBody = @{
    point = "fail_processing"
    count = 1
} | ConvertTo-Json

$armRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/system/faults/arm" -Method "POST" -Headers $adminHeaders -Body $armBody
Assert-Test -Name "POST /api/v1/system/faults/arm arms chaos fault point" -Condition ($armRes.StatusCode -eq 200 -and $armRes.Json.point -eq "fail_processing" -and $armRes.Json.remaining -ge 1) -Details $armRes.Content

$healthDegraded = Invoke-SafeApi -Uri "$BaseUrl/api/v1/system/health" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "GET /api/v1/system/health reflects armed fault (status: degraded)" -Condition ($healthDegraded.StatusCode -eq 200 -and $healthDegraded.Json.status -eq "degraded" -and $healthDegraded.Json.active_faults.Count -ge 1) -Details $healthDegraded.Content

$clearRes = Invoke-SafeApi -Uri "$BaseUrl/api/v1/system/faults/clear" -Method "POST" -Headers $adminHeaders
$healthHealthy = Invoke-SafeApi -Uri "$BaseUrl/api/v1/system/health" -Method "GET" -Headers $readerHeaders
Assert-Test -Name "POST /api/v1/system/faults/clear restores health to 'healthy'" -Condition ($healthHealthy.StatusCode -eq 200 -and $healthHealthy.Json.status -eq "healthy" -and $healthHealthy.Json.active_faults.Count -eq 0) -Details $healthHealthy.Content

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "============================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
}
exit 0
