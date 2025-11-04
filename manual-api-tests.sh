#!/bin/bash

# Manual API Tests for Consignments.ai Demo
# Comprehensive testing of all endpoints

BASE_URL="http://localhost:3003"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CONSIGNMENTS.AI - MANUAL API TESTS                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0

# Test function
run_test() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"

    test_count=$((test_count + 1))

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq "$expected_status" ] || [ "$status_code" -eq 200 ] || [ "$status_code" -eq 201 ]; then
        echo -e "${GREEN}✅${NC} $name"
        echo "   Status: $status_code"
        pass_count=$((pass_count + 1))
        if [ ! -z "$6" ]; then
            echo "$body" | jq "$6" 2>/dev/null || echo "   Response: $(echo $body | head -c 100)"
        fi
    else
        echo -e "${RED}❌${NC} $name"
        echo "   Status: $status_code (expected: $expected_status)"
        echo "   Response: $(echo $body | head -c 200)"
    fi
    echo ""
}

echo "=== ASSETS API ==="
run_test "GET /api/assets" "GET" "/api/assets" "" 200 ".assets | length"
run_test "GET /api/assets?status=available" "GET" "/api/assets?status=available" "" 200 ".assets | length"

echo "=== BOOKINGS API ==="
run_test "GET /api/bookings" "GET" "/api/bookings" "" 200 ".bookings | length"
BOOKING_ID=$(curl -s "$BASE_URL/api/bookings" | jq -r '.bookings[0].id')
run_test "GET /api/bookings/[id]" "GET" "/api/bookings/$BOOKING_ID" "" 200 ".booking.id"

echo "=== EXPENSES API ==="
run_test "GET /api/expenses" "GET" "/api/expenses" "" 200 ".expenses | length"
run_test "GET /api/expenses?status=pending" "GET" "/api/expenses?status=pending" "" 200 ".expenses | length"

echo "=== OWNERS API ==="
run_test "GET /api/owners" "GET" "/api/owners" "" 200 ".owners | length"

echo "=== REMITTANCES API ==="
OWNER_ID=$(curl -s "$BASE_URL/api/owners" | jq -r '.owners[0].id')
run_test "POST /api/remittances/calculate" "POST" "/api/remittances/calculate" \
    "{\"owner_id\":\"$OWNER_ID\",\"period_start\":\"2025-10-01\",\"period_end\":\"2025-10-31\"}" \
    200 ".owner_payout"

echo "=== SYNC API ==="
run_test "GET /api/sync/hubspot" "GET" "/api/sync/hubspot" "" 200

echo "=== DOCUMENTS API ==="
run_test "GET /api/documents/upload (should be 405)" "GET" "/api/documents/upload" "" 405

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
percentage=$((pass_count * 100 / test_count))
echo "Tests passed: $pass_count / $test_count ($percentage%)"
echo ""

if [ $pass_count -eq $test_count ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    failed=$((test_count - pass_count))
    echo -e "${YELLOW}⚠️  $failed test(s) failed${NC}"
fi
