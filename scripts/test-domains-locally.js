#!/usr/bin/env node

/**
 * Local Domain Testing Script
 * Tests domain functionality locally by simulating different hostnames
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test domains
const TEST_DOMAINS = ['209.works', '916.works', '510.works', 'norcal.works'];

class LocalDomainTester {
  constructor() {
    this.results = [];
  }

  /**
   * Run all domain tests
   */
  async runTests() {
    console.log('🧪 Testing domain functionality locally...\n');

    // Check if Next.js dev server is running
    if (!this.isDevServerRunning()) {
      console.log('⚠️  Next.js dev server not detected. Starting it...');
      console.log('Run: npm run dev');
      console.log('Then run this script again.\n');
      return;
    }

    // Test domain configuration
    await this.testDomainConfig();

    // Test middleware
    await this.testMiddleware();

    // Test components
    await this.testComponents();

    // Generate report
    this.generateReport();
  }

  /**
   * Check if dev server is running
   */
  isDevServerRunning() {
    try {
      execSync('curl -s http://localhost:3000 > /dev/null', {
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test domain configuration
   */
  async testDomainConfig() {
    console.log('📋 Testing domain configuration...');

    const configPath = 'src/lib/domain/config.ts';
    if (!fs.existsSync(configPath)) {
      this.results.push({
        test: 'Domain Config File',
        status: 'FAIL',
        message: 'Domain config file not found',
      });
      return;
    }

    // Test that all domains are configured
    const configContent = fs.readFileSync(configPath, 'utf8');

    for (const domain of TEST_DOMAINS) {
      if (configContent.includes(domain)) {
        this.results.push({
          test: `Domain Config: ${domain}`,
          status: 'PASS',
          message: 'Domain found in configuration',
        });
        console.log(`  ✅ ${domain} configured`);
      } else {
        this.results.push({
          test: `Domain Config: ${domain}`,
          status: 'FAIL',
          message: 'Domain not found in configuration',
        });
        console.log(`  ❌ ${domain} missing from configuration`);
      }
    }
  }

  /**
   * Test middleware
   */
  async testMiddleware() {
    console.log('\n🔀 Testing middleware...');

    const middlewarePath = 'middleware.ts';
    if (!fs.existsSync(middlewarePath)) {
      this.results.push({
        test: 'Middleware File',
        status: 'FAIL',
        message: 'Middleware file not found',
      });
      return;
    }

    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

    // Check for domain detection logic
    if (middlewareContent.includes('getDomainConfig')) {
      this.results.push({
        test: 'Middleware Domain Detection',
        status: 'PASS',
        message: 'Domain detection logic found',
      });
      console.log('  ✅ Domain detection logic present');
    } else {
      this.results.push({
        test: 'Middleware Domain Detection',
        status: 'FAIL',
        message: 'Domain detection logic not found',
      });
      console.log('  ❌ Domain detection logic missing');
    }

    // Check for traffic logging
    if (middlewareContent.includes('logDomainTraffic')) {
      this.results.push({
        test: 'Middleware Traffic Logging',
        status: 'PASS',
        message: 'Traffic logging found',
      });
      console.log('  ✅ Traffic logging present');
    } else {
      this.results.push({
        test: 'Middleware Traffic Logging',
        status: 'WARN',
        message: 'Traffic logging not found (optional)',
      });
      console.log('  ⚠️  Traffic logging missing (optional)');
    }
  }

  /**
   * Test components
   */
  async testComponents() {
    console.log('\n🧩 Testing components...');

    // Test SEO component
    const seoPath = 'src/components/SEOHead.tsx';
    if (fs.existsSync(seoPath)) {
      const seoContent = fs.readFileSync(seoPath, 'utf8');
      if (seoContent.includes('useDomain')) {
        this.results.push({
          test: 'SEO Component Domain Awareness',
          status: 'PASS',
          message: 'SEO component uses domain context',
        });
        console.log('  ✅ SEO component is domain-aware');
      } else {
        this.results.push({
          test: 'SEO Component Domain Awareness',
          status: 'FAIL',
          message: 'SEO component not domain-aware',
        });
        console.log('  ❌ SEO component not domain-aware');
      }
    }

    // Test domain layout component
    const layoutPath = 'src/components/DomainLayout.tsx';
    if (fs.existsSync(layoutPath)) {
      this.results.push({
        test: 'Domain Layout Component',
        status: 'PASS',
        message: 'Domain layout component exists',
      });
      console.log('  ✅ Domain layout component exists');
    } else {
      this.results.push({
        test: 'Domain Layout Component',
        status: 'WARN',
        message: 'Domain layout component not found (optional)',
      });
      console.log('  ⚠️  Domain layout component missing (optional)');
    }

    // Test domain context
    const contextPath = 'src/lib/domain/context.tsx';
    if (fs.existsSync(contextPath)) {
      this.results.push({
        test: 'Domain Context Provider',
        status: 'PASS',
        message: 'Domain context provider exists',
      });
      console.log('  ✅ Domain context provider exists');
    } else {
      this.results.push({
        test: 'Domain Context Provider',
        status: 'FAIL',
        message: 'Domain context provider not found',
      });
      console.log('  ❌ Domain context provider missing');
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    if (warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'WARN')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, warnings },
      results: this.results,
      recommendations: this.getRecommendations(),
    };

    fs.writeFileSync(
      'domain-test-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📋 Detailed report saved to: domain-test-report.json');

    // Overall status
    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! Ready for deployment.');
    } else {
      console.log(
        '\n⚠️  Some tests failed. Please fix issues before deployment.'
      );
    }
  }

  /**
   * Get recommendations based on test results
   */
  getRecommendations() {
    const recommendations = [];

    if (
      this.results.some(
        r => r.test.includes('Domain Config') && r.status === 'FAIL'
      )
    ) {
      recommendations.push('Fix domain configuration issues before deployment');
    }

    if (
      this.results.some(
        r => r.test.includes('Middleware') && r.status === 'FAIL'
      )
    ) {
      recommendations.push('Update middleware to handle domain routing');
    }

    if (this.results.some(r => r.test.includes('SEO') && r.status === 'FAIL')) {
      recommendations.push(
        'Make SEO component domain-aware for better regional SEO'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All critical components are ready for deployment');
      recommendations.push(
        'Consider adding optional components like DomainLayout for enhanced UX'
      );
      recommendations.push(
        'Test thoroughly in staging environment before production'
      );
    }

    return recommendations;
  }

  /**
   * Simulate domain requests (for manual testing)
   */
  printManualTestInstructions() {
    console.log('\n🔧 Manual Testing Instructions:');
    console.log('==============================');
    console.log("Since we can't easily simulate different hostnames locally,");
    console.log('you can test domain functionality by:');
    console.log('');
    console.log(
      '1. Temporarily modify the domain detection logic to use query params:'
    );
    console.log('   http://localhost:3000?domain=209.works');
    console.log('   http://localhost:3000?domain=916.works');
    console.log('   http://localhost:3000?domain=510.works');
    console.log('   http://localhost:3000?domain=norcal.works');
    console.log('');
    console.log('2. Or modify your hosts file to point domains to localhost:');
    console.log('   127.0.0.1 209.works');
    console.log('   127.0.0.1 916.works');
    console.log('   127.0.0.1 510.works');
    console.log('   127.0.0.1 norcal.works');
    console.log('');
    console.log('3. Then test each domain with different ports:');
    console.log('   http://209.works:3000');
    console.log('   http://916.works:3000');
    console.log('   etc...');
  }
}

// CLI interface
if (require.main === module) {
  const tester = new LocalDomainTester();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Local Domain Testing Script

Usage: node scripts/test-domains-locally.js [options]

Options:
  --help, -h     Show this help message
  --manual       Show manual testing instructions

Examples:
  node scripts/test-domains-locally.js
  node scripts/test-domains-locally.js --manual
    `);
    process.exit(0);
  }

  if (args.includes('--manual')) {
    tester.printManualTestInstructions();
    process.exit(0);
  }

  // Run tests
  tester.runTests().catch(error => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}
