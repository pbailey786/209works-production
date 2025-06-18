#!/usr/bin/env node

/**
 * Debug script to test authentication flow
 * Run with: node debug-auth.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const isDev = BASE_URL.includes('localhost');

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Debug-Auth-Test/1.0',
        ...options.headers
      },
      ...options
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow');
  console.log('Base URL:', BASE_URL);
  console.log('');

  try {
    // Test 1: Check if auth API is accessible
    console.log('1. Testing NextAuth API...');
    const authTest = await makeRequest('/api/auth/providers');
    console.log(`   Status: ${authTest.status}`);
    if (authTest.status === 200) {
      const providers = JSON.parse(authTest.body);
      console.log(`   Providers: ${Object.keys(providers).join(', ')}`);
    }
    console.log('');

    // Test 2: Check session endpoint
    console.log('2. Testing session endpoint...');
    const sessionTest = await makeRequest('/api/auth/session');
    console.log(`   Status: ${sessionTest.status}`);
    if (sessionTest.status === 200) {
      const session = JSON.parse(sessionTest.body);
      console.log(`   Session: ${session ? 'Present' : 'Null'}`);
    }
    console.log('');

    // Test 3: Test employer signin page
    console.log('3. Testing employer signin page...');
    const employerSignin = await makeRequest('/employers/signin');
    console.log(`   Status: ${employerSignin.status}`);
    console.log('');

    // Test 4: Test job posting page (should redirect if not authenticated)
    console.log('4. Testing job posting page...');
    const jobPost = await makeRequest('/employers/create-job-post');
    console.log(`   Status: ${jobPost.status}`);
    if (jobPost.headers.location) {
      console.log(`   Redirect: ${jobPost.headers.location}`);
    }
    console.log('');

    // Test 5: Test middleware protection
    console.log('5. Testing middleware protection...');
    const employerDashboard = await makeRequest('/employers/dashboard');
    console.log(`   Status: ${employerDashboard.status}`);
    if (employerDashboard.headers.location) {
      console.log(`   Redirect: ${employerDashboard.headers.location}`);
    }
    console.log('');

    console.log('✅ Auth flow test completed');

  } catch (error) {
    console.error('❌ Error testing auth flow:', error.message);
  }
}

// Run the test
testAuthFlow().catch(console.error);