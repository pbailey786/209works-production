// Quick endpoint testing script
// Run with: node test-endpoints.js

const BASE_URL = 'https://209.works';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const status = response.status;
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }
    
    console.log(`${method} ${endpoint}: ${status}`);
    if (status >= 400) {
      console.log(`  Error: ${JSON.stringify(responseData)}`);
    }
    
    return { status, data: responseData };
  } catch (error) {
    console.log(`${method} ${endpoint}: ERROR - ${error.message}`);
    return { status: 'ERROR', error: error.message };
  }
}

async function testWorkflows() {
  console.log('🧪 Testing Key API Endpoints\n');
  
  // Test public endpoints (should work without auth)
  console.log('📋 Public Endpoints:');
  await testEndpoint('/api/jobs?limit=1');
  await testEndpoint('/api/jobs/search?q=warehouse&limit=1');
  
  console.log('\n🔒 Auth-Required Endpoints (expect 401 without auth):');
  await testEndpoint('/api/dashboard/stats');
  await testEndpoint('/api/profile');
  await testEndpoint('/api/jobs/save');
  await testEndpoint('/api/profile/saved-jobs');
  await testEndpoint('/api/profile/applications');
  
  console.log('\n🤖 AI Endpoints:');
  await testEndpoint('/api/chat-job-search', 'POST', {
    userMessage: 'Find jobs in Stockton',
    conversationHistory: []
  });
  
  console.log('\n✅ Testing Complete');
  console.log('\nNext: Test with actual authentication by visiting the site and checking browser console');
}

testWorkflows();