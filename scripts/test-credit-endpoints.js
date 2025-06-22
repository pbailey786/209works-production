#!/usr/bin/env node

/**
 * Health check script for credit management endpoints
 * Run this after deployment to verify all endpoints are working
 */

const BASE_URL = process.env.BASE_URL || 'https://209.works';

const endpoints = [
  {
    name: 'Admin Credits Page',
    url: `${BASE_URL}/admin/credits`,
    method: 'GET',
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    name: 'Credit History API',
    url: `${BASE_URL}/api/credits/history`,
    method: 'GET',
    requiresAuth: true,
    requiresEmployer: true,
  },
  {
    name: 'Admin Credit Assignment API',
    url: `${BASE_URL}/api/admin/credits/assign`,
    method: 'GET',
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    name: 'Job Upsell Checkout API',
    url: `${BASE_URL}/api/job-posting/upsell-checkout`,
    method: 'POST',
    requiresAuth: true,
    requiresEmployer: true,
    testData: {
      jobId: 'test-job-id',
      upsells: {
        socialMediaShoutout: false,
        placementBump: false,
        upsellBundle: false,
        total: 0,
      },
      successUrl: `${BASE_URL}/employers/my-jobs`,
      cancelUrl: `${BASE_URL}/employers/my-jobs`,
    },
  },
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`📍 URL: ${endpoint.url}`);

  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Credit-System-Health-Check/1.0',
      },
    };

    if (endpoint.testData) {
      options.body = JSON.stringify(endpoint.testData);
    }

    const response = await fetch(endpoint.url, options);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (endpoint.requiresAuth && response.status === 401) {
      console.log(`✅ Expected 401 (requires authentication)`);
      return { success: true, expected: true };
    }

    if (endpoint.requiresAdmin && response.status === 403) {
      console.log(`✅ Expected 403 (requires admin access)`);
      return { success: true, expected: true };
    }

    if (endpoint.requiresEmployer && response.status === 403) {
      console.log(`✅ Expected 403 (requires employer access)`);
      return { success: true, expected: true };
    }

    if (response.ok) {
      console.log(`✅ Endpoint is responding correctly`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runHealthCheck() {
  console.log(`🏥 Credit Management System Health Check`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📋 Summary:`);
  console.log(`=`.repeat(50));

  let successCount = 0;
  let expectedCount = 0;

  results.forEach(result => {
    const status = result.success
      ? result.expected
        ? '🟡 EXPECTED'
        : '✅ SUCCESS'
      : '❌ FAILED';
    console.log(`${status} ${result.endpoint}`);

    if (result.success) {
      if (result.expected) {
        expectedCount++;
      } else {
        successCount++;
      }
    }
  });

  console.log(`\n📊 Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`🟡 Expected (auth required): ${expectedCount}`);
  console.log(`❌ Failed: ${results.length - successCount - expectedCount}`);

  if (results.every(r => r.success)) {
    console.log(`\n🎉 All endpoints are healthy!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some endpoints need attention.`);
    process.exit(1);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error(`💥 Health check failed:`, error);
  process.exit(1);
});
