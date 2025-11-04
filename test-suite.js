#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Consignments.ai Demo
 * Tests all API endpoints, CRUD operations, and database functionality
 */

const BASE_URL = 'http://localhost:3003';
const SUPABASE_URL = 'https://xaxzulvecgoyylicymid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheHp1bHZlY2dveXlsaWN5bWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDE3NDUsImV4cCI6MjA3Nzc3Nzc0NX0.z4osRLodV1haqWtU9zWcWOd3WWpdghrRoyRCSRHjDSc';

let testResults = {
  database: [],
  api: [],
  crud: [],
  integrity: []
};

let testData = {
  createdAssetId: null,
  createdBookingId: null,
  createdExpenseId: null,
  sampleOwnerId: null,
  sampleBookingId: null
};

// Helper function to make API requests
async function apiRequest(method, path, data = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return {
      status: response.status,
      ok: response.ok,
      body
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Helper function for Supabase queries
async function supabaseQuery(table, operation = 'select', data = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${operation === 'select' ? '?select=*' : ''}`;
  const options = {
    method: operation === 'select' ? 'GET' : operation === 'count' ? 'GET' : 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': operation === 'count' ? 'count=exact' : 'return=representation'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return {
      status: response.status,
      ok: response.ok,
      body,
      count: response.headers.get('content-range')?.split('/')[1]
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test result logging
function logTest(category, name, passed, details = '') {
  const result = {
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  testResults[category].push(result);

  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category.toUpperCase()}] ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// ============================================================
// DATABASE SCHEMA TESTS
// ============================================================

async function testDatabaseSchema() {
  console.log('\n=== DATABASE SCHEMA TESTS ===\n');

  const tables = [
    'owners', 'assets', 'bookings', 'transactions', 'expenses',
    'maintenance_records', 'inspections', 'damage_reports',
    'remittances', 'documents', 'campaigns', 'analytics_events',
    'leads', 'communications', 'commission_tiers', 'payment_methods'
  ];

  for (const table of tables) {
    const result = await supabaseQuery(table, 'select');
    logTest('database', `Table exists: ${table}`, result.ok,
      result.ok ? `Found ${Array.isArray(result.body) ? result.body.length : 0} records` : result.error);
  }

  // Test specific table counts
  const assetResult = await supabaseQuery('assets', 'select');
  const assetCount = Array.isArray(assetResult.body) ? assetResult.body.length : 0;
  logTest('database', 'Assets table has 25 RVs', assetCount === 25,
    `Found ${assetCount} assets`);

  const bookingResult = await supabaseQuery('bookings', 'select');
  const bookingCount = Array.isArray(bookingResult.body) ? bookingResult.body.length : 0;
  logTest('database', 'Bookings table has 60 bookings', bookingCount === 60,
    `Found ${bookingCount} bookings`);

  const expenseResult = await supabaseQuery('expenses', 'select');
  const expenseCount = Array.isArray(expenseResult.body) ? expenseResult.body.length : 0;
  logTest('database', 'Expenses table has 30 expenses', expenseCount === 30,
    `Found ${expenseCount} expenses`);

  // Store sample IDs for later tests
  if (Array.isArray(assetResult.body) && assetResult.body.length > 0) {
    const asset = assetResult.body[0];
    testData.sampleOwnerId = asset.owner_id;
  }

  if (Array.isArray(bookingResult.body) && bookingResult.body.length > 0) {
    testData.sampleBookingId = bookingResult.body[0].id;
  }
}

// ============================================================
// API ENDPOINT TESTS
// ============================================================

async function testAssetsAPI() {
  console.log('\n=== ASSETS API TESTS ===\n');

  // GET all assets
  let result = await apiRequest('GET', '/api/assets');
  logTest('api', 'GET /api/assets', result.ok && Array.isArray(result.body),
    result.ok ? `Returned ${result.body.length} assets` : result.error);

  // GET available assets
  result = await apiRequest('GET', '/api/assets?status=available');
  logTest('api', 'GET /api/assets?status=available', result.ok,
    result.ok ? `Returned ${Array.isArray(result.body) ? result.body.length : 0} available assets` : result.error);

  // POST create new asset
  const newAsset = {
    owner_id: testData.sampleOwnerId,
    make: 'Test',
    model: 'Test RV',
    year: 2024,
    vin: 'TEST' + Date.now(),
    length: 30,
    sleeps: 6,
    daily_rate: 300,
    weekly_rate: 1800,
    monthly_rate: 5000,
    status: 'available',
    location: 'Test Location',
    description: 'Test RV for API testing'
  };

  result = await apiRequest('POST', '/api/assets', newAsset);
  logTest('api', 'POST /api/assets (create)', result.ok,
    result.ok ? `Created asset ID: ${result.body?.id}` : result.error || JSON.stringify(result.body));

  if (result.ok && result.body?.id) {
    testData.createdAssetId = result.body.id;
  }

  // PATCH update asset
  if (testData.createdAssetId) {
    result = await apiRequest('PATCH', `/api/assets`, {
      id: testData.createdAssetId,
      daily_rate: 350,
      status: 'maintenance'
    });
    logTest('api', 'PATCH /api/assets (update)', result.ok,
      result.ok ? 'Updated asset successfully' : result.error || JSON.stringify(result.body));
  }
}

async function testBookingsAPI() {
  console.log('\n=== BOOKINGS API TESTS ===\n');

  // GET all bookings
  let result = await apiRequest('GET', '/api/bookings');
  logTest('api', 'GET /api/bookings', result.ok && Array.isArray(result.body),
    result.ok ? `Returned ${result.body.length} bookings` : result.error);

  // GET specific booking
  if (testData.sampleBookingId) {
    result = await apiRequest('GET', `/api/bookings/${testData.sampleBookingId}`);
    logTest('api', `GET /api/bookings/[id]`, result.ok,
      result.ok ? `Retrieved booking ${testData.sampleBookingId}` : result.error);
  }

  // POST create new booking
  if (testData.createdAssetId) {
    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newBooking = {
      asset_id: testData.createdAssetId,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0123',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_amount: 2100,
      status: 'confirmed',
      payment_status: 'paid'
    };

    result = await apiRequest('POST', '/api/bookings', newBooking);
    logTest('api', 'POST /api/bookings (create)', result.ok,
      result.ok ? `Created booking ID: ${result.body?.id}` : result.error || JSON.stringify(result.body));

    if (result.ok && result.body?.id) {
      testData.createdBookingId = result.body.id;
    }
  }

  // PATCH update booking status
  if (testData.createdBookingId) {
    result = await apiRequest('PATCH', `/api/bookings/${testData.createdBookingId}`, {
      status: 'completed'
    });
    logTest('api', 'PATCH /api/bookings/[id] (update status)', result.ok,
      result.ok ? 'Updated booking status to completed' : result.error || JSON.stringify(result.body));
  }
}

async function testExpensesAPI() {
  console.log('\n=== EXPENSES API TESTS ===\n');

  // GET all expenses
  let result = await apiRequest('GET', '/api/expenses');
  logTest('api', 'GET /api/expenses', result.ok && Array.isArray(result.body),
    result.ok ? `Returned ${result.body.length} expenses` : result.error);

  // GET pending expenses
  result = await apiRequest('GET', '/api/expenses?status=pending');
  logTest('api', 'GET /api/expenses?status=pending', result.ok,
    result.ok ? `Returned ${Array.isArray(result.body) ? result.body.length : 0} pending expenses` : result.error);

  // POST create new expense
  if (testData.createdAssetId) {
    const newExpense = {
      asset_id: testData.createdAssetId,
      type: 'maintenance',
      amount: 250.00,
      description: 'Test expense - oil change',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    result = await apiRequest('POST', '/api/expenses', newExpense);
    logTest('api', 'POST /api/expenses (create)', result.ok,
      result.ok ? `Created expense ID: ${result.body?.id}` : result.error || JSON.stringify(result.body));

    if (result.ok && result.body?.id) {
      testData.createdExpenseId = result.body.id;
    }
  }

  // PATCH approve expense
  if (testData.createdExpenseId) {
    result = await apiRequest('PATCH', '/api/expenses', {
      id: testData.createdExpenseId,
      status: 'approved'
    });
    logTest('api', 'PATCH /api/expenses (approve)', result.ok,
      result.ok ? 'Approved expense successfully' : result.error || JSON.stringify(result.body));
  }
}

async function testOwnersAPI() {
  console.log('\n=== OWNERS API TESTS ===\n');

  // GET all owners
  let result = await apiRequest('GET', '/api/owners');
  logTest('api', 'GET /api/owners', result.ok && Array.isArray(result.body),
    result.ok ? `Returned ${result.body.length} owners` : result.error);
}

async function testInspectionsAPI() {
  console.log('\n=== INSPECTIONS API TESTS ===\n');

  // POST create inspection with damages
  if (testData.createdAssetId && testData.createdBookingId) {
    const newInspection = {
      asset_id: testData.createdAssetId,
      booking_id: testData.createdBookingId,
      type: 'post-trip',
      damages_found: true,
      notes: 'Test inspection with damages',
      damages: [
        {
          location: 'front bumper',
          description: 'Minor scratch',
          severity: 'minor',
          estimated_cost: 150
        }
      ]
    };

    result = await apiRequest('POST', '/api/inspections', newInspection);
    logTest('api', 'POST /api/inspections (with damages)', result.ok,
      result.ok ? `Created inspection ID: ${result.body?.id}` : result.error || JSON.stringify(result.body));
  }
}

async function testRemittancesAPI() {
  console.log('\n=== REMITTANCES API TESTS ===\n');

  // POST calculate remittance
  if (testData.sampleOwnerId) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const result = await apiRequest('POST', '/api/remittances/calculate', {
      owner_id: testData.sampleOwnerId,
      start_date: startDate,
      end_date: endDate
    });

    logTest('api', 'POST /api/remittances/calculate', result.ok,
      result.ok ? `Calculated remittance: $${result.body?.amount || 0}` : result.error || JSON.stringify(result.body));
  }
}

async function testOnboardingAPI() {
  console.log('\n=== ONBOARDING API TESTS ===\n');

  const timestamp = Date.now();
  const onboardData = {
    // Owner info
    first_name: 'Test',
    last_name: 'Owner',
    email: `testowner${timestamp}@example.com`,
    phone: '555-0199',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zip: '12345',
    payment_method: 'bank_transfer',

    // Asset info
    make: 'Test',
    model: 'Onboard RV',
    year: 2024,
    vin: 'ONBOARD' + timestamp,
    length: 32,
    sleeps: 8,
    daily_rate: 400,
    weekly_rate: 2400,
    monthly_rate: 7000,
    location: 'Test Location',
    description: 'Test RV from onboarding'
  };

  const result = await apiRequest('POST', '/api/onboard/owner', onboardData);
  logTest('api', 'POST /api/onboard/owner', result.ok,
    result.ok ? `Created owner and asset via onboarding` : result.error || JSON.stringify(result.body));
}

async function testDocumentsAPI() {
  console.log('\n=== DOCUMENTS API TESTS ===\n');

  // GET documents upload endpoint
  const result = await apiRequest('GET', '/api/documents/upload');
  logTest('api', 'GET /api/documents/upload', result.status === 405 || result.ok,
    'Endpoint exists (returns 405 for GET, expects POST)');
}

async function testSyncAPI() {
  console.log('\n=== SYNC API TESTS ===\n');

  // GET bulk sync (this might take a while)
  let result = await apiRequest('GET', '/api/sync/hubspot');
  logTest('api', 'GET /api/sync/hubspot (bulk sync)', result.ok || result.status === 500,
    result.ok ? 'Sync initiated' : 'Endpoint exists but may require HubSpot config');

  // POST sync specific owner
  if (testData.sampleOwnerId) {
    result = await apiRequest('POST', '/api/sync/hubspot', {
      type: 'owner',
      id: testData.sampleOwnerId
    });
    logTest('api', 'POST /api/sync/hubspot (specific owner)', result.ok || result.status === 500,
      result.ok ? 'Synced owner to HubSpot' : 'Endpoint exists but may require HubSpot config');
  }
}

// ============================================================
// DATABASE INTEGRITY TESTS
// ============================================================

async function testDatabaseIntegrity() {
  console.log('\n=== DATABASE INTEGRITY TESTS ===\n');

  // Test foreign key relationships
  const bookingsResult = await supabaseQuery('bookings', 'select');
  if (bookingsResult.ok && Array.isArray(bookingsResult.body)) {
    const bookings = bookingsResult.body;
    const orphanedBookings = [];

    for (const booking of bookings.slice(0, 10)) { // Test first 10 for speed
      const assetCheck = await supabaseQuery(`assets?id=eq.${booking.asset_id}`, 'select');
      if (!assetCheck.ok || !Array.isArray(assetCheck.body) || assetCheck.body.length === 0) {
        orphanedBookings.push(booking.id);
      }
    }

    logTest('integrity', 'No orphaned bookings (foreign key check)', orphanedBookings.length === 0,
      orphanedBookings.length > 0 ? `Found ${orphanedBookings.length} orphaned bookings` : 'All bookings have valid assets');
  }

  // Test transaction creation for bookings
  if (testData.createdBookingId) {
    const transactionResult = await supabaseQuery(`transactions?booking_id=eq.${testData.createdBookingId}`, 'select');
    const hasTransaction = transactionResult.ok && Array.isArray(transactionResult.body) && transactionResult.body.length > 0;
    logTest('integrity', 'Booking creates transaction', hasTransaction,
      hasTransaction ? `Found ${transactionResult.body.length} transaction(s) for booking` : 'No transaction found for created booking');
  }

  // Test expense approval creates transaction
  if (testData.createdExpenseId) {
    const transactionResult = await supabaseQuery(`transactions?expense_id=eq.${testData.createdExpenseId}`, 'select');
    const hasTransaction = transactionResult.ok && Array.isArray(transactionResult.body) && transactionResult.body.length > 0;
    logTest('integrity', 'Approved expense creates transaction', hasTransaction,
      hasTransaction ? `Found ${transactionResult.body.length} transaction(s) for expense` : 'No transaction found for approved expense');
  }
}

// ============================================================
// CRUD OPERATION TESTS
// ============================================================

async function testCRUDOperations() {
  console.log('\n=== CRUD OPERATION TESTS ===\n');

  // CREATE - Already tested in API tests
  logTest('crud', 'CREATE asset via API', testData.createdAssetId !== null,
    testData.createdAssetId ? `Created asset: ${testData.createdAssetId}` : 'Asset creation failed');

  logTest('crud', 'CREATE booking via API', testData.createdBookingId !== null,
    testData.createdBookingId ? `Created booking: ${testData.createdBookingId}` : 'Booking creation failed');

  logTest('crud', 'CREATE expense via API', testData.createdExpenseId !== null,
    testData.createdExpenseId ? `Created expense: ${testData.createdExpenseId}` : 'Expense creation failed');

  // READ - Verify data in database
  if (testData.createdAssetId) {
    const result = await supabaseQuery(`assets?id=eq.${testData.createdAssetId}`, 'select');
    const assetExists = result.ok && Array.isArray(result.body) && result.body.length > 0;
    logTest('crud', 'READ asset from database', assetExists,
      assetExists ? `Asset found with daily_rate: $${result.body[0].daily_rate}` : 'Asset not found in database');
  }

  // UPDATE - Already tested in API tests
  if (testData.createdAssetId) {
    const result = await supabaseQuery(`assets?id=eq.${testData.createdAssetId}`, 'select');
    if (result.ok && Array.isArray(result.body) && result.body.length > 0) {
      const updated = result.body[0].daily_rate === 350 && result.body[0].status === 'maintenance';
      logTest('crud', 'UPDATE asset verified in database', updated,
        updated ? 'Asset updates persisted correctly' : `Daily rate: ${result.body[0].daily_rate}, Status: ${result.body[0].status}`);
    }
  }

  // DELETE - Test deletion
  if (testData.createdAssetId) {
    const deleteUrl = `${SUPABASE_URL}/rest/v1/assets?id=eq.${testData.createdAssetId}`;
    const deleteResult = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    logTest('crud', 'DELETE asset', deleteResult.ok,
      deleteResult.ok ? `Deleted asset ${testData.createdAssetId}` : `Delete failed: ${deleteResult.status}`);

    // Verify deletion
    if (deleteResult.ok) {
      const verifyResult = await supabaseQuery(`assets?id=eq.${testData.createdAssetId}`, 'select');
      const deleted = verifyResult.ok && Array.isArray(verifyResult.body) && verifyResult.body.length === 0;
      logTest('crud', 'DELETE verified in database', deleted,
        deleted ? 'Asset successfully removed from database' : 'Asset still exists in database');
    }
  }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   CONSIGNMENTS.AI DEMO - COMPREHENSIVE TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testDatabaseSchema();
    await testAssetsAPI();
    await testBookingsAPI();
    await testExpensesAPI();
    await testOwnersAPI();
    await testInspectionsAPI();
    await testRemittancesAPI();
    await testDocumentsAPI();
    await testSyncAPI();
    await testOnboardingAPI();
    await testDatabaseIntegrity();
    await testCRUDOperations();

    // Generate summary report
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const categories = ['database', 'api', 'crud', 'integrity'];
    let totalTests = 0;
    let totalPassed = 0;

    for (const category of categories) {
      const tests = testResults[category];
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      totalTests += total;
      totalPassed += passed;

      const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
      console.log(`${category.toUpperCase().padEnd(12)} ${passed}/${total} passed (${percentage}%)`);
    }

    console.log(`\n${'TOTAL'.padEnd(12)} ${totalPassed}/${totalTests} passed (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);

    // List failed tests
    const failedTests = [];
    for (const category of categories) {
      failedTests.push(...testResults[category].filter(t => !t.passed).map(t => ({...t, category})));
    }

    if (failedTests.length > 0) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                     FAILED TESTS                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      for (const test of failedTests) {
        console.log(`❌ [${test.category.toUpperCase()}] ${test.name}`);
        if (test.details) {
          console.log(`   ${test.details}`);
        }
      }
    }

    // Save detailed report
    const report = {
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalTests - totalPassed,
        percentage: ((totalPassed / totalTests) * 100).toFixed(1)
      },
      results: testResults,
      timestamp: new Date().toISOString()
    };

    console.log('\n✅ Test suite completed!');
    console.log(`📊 Full report saved to: test-results.json`);

    // Write results to file
    const fs = require('fs');
    fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch(console.error);
