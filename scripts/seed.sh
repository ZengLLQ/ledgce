#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8080/api/v1}"
ADMIN_TOKEN="${ADMIN_TOKEN:-dev_admin_token}"

echo "=================================================="
echo "  LEDGCE LOCAL SEED DATA GENERATOR"
echo "=================================================="

seed_account() {
  local code="$1"
  local name="$2"
  local currency="$3"
  local amount="$4"

  echo "Creating account ${code}..."
  local res
  res=$(curl -s -X POST "${API_URL}/accounts" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"${code}\",\"name\":\"${name}\",\"kind\":\"customer\",\"currency\":\"${currency}\",\"synthetic\":true}")

  local acct_id
  acct_id=$(echo "${res}" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || true)

  if [ -n "${acct_id}" ]; then
    echo "  ✓ Account created: ${acct_id}"
    curl -s -X POST "${API_URL}/accounts/opening-balance" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"account_id\":\"${acct_id}\",\"amount\":\"${amount}\",\"idempotency_key\":\"seed-init-${code}\"}" > /dev/null
    echo "  ✓ Opening balance injected: ${amount} ${currency}"
  fi
}

seed_account "CUST-TREASURY-01" "Global Treasury Reserve" "USD" "2500000.00"
seed_account "CUST-MERCHANT-ALPHA" "Alpha Merchant Escrow" "USD" "750000.00"
seed_account "CUST-VENTURES-EUR" "Ventures Europe Liquidity" "EUR" "1200000.00"
seed_account "CUST-INDONESIA-CORP" "PT Ledgce Digital Solusi" "IDR" "5000000000"

echo -e "\nSeeding complete!"
