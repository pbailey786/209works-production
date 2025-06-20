#!/usr/bin/env node

/**
 * Post-Deployment Monitoring Script
 * Continuous monitoring after 209 Works go-live
 */

const https = require('https');
const fs = require('fs').promises;

// Configuration
const PRODUCTION_URL = 'https://209.works';
const MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOG_FILE = 'deployment-monitoring.log';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${color}${logMessage}${colors.reset}`);
  
  // Also write to log file
  fs.appendFile(LOG_FILE, logMessage + '\n').catch(console.error);
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
    const req = https.request(url, {
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Health check monitoring
async function checkSystemHealth() {
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      
      success(`System health: ${healthData.status} (${response.responseTime}ms)`);
      
      // Check individual components
      if (healthData.checks) {
        const { database, redis, memory, external_apis } = healthData.checks;
        
        if (database.status !== 'healthy') {
          error(`Database unhealthy: ${database.error || 'Unknown error'}`);
        }
        
        if (memory.status !== 'healthy') {
          warning(`Memory usage high: ${memory.usage}MB / ${memory.limit}MB`);
        }
        
        if (external_apis.status === 'degraded') {
          warning('Some external APIs are degraded');
        }
      }
      
      return true;
    } else {
      error(`Health check failed with status ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`Health check error: ${err.message}`);
    return false;
  }
}

// Performance monitoring
async function checkPerformance() {
  const endpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/api/jobs', name: 'Jobs API' },
    { path: '/api/auth/session', name: 'Auth API' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint.path}`);
      
      if (response.statusCode < 400) {
        if (response.responseTime < 2000) {
          success(`${endpoint.name}: ${response.responseTime}ms`);
        } else if (response.responseTime < 5000) {
          warning(`${endpoint.name}: ${response.responseTime}ms (slow)`);
        } else {
          error(`${endpoint.name}: ${response.responseTime}ms (very slow)`);
        }
        results.push({ ...endpoint, responseTime: response.responseTime, success: true });
      } else {
        error(`${endpoint.name}: HTTP ${response.statusCode}`);
        results.push({ ...endpoint, responseTime: response.responseTime, success: false });
      }
    } catch (err) {
      error(`${endpoint.name}: ${err.message}`);
      results.push({ ...endpoint, success: false, error: err.message });
    }
  }
  
  return results;
}

// User flow testing
async function testUserFlows() {
  const flows = [
    { path: '/sign-up', name: 'Sign Up Page' },
    { path: '/sign-in', name: 'Sign In Page' },
    { path: '/jobs', name: 'Job Listings' },
    { path: '/employers', name: 'Employer Portal' }
  ];
  
  let successCount = 0;
  
  for (const flow of flows) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${flow.path}`, {
        method: 'HEAD'
      });
      
      if (response.statusCode < 400) {
        success(`${flow.name}: Accessible`);
        successCount++;
      } else {
        error(`${flow.name}: HTTP ${response.statusCode}`);
      }
    } catch (err) {
      error(`${flow.name}: ${err.message}`);
    }
  }
  
  return successCount / flows.length;
}

// Error rate monitoring
async function checkErrorRates() {
  try {
    // This would typically integrate with your error tracking service
    // For now, we'll check if the error page is accessible
    const response = await makeRequest(`${PRODUCTION_URL}/api/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      
      // Check if there are any error indicators in the health data
      if (healthData.status === 'unhealthy') {
        error('System reporting unhealthy status');
        return false;
      } else if (healthData.status === 'degraded') {
        warning('System reporting degraded status');
        return true;
      } else {
        success('No error indicators detected');
        return true;
      }
    }
  } catch (err) {
    error(`Error rate check failed: ${err.message}`);
    return false;
  }
}

// Generate monitoring report
function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  log('\n' + '='.repeat(60), colors.bold);
  log('📊 MONITORING REPORT', colors.bold);
  log('='.repeat(60), colors.bold);
  log(`Timestamp: ${timestamp}`);
  log(`Production URL: ${PRODUCTION_URL}`);
  
  // Overall status
  const overallHealth = results.health ? '🟢 Healthy' : '🔴 Unhealthy';
  const avgResponseTime = results.performance.length > 0 
    ? Math.round(results.performance.reduce((sum, p) => sum + (p.responseTime || 0), 0) / results.performance.length)
    : 'N/A';
  
  log(`\nOverall Status: ${overallHealth}`);
  log(`Average Response Time: ${avgResponseTime}ms`);
  log(`User Flow Success Rate: ${Math.round(results.userFlowSuccess * 100)}%`);
  log(`Error Rate Status: ${results.errorRate ? '🟢 Normal' : '🔴 Elevated'}`);
  
  // Performance details
  log('\n📈 Performance Details:');
  results.performance.forEach(perf => {
    const status = perf.success ? '✅' : '❌';
    const time = perf.responseTime ? `${perf.responseTime}ms` : 'Failed';
    log(`  ${status} ${perf.name}: ${time}`);
  });
  
  log('\n' + '='.repeat(60), colors.bold);
}

// Main monitoring function
async function runMonitoring() {
  info('🔍 Starting monitoring cycle...');
  
  const results = {
    timestamp: new Date().toISOString(),
    health: false,
    performance: [],
    userFlowSuccess: 0,
    errorRate: false
  };
  
  try {
    // Run all checks
    results.health = await checkSystemHealth();
    results.performance = await checkPerformance();
    results.userFlowSuccess = await testUserFlows();
    results.errorRate = await checkErrorRates();
    
    // Generate report
    generateReport(results);
    
    // Check for critical issues
    if (!results.health || results.userFlowSuccess < 0.5 || !results.errorRate) {
      error('🚨 CRITICAL ISSUES DETECTED - Manual intervention may be required');
    } else if (results.userFlowSuccess < 0.8) {
      warning('⚠️  Some issues detected - monitoring closely');
    } else {
      success('✅ All systems operating normally');
    }
    
  } catch (err) {
    error(`Monitoring cycle failed: ${err.message}`);
  }
  
  info('✅ Monitoring cycle complete\n');
}

// Continuous monitoring
async function startContinuousMonitoring() {
  log('🚀 Starting 209 Works Post-Deployment Monitoring', colors.bold);
  log(`Monitoring URL: ${PRODUCTION_URL}`);
  log(`Check interval: ${MONITORING_INTERVAL / 1000 / 60} minutes`);
  log(`Log file: ${LOG_FILE}\n`);
  
  // Initial check
  await runMonitoring();
  
  // Set up continuous monitoring
  setInterval(async () => {
    await runMonitoring();
  }, MONITORING_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Monitoring stopped by user', colors.yellow);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('\n🛑 Monitoring terminated', colors.yellow);
    process.exit(0);
  });
}

// Single check mode
async function runSingleCheck() {
  log('🔍 Running single monitoring check...', colors.bold);
  await runMonitoring();
  process.exit(0);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--once') || args.includes('-o')) {
    runSingleCheck();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
209 Works Post-Deployment Monitoring

Usage:
  node post-deployment-monitor.js          # Start continuous monitoring
  node post-deployment-monitor.js --once   # Run single check
  node post-deployment-monitor.js --help   # Show this help

Options:
  --once, -o    Run a single monitoring check and exit
  --help, -h    Show this help message

The script will monitor:
  - System health and uptime
  - API response times
  - User flow accessibility
  - Error rates and issues

Logs are written to: ${LOG_FILE}
    `);
    process.exit(0);
  } else {
    startContinuousMonitoring();
  }
}

module.exports = { runMonitoring, checkSystemHealth, checkPerformance };
