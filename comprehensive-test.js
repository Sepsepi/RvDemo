#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Consignments.ai Demo - Fixed Version
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
  createdInspectionId: null,
  sampleOwnerId: null,
  sampleAssetId: null,
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
    method: operation === 'select' ? 'GET' : 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
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

  const requiredTables = [
    'owners', 'assets', 'bookings', 'transactions', 'expenses',
    'inspections', 'damage_reports', 'remittances', 'documents',
    'communications'
  ];

  for (const table of requiredTables) {
    const result = await supabaseQuery(table, 'select');
    logTest('database', `Table exists: ${table}`, result.ok,
      result.ok ? `Found ${Array.isArray(result.body) ? result.body.length : 0} records` : result.error);
  }

  // Test API endpoints for expected counts
  const assetsResult = await apiRequest('GET', '/api/assets');
  const assetCount = assetsResult.ok && assetsResult.body.assets ? assetsResult.body.assets.length : 0;
  logTest('database', 'Assets table has 25 RVs', assetCount === 25,
    `Found ${assetCount} assets via API`);

  const bookingsResult = await apiRequest('GET', '/api/bookings');
  const bookingCount = bookingsResult.ok && bookingsResult.body.bookings ? bookingsResult.body.bookings.length : 0;
  logTest('database', 'Bookings table has 60 bookings', bookingCount === 60,
    `Found ${bookingCount} bookings via API`);

  const expensesResult = await apiRequest('GET', '/api/expenses');
  const expenseCount = expensesResult.ok && expensesResult.body.expenses ? expensesResult.body.expenses.length : 0;
  logTest('database', 'Expenses table has 30 expenses', expenseCount === 30,
    `Found ${expenseCount} expenses via API`);

  // Store sample IDs for later tests
  if (assetsResult.ok && assetsResult.body.assets && assetsResult.body.assets.length > 0) {
    const asset = assetsResult.body.assets[0];
    testData.sampleOwnerId = asset.owner_id;
    testData.sampleAssetId = asset.id;
  }

  if (bookingsResult.ok && bookingsResult.body.bookings && bookingsResult.body.bookings.length > 0) {
    testData.sampleBookingId = bookingsResult.body.bookings[0].id;
  }

  console.log(`\nSample IDs for testing:`);
  console.log(`  Owner ID: ${testData.sampleOwnerId}`);
  console.log(`  Asset ID: ${testData.sampleAssetId}`);
  console.log(`  Booking ID: ${testData.sampleBookingId}`);
}

// ============================================================
// API ENDPOINT TESTS
// ============================================================

async function testAssetsAPI() {
  console.log('\n=== ASSETS API TESTS ===\n');

  // GET all assets
  let result = await apiRequest('GET', '/api/assets');
  logTest('api', 'GET /api/assets', result.ok && result.body.assets,
    result.ok ? `Returned ${result.body.assets.length} assets` : result.error);

  // GET available assets
  result = await apiRequest('GET', '/api/assets?status=available');
  logTest('api', 'GET /api/assets?status=available', result.ok,
    result.ok ? `Returned ${result.body.assets?.length || 0} available assets` : result.error);

  // POST create new asset
  const newAsset = {
    owner_id: testData.sampleOwnerId,
    name: 'Test RV - 2024 Test Model',
    make: 'Test',
    model: 'Test RV',
    year: 2024,
    vin: 'TEST' + Date.now(),
    rv_type: 'Class B',
    length_feet: 30,
    sleeps: 6,
    bedrooms: 2,
    bathrooms: 1,
    base_price_per_night: 300,
    cleaning_fee: 75,
    security_deposit: 500,
    status: 'available',
    city: 'Test City',
    state: 'CA',
    description: 'Test RV for API testing'
  };

  result = await apiRequest('POST', '/api/assets', newAsset);
  logTest('api', 'POST /api/assets (create)', result.ok,
    result.ok ? `Created asset ID: ${result.body?.asset?.id}` : result.error || JSON.stringify(result.body));

  if (result.ok && result.body?.asset?.id) {
    testData.createdAssetId = result.body.asset.id;
  }

  // PATCH update asset
  if (testData.createdAssetId) {
    result = await apiRequest('PATCH', `/api/assets`, {
      id: testData.createdAssetId,
      base_price_per_night: 350,
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
  logTest('api', 'GET /api/bookings', result.ok && result.body.bookings,
    result.ok ? `Returned ${result.body.bookings.length} bookings` : result.error);

  // GET specific booking
  if (testData.sampleBookingId) {
    result = await apiRequest('GET', `/api/bookings/${testData.sampleBookingId}`);
    logTest('api', `GET /api/bookings/[id]`, result.ok,
      result.ok ? `Retrieved booking ${testData.sampleBookingId}` : result.error);
  }

  // POST create new booking
  if (testData.createdAssetId) {
    const today = new Date();
    const startDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 37 * 24 * 60 * 60 * 1000);

    const newBooking = {
      asset_id: testData.createdAssetId,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0123',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_price: 2100,
      status: 'confirmed',
      payment_status: 'paid'
    };

    result = await apiRequest('POST', '/api/bookings', newBooking);
    logTest('api', 'POST /api/bookings (create)', result.ok,
      result.ok ? `Created booking ID: ${result.body?.booking?.id}` : result.error || JSON.stringify(result.body));

    if (result.ok && result.body?.booking?.id) {
      testData.createdBookingId = result.body.booking.id;
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
  logTest('api', 'GET /api/expenses', result.ok && result.body.expenses,
    result.ok ? `Returned ${result.body.expenses.length} expenses` : result.error);

  // GET pending expenses
  result = await apiRequest('GET', '/api/expenses?status=pending');
  logTest('api', 'GET /api/expenses?status=pending', result.ok,
    result.ok ? `Returned ${result.body.expenses?.length || 0} pending expenses` : result.error);

  // POST create new expense
  if (testData.createdAssetId) {
    const newExpense = {
      asset_id: testData.createdAssetId,
      expense_type: 'maintenance',
      amount: 250.00,
      description: 'Test expense - oil change',
      expense_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    result = await apiRequest('POST', '/api/expenses', newExpense);
    logTest('api', 'POST /api/expenses (create)', result.ok,
      result.ok ? `Created expense ID: ${result.body?.expense?.id}` : result.error || JSON.stringify(result.body));

    if (result.ok && result.body?.expense?.id) {
      testData.createdExpenseId = result.body.expense.id;
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
  logTest('api', 'GET /api/owners', result.ok && result.body.owners,
    result.ok ? `Returned ${result.body.owners.length} owners` : result.error);
}

async function testInspectionsAPI() {
  console.log('\n=== INSPECTIONS API TESTS ===\n');

  // POST create inspection with damages
  if (testData.createdAssetId && testData.createdBookingId) {
    const newInspection = {
      asset_id: testData.createdAssetId,
      booking_id: testData.createdBookingId,
      inspection_type: 'post_rental',
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
      result.ok ? `Created inspection ID: ${result.body?.inspection?.id}` : result.error || JSON.stringify(result.body));

    if (result.ok && result.body?.inspection?.id) {
      testData.createdInspectionId = result.body.inspection.id;
    }
  }
}

async function testRemittancesAPI() {
  console.log('\n=== REMITTANCES API TESTS ===\n');

  // POST calculate remittance
  if (testData.sampleOwnerId) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

    const result = await apiRequest('POST', '/api/remittances/calculate', {
      owner_id: testData.sampleOwnerId,
      start_date: startDate,
      end_date: endDate
    });

    logTest('api', 'POST /api/remittances/calculate', result.ok,
      result.ok ? `Calculated remittance: $${result.body?.total_amount || 0}` : result.error || JSON.stringify(result.body));
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
    business_name: 'Test RV Business',
    street: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zip_code: '12345',
    preferred_payment_method: 'bank_transfer',

    // Asset info
    name: `Test Onboard RV ${timestamp}`,
    make: 'Test',
    model: 'Onboard RV',
    year: 2024,
    vin: 'ONBOARD' + timestamp,
    rv_type: 'Class B',
    length_feet: 32,
    sleeps: 8,
    bedrooms: 3,
    bathrooms: 1.5,
    base_price_per_night: 400,
    cleaning_fee: 75,
    security_deposit: 500,
    city: 'Test City',
    state: 'CA',
    description: 'Test RV from onboarding'
  };

  const result = await apiRequest('POST', '/api/onboard/owner', onboardData);
  logTest('api', 'POST /api/onboard/owner', result.ok,
    result.ok ? `Created owner and asset via onboarding` : result.error || JSON.stringify(result.body));
}

async function testDocumentsAPI() {
  console.log('\n=== DOCUMENTS API TESTS ===\n');

  // GET documents upload endpoint (should return 405 for GET)
  const result = await apiRequest('GET', '/api/documents/upload');
  logTest('api', 'GET /api/documents/upload', result.status === 405,
    'Endpoint exists (correctly returns 405 for GET, expects POST)');
}

async function testSyncAPI() {
  console.log('\n=== SYNC API TESTS ===\n');

  // GET bulk sync
  let result = await apiRequest('GET', '/api/sync/hubspot');
  logTest('api', 'GET /api/sync/hubspot (bulk sync)', result.ok || result.status === 200,
    result.ok ? 'Sync endpoint accessible' : 'Endpoint exists');

  // POST sync specific owner
  if (testData.sampleOwnerId) {
    result = await apiRequest('POST', '/api/sync/hubspot', {
      type: 'owner',
      id: testData.sampleOwnerId
    });
    logTest('api', 'POST /api/sync/hubspot (specific owner)', result.ok || result.status === 200,
      result.ok ? 'Synced owner to HubSpot' : 'Endpoint accessible');
  }
}

// ============================================================
// DATABASE INTEGRITY TESTS
// ============================================================

async function testDatabaseIntegrity() {
  console.log('\n=== DATABASE INTEGRITY TESTS ===\n');

  // Test foreign key relationships
  const bookingsResult = await apiRequest('GET', '/api/bookings');
  if (bookingsResult.ok && bookingsResult.body.bookings) {
    const bookings = bookingsResult.body.bookings;
    let orphanedCount = 0;

    // Test first 5 bookings for speed
    for (const booking of bookings.slice(0, 5)) {
      const assetCheck = await supabaseQuery(`assets?id=eq.${booking.asset_id}`, 'select');
      if (!assetCheck.ok || !Array.isArray(assetCheck.body) || assetCheck.body.length === 0) {
        orphanedCount++;
      }
    }

    logTest('integrity', 'No orphaned bookings (foreign key check)', orphanedCount === 0,
      orphanedCount > 0 ? `Found ${orphanedCount} orphaned bookings in sample` : 'All sampled bookings have valid assets');
  }

  // Test transaction creation for bookings
  if (testData.createdBookingId) {
    const transactionResult = await supabaseQuery(`transactions?booking_id=eq.${testData.createdBookingId}`, 'select');
    const hasTransaction = transactionResult.ok && Array.isArray(transactionResult.body) && transactionResult.body.length > 0;
    logTest('integrity', 'Booking creates transaction', hasTransaction,
      hasTransaction ? `Found ${transactionResult.body.length} transaction(s) for booking` : 'Transaction creation may be deferred or failed');
  }

  // Test expense approval creates transaction
  if (testData.createdExpenseId) {
    const transactionResult = await supabaseQuery(`transactions?expense_id=eq.${testData.createdExpenseId}`, 'select');
    const hasTransaction = transactionResult.ok && Array.isArray(transactionResult.body) && transactionResult.body.length > 0;
    logTest('integrity', 'Approved expense creates transaction', hasTransaction,
      hasTransaction ? `Found ${transactionResult.body.length} transaction(s) for expense` : 'Transaction creation may be deferred or failed');
  }

  // Test inspection creates damage report if damages found
  if (testData.createdInspectionId) {
    const damageResult = await supabaseQuery(`damage_reports?inspection_id=eq.${testData.createdInspectionId}`, 'select');
    const hasDamageReport = damageResult.ok && Array.isArray(damageResult.body) && damageResult.body.length > 0;
    logTest('integrity', 'Inspection with damages creates damage report', hasDamageReport,
      hasDamageReport ? `Found ${damageResult.body.length} damage report(s)` : 'Damage report creation may be deferred or failed');
  }
}

// ============================================================
// CRUD OPERATION TESTS
// ============================================================

async function testCRUDOperations() {
  console.log('\n=== CRUD OPERATION TESTS ===\n');

  // CREATE - Verify creations worked
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
      assetExists ? `Asset found with price: $${result.body[0].base_price_per_night}` : 'Asset not found in database');
  }

  // UPDATE - Verify updates persisted
  if (testData.createdAssetId) {
    const result = await supabaseQuery(`assets?id=eq.${testData.createdAssetId}`, 'select');
    if (result.ok && Array.isArray(result.body) && result.body.length > 0) {
      const updated = result.body[0].base_price_per_night === 350 && result.body[0].status === 'maintenance';
      logTest('crud', 'UPDATE asset verified in database', updated,
        updated ? 'Asset updates persisted correctly' : `Price: ${result.body[0].base_price_per_night}, Status: ${result.body[0].status}`);
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
      const bar = '█'.repeat(Math.floor(passed / total * 20)) + '░'.repeat(20 - Math.floor(passed / total * 20));
      console.log(`${category.toUpperCase().padEnd(12)} ${bar} ${passed}/${total} (${percentage}%)`);
    }

    const totalPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
    const totalBar = '█'.repeat(Math.floor(totalPassed / totalTests * 20)) + '░'.repeat(20 - Math.floor(totalPassed / totalTests * 20));
    console.log(`\n${'TOTAL'.padEnd(12)} ${totalBar} ${totalPassed}/${totalTests} (${totalPercentage}%)`);

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
    } else {
      console.log('\n🎉 ALL TESTS PASSED! 🎉');
    }

    // Save detailed report
    const report = {
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalTests - totalPassed,
        percentage: totalPercentage
      },
      results: testResults,
      testData: testData,
      timestamp: new Date().toISOString()
    };

    console.log('\n✅ Test suite completed!');
    console.log(`📊 Full report saved to: test-results.json`);

    // Write results to file
    const fs = require('fs');
    fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));

    // Return success/failure code
    process.exit(failedTests.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch(console.error);
