#!/usr/bin/env node

/**
 * Domain Verification Script for 209 Works
 * Tests domain configuration, SSL, and regional content delivery
 */

const https = require('https');
const dns = require('dns').promises;

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

// Domain configurations
const DOMAINS = {
  production: '209.works',
  regional: ['916.works', '510.works', '925.works', '559.works'],
};

// Expected regional content markers
const REGIONAL_MARKERS = {
  '209.works': {
    title: '209 Works',
    region: 'Central Valley',
    cities: ['Stockton', 'Modesto', 'Tracy'],
  },
  '916.works': {
    title: '916 Jobs',
    region: 'Sacramento Metro',
    cities: ['Sacramento', 'Elk Grove', 'Roseville'],
  },
  '510.works': {
    title: '510 Jobs',
    region: 'East Bay',
    cities: ['Oakland', 'Berkeley', 'Fremont'],
  },
  '925.works': {
    title: '925 Works',
    region: 'East Bay & Tri-Valley',
    cities: ['Concord', 'Walnut Creek', 'Pleasanton'],
  },
  '559.works': {
    title: '559 Jobs',
    region: 'Fresno',
    cities: ['Fresno', 'Visalia', 'Clovis'],
  },
};

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        timeout: 10000,
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

// DNS resolution test
async function testDNS(domain) {
  info(`Testing DNS resolution for ${domain}...`);

  try {
    // Test A record
    const aRecords = await dns.resolve4(domain);
    success(`${domain} A records: ${aRecords.join(', ')}`);

    // Test CNAME for www
    try {
      const cnameRecords = await dns.resolveCname(`www.${domain}`);
      success(`www.${domain} CNAME: ${cnameRecords.join(', ')}`);
    } catch (err) {
      warning(`www.${domain} CNAME not found (optional)`);
    }

    return true;
  } catch (err) {
    error(`DNS resolution failed for ${domain}: ${err.message}`);
    return false;
  }
}

// SSL certificate test
async function testSSL(domain) {
  info(`Testing SSL certificate for ${domain}...`);

  try {
    const response = await makeRequest(`https://${domain}`, {
      method: 'HEAD',
    });

    if (response.statusCode < 400) {
      success(`${domain} SSL certificate valid`);

      // Check HSTS header
      if (response.headers['strict-transport-security']) {
        success(`${domain} HSTS enabled`);
      } else {
        warning(`${domain} HSTS not enabled`);
      }

      return true;
    } else {
      error(`${domain} SSL test failed with status ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`${domain} SSL test failed: ${err.message}`);
    return false;
  }
}

// Regional content test
async function testRegionalContent(domain) {
  info(`Testing regional content for ${domain}...`);

  try {
    const response = await makeRequest(`https://${domain}`);

    if (response.statusCode !== 200) {
      error(`${domain} returned status ${response.statusCode}`);
      return false;
    }

    const content = response.data;
    const expected = REGIONAL_MARKERS[domain];

    if (!expected) {
      warning(`${domain} not configured in regional markers`);
      return false;
    }

    let passed = 0;
    let total = 0;

    // Check title
    total++;
    if (content.includes(expected.title)) {
      success(`${domain} title found: ${expected.title}`);
      passed++;
    } else {
      error(`${domain} title not found: ${expected.title}`);
    }

    // Check region
    total++;
    if (content.includes(expected.region)) {
      success(`${domain} region found: ${expected.region}`);
      passed++;
    } else {
      error(`${domain} region not found: ${expected.region}`);
    }

    // Check cities
    let citiesFound = 0;
    for (const city of expected.cities) {
      if (content.includes(city)) {
        citiesFound++;
      }
    }

    total++;
    if (citiesFound > 0) {
      success(
        `${domain} cities found: ${citiesFound}/${expected.cities.length}`
      );
      passed++;
    } else {
      error(`${domain} no expected cities found`);
    }

    return passed >= total * 0.66; // 66% pass rate
  } catch (err) {
    error(`${domain} content test failed: ${err.message}`);
    return false;
  }
}

// Performance test
async function testPerformance(domain) {
  info(`Testing performance for ${domain}...`);

  try {
    const startTime = Date.now();
    const response = await makeRequest(`https://${domain}`);
    const responseTime = Date.now() - startTime;

    if (responseTime < 2000) {
      success(`${domain} response time: ${responseTime}ms (Excellent)`);
      return true;
    } else if (responseTime < 4000) {
      warning(`${domain} response time: ${responseTime}ms (Good)`);
      return true;
    } else {
      error(`${domain} response time: ${responseTime}ms (Slow)`);
      return false;
    }
  } catch (err) {
    error(`${domain} performance test failed: ${err.message}`);
    return false;
  }
}

// Test domain redirects
async function testRedirects(domain) {
  info(`Testing redirects for ${domain}...`);

  const redirectTests = [
    `http://${domain}`, // HTTP to HTTPS
    `https://www.${domain}`, // WWW to non-WWW
  ];

  let passed = 0;

  for (const testUrl of redirectTests) {
    try {
      const response = await makeRequest(testUrl, {
        method: 'HEAD',
      });

      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        if (location && location.includes(`https://${domain}`)) {
          success(`${testUrl} redirects correctly to ${location}`);
          passed++;
        } else {
          warning(`${testUrl} redirects to unexpected location: ${location}`);
        }
      } else if (response.statusCode === 200) {
        success(`${testUrl} serves content directly`);
        passed++;
      } else {
        warning(`${testUrl} returned status ${response.statusCode}`);
      }
    } catch (err) {
      warning(`${testUrl} redirect test failed: ${err.message}`);
    }
  }

  return passed > 0;
}

// Main verification function
async function verifyDomain(domain) {
  log(`\n${colors.bold}🔍 Verifying ${domain}${colors.reset}`);
  log('='.repeat(50));

  const tests = [
    { name: 'DNS Resolution', fn: () => testDNS(domain) },
    { name: 'SSL Certificate', fn: () => testSSL(domain) },
    { name: 'Regional Content', fn: () => testRegionalContent(domain) },
    { name: 'Performance', fn: () => testPerformance(domain) },
    { name: 'Redirects', fn: () => testRedirects(domain) },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (err) {
      error(`${test.name} test crashed: ${err.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary for this domain
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  log(`\n${colors.bold}📊 ${domain} Summary${colors.reset}`);
  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}: PASSED`);
    } else {
      error(`${result.name}: FAILED`);
    }
  });

  const score = (passed / total) * 100;
  if (score >= 80) {
    success(`${domain}: ${score.toFixed(0)}% (Ready for production)`);
  } else if (score >= 60) {
    warning(`${domain}: ${score.toFixed(0)}% (Needs attention)`);
  } else {
    error(`${domain}: ${score.toFixed(0)}% (Not ready)`);
  }

  return { domain, passed, total, score };
}

// Main function
async function runDomainVerification() {
  log(`${colors.bold}🌐 209 Works Domain Verification${colors.reset}\n`);

  const allResults = [];

  // Test production domain first
  info('Testing production domain...');
  const prodResult = await verifyDomain(DOMAINS.production);
  allResults.push(prodResult);

  // Test regional domains
  info('\nTesting regional domains...');
  for (const domain of DOMAINS.regional) {
    const result = await verifyDomain(domain);
    allResults.push(result);
  }

  // Overall summary
  log(`\n${colors.bold}🎯 Overall Domain Status${colors.reset}`);
  log('='.repeat(60));

  allResults.forEach(result => {
    const status = result.score >= 80 ? '🟢' : result.score >= 60 ? '🟡' : '🔴';
    log(
      `${status} ${result.domain}: ${result.passed}/${result.total} tests passed (${result.score.toFixed(0)}%)`
    );
  });

  const avgScore =
    allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;
  log(`\n${colors.bold}Average Score: ${avgScore.toFixed(0)}%${colors.reset}`);

  if (avgScore >= 80) {
    success('🚀 Domain infrastructure ready for production!');
  } else if (avgScore >= 60) {
    warning('🔧 Some domains need configuration before full launch');
  } else {
    error('🛑 Multiple domains need setup before launch');
  }
}

// Run verification if called directly
if (require.main === module) {
  runDomainVerification().catch(err => {
    error(`Domain verification crashed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runDomainVerification, verifyDomain };
