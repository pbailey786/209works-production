#!/usr/bin/env node

/**
 * Phase 1 Core Pages Test Script
 * 
 * Tests each core page to identify issues before we proceed
 */

const http = require('http');

console.log('🧪 Phase 1 Core Pages Test');
console.log('========================================');

const corePages = [
  { path: '/', name: 'Homepage' },
  { path: '/jobs', name: 'Job Search' },
  { path: '/employers', name: 'Employer Landing' },
  { path: '/contact', name: 'Contact Page' },
  { path: '/admin', name: 'Admin (should be disabled)' },
];

const BASE_URL = 'http://localhost:3001';

async function testPage(page) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${page.path}`;
    
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === 200;
        const hasContent = data.length > 1000; // Basic content check
        const hasError = data.includes('Error') || data.includes('500') || data.includes('404');
        
        resolve({
          success,
          statusCode: res.statusCode,
          hasContent,
          hasError,
          contentLength: data.length,
          title: data.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title found'
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        statusCode: 'ERROR'
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        statusCode: 'TIMEOUT'
      });
    });
  });
}

async function runTests() {
  console.log(`Testing server at: ${BASE_URL}`);
  console.log('');
  
  let allPassed = true;
  
  for (const page of corePages) {
    process.stdout.write(`Testing ${page.name.padEnd(25)} (${page.path})... `);
    
    const result = await testPage(page);
    
    if (result.success && !result.hasError) {
      console.log(`✅ PASS (${result.statusCode}) - ${result.title}`);
    } else if (result.success && result.hasError) {
      console.log(`⚠️  WARN (${result.statusCode}) - Has errors in content`);
      allPassed = false;
    } else {
      console.log(`❌ FAIL (${result.statusCode}) - ${result.error || 'Unknown error'}`);
      allPassed = false;
    }
  }
  
  console.log('\n========================================');
  
  if (allPassed) {
    console.log('🎉 All core pages are working!');
    console.log('✅ Ready to proceed to Step 3: Apply feature flags to remaining pages');
  } else {
    console.log('⚠️  Some core pages have issues.');
    console.log('🔧 Fix these pages before proceeding to ensure a stable baseline.');
  }
  
  console.log('\n🌐 Manual testing:');
  corePages.forEach(page => {
    console.log(`   ${BASE_URL}${page.path} - ${page.name}`);
  });
}

// Check if server is running first
console.log('🔍 Checking if dev server is running...');
const healthCheck = http.get(`${BASE_URL}/`, { timeout: 5000 }, (res) => {
  console.log('✅ Dev server is responding');
  runTests();
});

healthCheck.on('error', () => {
  console.log('❌ Dev server not running on port 3001');
  console.log('💡 Start with: npm run dev');
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.log('❌ Dev server not responding (timeout)');
  console.log('💡 Check if server is still starting up');
  process.exit(1);
});