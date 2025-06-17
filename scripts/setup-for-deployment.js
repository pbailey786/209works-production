#!/usr/bin/env node

/**
 * Setup Script for .works Domain Deployment
 * Prepares the project for initial deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentSetup {
  constructor() {
    this.tasks = [];
    this.errors = [];
  }

  /**
   * Run all setup tasks
   */
  async setup() {
    console.log('🚀 Setting up project for .works domain deployment...\n');

    try {
      await this.checkPrerequisites();
      await this.createDirectories();
      await this.generatePlaceholderAssets();
      await this.updatePackageScripts();
      await this.createGitIgnoreEntries();
      await this.generateSummary();

      console.log('\n✅ Setup completed successfully!');
      console.log('📋 Next steps:');
      console.log('  1. Register your .works domains');
      console.log('  2. Set up your environment variables');
      console.log('  3. Test locally with: npm run dev');
      console.log('  4. Run tests with: node scripts/test-domains-locally.js');
      console.log('  5. Deploy to Vercel');
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js version: ${nodeVersion}`);

    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Are you in the project root?');
    }

    // Check if Next.js is installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
      throw new Error('Next.js not found in dependencies');
    }

    console.log('  ✅ Prerequisites check passed');
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    console.log('\n📁 Creating directories...');

    const directories = [
      'public/logos',
      'public/og-images',
      'public/favicons',
      'src/lib/domain',
      'docs',
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      } else {
        console.log(`  ✓ Exists: ${dir}`);
      }
    }
  }

  /**
   * Generate placeholder assets
   */
  async generatePlaceholderAssets() {
    console.log('\n🎨 Generating placeholder assets...');

    const domains = [
      { code: '209', name: 'Central Valley', color: '#3B82F6' },
      { code: '916', name: 'Sacramento Metro', color: '#059669' },
      { code: '510', name: 'East Bay', color: '#DC2626' },
      { code: 'norcal', name: 'Northern California', color: '#7C3AED' },
    ];

    for (const domain of domains) {
      // Create logo placeholder
      const logoPath = `public/logos/${domain.code}-works-logo.svg`;
      if (!fs.existsSync(logoPath)) {
        const logoSvg = `
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" fill="${domain.color}" rx="8"/>
  <text x="100" y="35" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        text-anchor="middle" fill="white">${domain.code.toUpperCase()} JOBS</text>
</svg>`.trim();

        fs.writeFileSync(logoPath, logoSvg);
        console.log(`  ✅ Created logo: ${logoPath}`);
      }

      // Create OG image placeholder
      const ogPath = `public/og-images/${domain.code}-og.svg`;
      if (!fs.existsSync(ogPath)) {
        const ogSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${domain.color}"/>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="white">${domain.name} Jobs</text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="32" 
        text-anchor="middle" fill="white">${domain.code}.works</text>
  <text x="600" y="420" font-family="Arial, sans-serif" font-size="24" 
        text-anchor="middle" fill="white">Find local jobs in ${domain.name}</text>
</svg>`.trim();

        fs.writeFileSync(ogPath, ogSvg);
        console.log(`  ✅ Created OG image: ${ogPath}`);
      }

      // Create favicon placeholder
      const faviconPath = `public/favicons/${domain.code}-favicon.svg`;
      if (!fs.existsSync(faviconPath)) {
        const faviconSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="${domain.color}" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
        text-anchor="middle" fill="white">${domain.code.charAt(0)}</text>
</svg>`.trim();

        fs.writeFileSync(faviconPath, faviconSvg);
        console.log(`  ✅ Created favicon: ${faviconPath}`);
      }
    }
  }

  /**
   * Update package.json scripts
   */
  async updatePackageScripts() {
    console.log('\n📦 Updating package.json scripts...');

    const packagePath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Add domain-related scripts
    const newScripts = {
      'test:domains': 'node scripts/test-domains-locally.js',
      'setup:deployment': 'node scripts/setup-for-deployment.js',
      'domain:migrate': 'node scripts/domain-migration.js',
    };

    let hasChanges = false;
    for (const [script, command] of Object.entries(newScripts)) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        hasChanges = true;
        console.log(`  ✅ Added script: ${script}`);
      }
    }

    if (hasChanges) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('  ✅ Package.json updated');
    } else {
      console.log('  ✓ Scripts already exist');
    }
  }

  /**
   * Create .gitignore entries
   */
  async createGitIgnoreEntries() {
    console.log('\n📝 Updating .gitignore...');

    const gitignorePath = '.gitignore';
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    const newEntries = [
      '# Domain testing reports',
      'domain-test-report.json',
      'migration-report.json',
      '',
      '# Environment files',
      '.env.local',
      '.env.production',
      '',
    ];

    let hasChanges = false;
    for (const entry of newEntries) {
      if (!gitignoreContent.includes(entry) && entry.trim()) {
        gitignoreContent += '\n' + entry;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('  ✅ .gitignore updated');
    } else {
      console.log('  ✓ .gitignore already up to date');
    }
  }

  /**
   * Generate setup summary
   */
  async generateSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      domains: ['209.works', '916.works', '510.works', 'norcal.works'],
      filesCreated: [
        'src/lib/domain/config.ts',
        'src/lib/domain/context.tsx',
        'src/lib/domain/job-filters.ts',
        'src/lib/domain/email-templates.ts',
        'src/components/DomainLayout.tsx',
        'src/components/SEOHead.tsx (updated)',
        'middleware.ts (updated)',
        'next.config.ts (updated)',
      ],
      assetsCreated: [
        'public/logos/*.svg',
        'public/og-images/*.svg',
        'public/favicons/*.svg',
      ],
      nextSteps: [
        'Register .works domains',
        'Set up DNS records',
        'Configure environment variables',
        'Test locally',
        'Deploy to Vercel',
        'Add custom domains in Vercel',
        'Test production deployment',
      ],
    };

    fs.writeFileSync('setup-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n📋 Setup summary saved to: setup-summary.json');
  }
}

// CLI interface
if (require.main === module) {
  const setup = new DeploymentSetup();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Setup Script for .works Domain Deployment

Usage: node scripts/setup-for-deployment.js [options]

Options:
  --help, -h     Show this help message

This script will:
  - Check prerequisites
  - Create necessary directories
  - Generate placeholder assets
  - Update package.json scripts
  - Update .gitignore
  - Generate setup summary

Examples:
  node scripts/setup-for-deployment.js
    `);
    process.exit(0);
  }

  // Run setup
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}
