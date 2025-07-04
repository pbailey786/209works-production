// Test script to diagnose API issues
const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  // Test 1: Basic health check
  console.log('1. Testing basic API health...');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 2: Chat API without auth
  console.log('\n2. Testing /api/chat-job-search without auth...');
  try {
    const chatResponse = await fetch('http://localhost:3000/api/chat-job-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: 'show me warehouse jobs',
        conversationHistory: [],
        userProfile: null,
        sessionId: 'test-session'
      })
    });
    console.log(`   Status: ${chatResponse.status}`);
    const data = await chatResponse.json();
    console.log('   Response:', data);
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 3: Jobs search API
  console.log('\n3. Testing /api/jobs/search...');
  try {
    const jobsResponse = await fetch('http://localhost:3000/api/jobs/search?q=warehouse');
    console.log(`   Status: ${jobsResponse.status}`);
    const data = await jobsResponse.json();
    console.log('   Response:', data);
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 4: Check if database is accessible
  console.log('\n4. Testing database connection...');
  try {
    const dbTestResponse = await fetch('http://localhost:3000/api/test-db');
    console.log(`   Status: ${dbTestResponse.status}`);
    if (dbTestResponse.ok) {
      const data = await dbTestResponse.json();
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...');
  console.log('Run: npm install node-fetch@2');
  console.log('Then run this script again.');
} else {
  testEndpoints();
}