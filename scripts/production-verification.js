#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Verifies that all critical systems are working in production
 */

const https = require('https');
const { execSync } = require('child_process');

const PRODUCTION_URL = 'https://209.works';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        timeout: TIMEOUT,
        ...options,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: Date.now() - startTime,
          });
        });
      }
    );

    const startTime = Date.now();
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Test functions
async function testHomepage() {
  info('Testing homepage...');
  try {
    const response = await makeRequest(PRODUCTION_URL);

    if (response.statusCode === 200) {
      success(`Homepage loaded successfully (${response.responseTime}ms)`);

      // Check for critical elements
      if (response.data.includes('209 Works')) {
        success('Page title found');
      } else {
        warning('Page title not found in response');
      }

      return true;
    } else {
      error(`Homepage returned status ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`Homepage test failed: ${err.message}`);
    return false;
  }
}

async function testAPI() {
  info('Testing API endpoints...');
  const endpoints = ['/api/health', '/api/jobs', '/api/auth/session'];

  let passed = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);

      if (response.statusCode < 500) {
        success(
          `${endpoint} responded (${response.statusCode}, ${response.responseTime}ms)`
        );
        passed++;
      } else {
        error(`${endpoint} returned ${response.statusCode}`);
      }
    } catch (err) {
      error(`${endpoint} failed: ${err.message}`);
    }
  }

  return passed === endpoints.length;
}

async function testSecurityHeaders() {
  info('Testing security headers...');
  try {
    const response = await makeRequest(PRODUCTION_URL);
    const headers = response.headers;

    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
    ];

    let passed = 0;

    for (const header of securityHeaders) {
      if (headers[header]) {
        success(`${header}: ${headers[header]}`);
        passed++;
      } else {
        warning(`Missing security header: ${header}`);
      }
    }

    return passed >= securityHeaders.length * 0.75; // 75% pass rate
  } catch (err) {
    error(`Security headers test failed: ${err.message}`);
    return false;
  }
}

async function testSSL() {
  info('Testing SSL certificate...');
  try {
    const response = await makeRequest(PRODUCTION_URL);

    if (response.headers['strict-transport-security']) {
      success('HTTPS enforced with HSTS');
      return true;
    } else {
      warning('HSTS header not found');
      return false;
    }
  } catch (err) {
    error(`SSL test failed: ${err.message}`);
    return false;
  }
}

async function testPerformance() {
  info('Testing performance...');
  try {
    const startTime = Date.now();
    const response = await makeRequest(PRODUCTION_URL);
    const responseTime = Date.now() - startTime;

    if (responseTime < 3000) {
      success(`Page load time: ${responseTime}ms (Good)`);
      return true;
    } else if (responseTime < 5000) {
      warning(`Page load time: ${responseTime}ms (Acceptable)`);
      return true;
    } else {
      error(`Page load time: ${responseTime}ms (Too slow)`);
      return false;
    }
  } catch (err) {
    error(`Performance test failed: ${err.message}`);
    return false;
  }
}

async function testDomainRedirects() {
  info('Testing domain redirects...');
  const domains = [
    'www.209.works',
    '916.works',
    '510.works',
    '925.works',
    '559.works',
  ];

  let passed = 0;

  for (const domain of domains) {
    try {
      const response = await makeRequest(`https://${domain}`, {
        method: 'HEAD',
      });

      if (
        response.statusCode === 301 ||
        response.statusCode === 302 ||
        response.statusCode === 200
      ) {
        success(`${domain} redirect working`);
        passed++;
      } else {
        warning(`${domain} returned ${response.statusCode}`);
      }
    } catch (err) {
      warning(`${domain} test failed: ${err.message}`);
    }
  }

  return passed >= 1; // At least main domain should work
}

async function testEnvironmentVariables() {
  info('Testing environment variables...');

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_APP_URL',
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
  ];

  let passed = 0;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      success(`${envVar} is set`);
      passed++;
    } else {
      error(`${envVar} is missing`);
    }
  }

  return passed === requiredEnvVars.length;
}

// Main verification function
async function runVerification() {
  log(`${colors.bold}🚀 209 Works Production Verification${colors.reset}`);
  log(
    `${colors.blue}Testing production deployment at ${PRODUCTION_URL}${colors.reset}\n`
  );

  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Homepage', fn: testHomepage },
    { name: 'API Endpoints', fn: testAPI },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'SSL Certificate', fn: testSSL },
    { name: 'Performance', fn: testPerformance },
    { name: 'Domain Redirects', fn: testDomainRedirects },
  ];

  const results = [];

  for (const test of tests) {
    log(`\n${colors.bold}Testing ${test.name}...${colors.reset}`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (err) {
      error(`${test.name} test crashed: ${err.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  log(`\n${colors.bold}📊 Verification Summary${colors.reset}`);
  log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}: PASSED`);
    } else {
      error(`${result.name}: FAILED`);
    }
  });

  log('\n' + '='.repeat(50));

  if (passed === total) {
    success(`🎉 All tests passed! (${passed}/${total})`);
    success('🚀 Production deployment is ready!');
    process.exit(0);
  } else if (passed >= total * 0.8) {
    warning(`⚠️  Most tests passed (${passed}/${total})`);
    warning('🔧 Some issues need attention before full launch');
    process.exit(1);
  } else {
    error(`❌ Multiple tests failed (${passed}/${total})`);
    error('🛑 Production deployment needs fixes');
    process.exit(2);
  }
}

// Run verification if called directly
if (require.main === module) {
  runVerification().catch(err => {
    error(`Verification crashed: ${err.message}`);
    process.exit(3);
  });
}

module.exports = { runVerification };
