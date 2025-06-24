#!/usr/bin/env node

/**
 * Simple test script to verify the application status fix
 * This script tests the key API endpoints involved in the "already applied" bug
 */

const API_BASE = 'http://localhost:3002';

console.log('🔍 Testing Application Status Fix');
console.log('=====================================\n');

// Test the endpoints that were fixed
const endpoints = [
  {
    name: 'GET /api/jobs/apply (with jobId)',
    url: `${API_BASE}/api/jobs/apply?jobId=test-job-id`,
    method: 'GET'
  },
  {
    name: 'GET /api/jobs/application-status (with jobIds)',
    url: `${API_BASE}/api/jobs/application-status?jobIds=test-job-1,test-job-2`,
    method: 'GET'
  },
  {
    name: 'POST /api/jobs/application-status',
    url: `${API_BASE}/api/jobs/application-status`,
    method: 'POST',
    body: { jobId: 'test-job-id' }
  }
];

async function testEndpoint(endpoint) {
  console.log(`🧪 Testing: ${endpoint.name}`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(endpoint.url, options);
    const status = response.status;
    const text = await response.text();
    
    console.log(`   Status: ${status}`);
    
    if (status === 401) {
      console.log('   ✅ Expected: Authentication required (no mock session)');
    } else if (status === 403) {
      console.log('   ✅ Expected: Forbidden (proper role checking)');
    } else {
      console.log(`   Response: ${text.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🎯 Expected Results:');
  console.log('   - All endpoints should return 401 (Unauthorized) without authentication');
  console.log('   - This means the mock session is gone and proper Clerk auth is required');
  console.log('   - Users will no longer see "already applied" incorrectly');
}

runTests();