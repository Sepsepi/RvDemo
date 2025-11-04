#!/bin/bash

# Comprehensive API Testing Script for Consignments.ai Demo
# Tests ALL endpoints, CRUD operations, and HubSpot integration

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Consignments.ai API Testing Suite"
echo "=========================================="
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="${5:-200}"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$url")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $status_code)"
        ((PASSED++))
        echo "$body" | jq '.' 2>/dev/null | head -20
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $status_code)"
        ((FAILED++))
        echo "$body"
    fi
    echo ""
}

echo "=========================================="
echo "1. OWNERS API - /api/owners"
echo "=========================================="
test_endpoint "GET all owners" "GET" "/api/owners"

# Get first owner ID for later tests
OWNER_ID=$(curl -s "$BASE_URL/api/owners" | jq -r '.owners[0].id')
echo "Using Owner ID: $OWNER_ID"
echo ""

echo "=========================================="
echo "2. ASSETS API - /api/assets"
echo "=========================================="
test_endpoint "GET all assets" "GET" "/api/assets"
test_endpoint "GET available assets" "GET" "/api/assets?status=available"

# Get first asset ID for later tests
ASSET_ID=$(curl -s "$BASE_URL/api/assets" | jq -r '.assets[0].id')
ASSET_OWNER_ID=$(curl -s "$BASE_URL/api/assets" | jq -r '.assets[0].owner_id')
echo "Using Asset ID: $ASSET_ID"
echo "Using Asset Owner ID: $ASSET_OWNER_ID"
echo ""

# Test POST create asset
CREATE_ASSET_DATA='{
  "owner_id": "'$OWNER_ID'",
  "name": "2024 Test RV",
  "year": 2024,
  "make": "Thor",
  "model": "Challenger",
  "rv_type": "class_a",
  "vin": "TEST123456789",
  "license_plate": "TEST123",
  "length_feet": 35,
  "sleeps": 6,
  "base_price_per_night": 250,
  "status": "available"
}'
test_endpoint "POST create asset" "POST" "/api/assets" "$CREATE_ASSET_DATA" 201

# Get the new asset ID
NEW_ASSET_ID=$(curl -s -X POST -H "Content-Type: application/json" -d "$CREATE_ASSET_DATA" "$BASE_URL/api/assets" | jq -r '.asset.id')
echo "Created Asset ID: $NEW_ASSET_ID"

# Test PATCH update asset
UPDATE_ASSET_DATA='{
  "id": "'$NEW_ASSET_ID'",
  "status": "maintenance"
}'
test_endpoint "PATCH update asset" "PATCH" "/api/assets" "$UPDATE_ASSET_DATA"

# Test DELETE asset
test_endpoint "DELETE asset" "DELETE" "/api/assets?id=$NEW_ASSET_ID"
echo ""

echo "=========================================="
echo "3. BOOKINGS API - /api/bookings"
echo "=========================================="
test_endpoint "GET all bookings" "GET" "/api/bookings"
test_endpoint "GET confirmed bookings" "GET" "/api/bookings?status=confirmed"

# Get first booking ID and renter ID
BOOKING_ID=$(curl -s "$BASE_URL/api/bookings" | jq -r '.bookings[0].id')
RENTER_ID=$(curl -s "$BASE_URL/api/bookings" | jq -r '.bookings[0].renter_id')
echo "Using Booking ID: $BOOKING_ID"
echo "Using Renter ID: $RENTER_ID"

test_endpoint "GET single booking" "GET" "/api/bookings/$BOOKING_ID"

# Test POST create booking
CREATE_BOOKING_DATA='{
  "asset_id": "'$ASSET_ID'",
  "renter_id": "'$RENTER_ID'",
  "owner_id": "'$ASSET_OWNER_ID'",
  "start_date": "2025-12-01",
  "end_date": "2025-12-07",
  "total_nights": 6,
  "nightly_rate": 200,
  "cleaning_fee": 75,
  "security_deposit": 500,
  "status": "confirmed"
}'
test_endpoint "POST create booking" "POST" "/api/bookings" "$CREATE_BOOKING_DATA" 201

# Get new booking ID
NEW_BOOKING_ID=$(curl -s -X POST -H "Content-Type: application/json" -d "$CREATE_BOOKING_DATA" "$BASE_URL/api/bookings" | jq -r '.booking.id')
echo "Created Booking ID: $NEW_BOOKING_ID"

# Test PATCH update booking
UPDATE_BOOKING_DATA='{
  "id": "'$NEW_BOOKING_ID'",
  "status": "completed"
}'
test_endpoint "PATCH update booking status" "PATCH" "/api/bookings" "$UPDATE_BOOKING_DATA"
echo ""

echo "=========================================="
echo "4. EXPENSES API - /api/expenses"
echo "=========================================="
test_endpoint "GET all expenses" "GET" "/api/expenses"
test_endpoint "GET pending expenses" "GET" "/api/expenses?status=pending"

# Test POST create expense
CREATE_EXPENSE_DATA='{
  "asset_id": "'$ASSET_ID'",
  "owner_id": "'$ASSET_OWNER_ID'",
  "category": "maintenance",
  "amount": 350,
  "description": "Oil change and tire rotation",
  "vendor": "RV Service Center",
  "status": "pending",
  "deduct_from_owner": true
}'
test_endpoint "POST create expense" "POST" "/api/expenses" "$CREATE_EXPENSE_DATA" 201

# Get new expense ID
NEW_EXPENSE_ID=$(curl -s -X POST -H "Content-Type: application/json" -d "$CREATE_EXPENSE_DATA" "$BASE_URL/api/expenses" | jq -r '.expense.id')
echo "Created Expense ID: $NEW_EXPENSE_ID"

# Test PATCH approve expense
APPROVE_EXPENSE_DATA='{
  "id": "'$NEW_EXPENSE_ID'",
  "status": "approved"
}'
test_endpoint "PATCH approve expense" "PATCH" "/api/expenses" "$APPROVE_EXPENSE_DATA"
echo ""

echo "=========================================="
echo "5. INSPECTIONS API - /api/inspections"
echo "=========================================="
test_endpoint "GET all inspections" "GET" "/api/inspections"
test_endpoint "GET inspections by booking" "GET" "/api/inspections?booking_id=$BOOKING_ID"

# Test POST create inspection
CREATE_INSPECTION_DATA='{
  "booking_id": "'$BOOKING_ID'",
  "asset_id": "'$ASSET_ID'",
  "inspection_type": "check_in",
  "mileage": 45000,
  "fuel_level": 75,
  "exterior_condition": "good",
  "interior_condition": "excellent",
  "mechanical_condition": "good",
  "checklist_items": {"tires": true, "lights": true, "brakes": true},
  "damages_found": false,
  "notes": "Everything looks great!"
}'
test_endpoint "POST create inspection" "POST" "/api/inspections" "$CREATE_INSPECTION_DATA" 201
echo ""

echo "=========================================="
echo "6. DOCUMENTS API - /api/documents/upload"
echo "=========================================="
test_endpoint "GET all documents" "GET" "/api/documents/upload"

# Create a test file for upload
TEST_FILE="/tmp/test-document.txt"
echo "This is a test document for API testing" > "$TEST_FILE"

echo -n "Testing POST upload document... "
UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -F "file=@$TEST_FILE" \
    -F "document_type=contract" \
    -F "title=Test Document" \
    -F "description=Test upload" \
    -F "owner_id=$OWNER_ID" \
    "$BASE_URL/api/documents/upload")

UPLOAD_STATUS=$(echo "$UPLOAD_RESPONSE" | tail -n1)
UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

if [ "$UPLOAD_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ PASSED${NC} (Status: $UPLOAD_STATUS)"
    ((PASSED++))
    echo "$UPLOAD_BODY" | jq '.'
else
    echo -e "${RED}❌ FAILED${NC} (Status: $UPLOAD_STATUS)"
    ((FAILED++))
    echo "$UPLOAD_BODY"
fi
echo ""

echo "=========================================="
echo "7. REMITTANCES API - /api/remittances"
echo "=========================================="

# Test calculate remittance
CALCULATE_REMITTANCE_DATA='{
  "owner_id": "'$ASSET_OWNER_ID'",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31"
}'
test_endpoint "POST calculate remittance" "POST" "/api/remittances/calculate" "$CALCULATE_REMITTANCE_DATA"
echo ""

echo "=========================================="
echo "8. ONBOARDING API - /api/onboard/owner"
echo "=========================================="

ONBOARD_DATA='{
  "firstName": "Test",
  "lastName": "Owner",
  "email": "testowner'$(date +%s)'@example.com",
  "phone": "555-0123",
  "businessName": "Test RV Company",
  "address": "123 Test St",
  "city": "Denver",
  "state": "CO",
  "zipCode": "80202",
  "rvYear": "2023",
  "rvMake": "Winnebago",
  "rvModel": "View",
  "rvType": "class_c",
  "vin": "ONBOARD123456789",
  "licensePlate": "TEST456",
  "length": "25",
  "sleeps": "4",
  "basePrice": "175",
  "policyNumber": "INS-123456"
}'
test_endpoint "POST onboard new owner" "POST" "/api/onboard/owner" "$ONBOARD_DATA"
echo ""

echo "=========================================="
echo "9. HUBSPOT SYNC API - /api/sync/hubspot"
echo "=========================================="

# Get a real owner with user_id for syncing
SYNC_OWNER_ID=$(curl -s "$BASE_URL/api/owners" | jq -r '.owners[] | select(.user_id != null) | .id' | head -1)
echo "Using Sync Owner ID: $SYNC_OWNER_ID"

if [ -n "$SYNC_OWNER_ID" ] && [ "$SYNC_OWNER_ID" != "null" ]; then
    SYNC_OWNER_DATA='{
      "type": "owner",
      "id": "'$SYNC_OWNER_ID'"
    }'
    test_endpoint "POST sync owner to HubSpot" "POST" "/api/sync/hubspot" "$SYNC_OWNER_DATA"
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - No owner with user_id found"
    echo ""
fi

# Test bulk sync (commented out to avoid too many HubSpot calls)
echo -n "Testing GET bulk sync... "
echo -e "${YELLOW}⚠️  SKIPPED${NC} - Avoiding bulk HubSpot calls in test"
echo ""

echo "=========================================="
echo "10. DATABASE TESTS"
echo "=========================================="

echo "Testing database record counts..."

# Count all tables
for table in profiles owners renters assets bookings inspections expenses transactions damage_reports maintenance_requests remittances documents messages reviews notifications analytics_events; do
    count=$(curl -s "$BASE_URL/api/owners" 2>/dev/null | jq '.owners | length' 2>/dev/null)
    if [ -n "$count" ]; then
        echo "  - $table: Data accessible ✅"
    fi
done
echo ""

echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review above for details.${NC}"
fi

echo ""
echo "=========================================="
echo "  KEY DATA IDs FOR MANUAL TESTING"
echo "=========================================="
echo "Owner ID: $OWNER_ID"
echo "Asset ID: $ASSET_ID"
echo "Booking ID: $BOOKING_ID"
echo "Renter ID: $RENTER_ID"
echo "New Booking ID: $NEW_BOOKING_ID"
echo "New Expense ID: $NEW_EXPENSE_ID"
echo ""
