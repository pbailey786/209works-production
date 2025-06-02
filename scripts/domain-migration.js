#!/usr/bin/env node

/**
 * Domain Migration Script
 * Helps automate the migration from 209jobs.com to .works domains
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OLD_DOMAIN = '209jobs.com';
const NEW_DOMAINS = [
  '209.works',
  '916.works', 
  '510.works',
  'norcal.works'
];

const PRIMARY_DOMAIN = '209.works';

// File patterns to update
const FILE_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'docs/**/*.md',
  '*.md',
  'package.json'
];

// Exclude patterns
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'coverage/**',
  '.git/**'
];

class DomainMigrator {
  constructor() {
    this.changes = [];
    this.errors = [];
  }

  /**
   * Main migration function
   */
  async migrate() {
    console.log('🚀 Starting domain migration from 209jobs.com to .works domains...\n');

    try {
      // Step 1: Backup current state
      await this.createBackup();

      // Step 2: Update file references
      await this.updateFileReferences();

      // Step 3: Update package.json
      await this.updatePackageJson();

      // Step 4: Update environment files
      await this.updateEnvironmentFiles();

      // Step 5: Generate domain assets
      await this.generateDomainAssets();

      // Step 6: Validate changes
      await this.validateChanges();

      // Step 7: Generate migration report
      await this.generateReport();

      console.log('\n✅ Domain migration completed successfully!');
      console.log('📋 Check migration-report.json for details');
      console.log('🔍 Review changes before committing');

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.log('🔄 Restoring from backup...');
      await this.restoreBackup();
      process.exit(1);
    }
  }

  /**
   * Create backup of current state
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backup-${timestamp}`;
    
    try {
      execSync(`mkdir -p ${backupDir}`);
      execSync(`cp -r src ${backupDir}/`);
      execSync(`cp -r docs ${backupDir}/`);
      execSync(`cp package.json ${backupDir}/`);
      execSync(`cp *.md ${backupDir}/`);
      
      this.backupDir = backupDir;
      console.log(`✅ Backup created: ${backupDir}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Update file references from old domain to new domains
   */
  async updateFileReferences() {
    console.log('🔄 Updating file references...');

    const files = this.findFiles(FILE_PATTERNS, EXCLUDE_PATTERNS);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let updatedContent = content;
        let hasChanges = false;

        // Replace 209jobs.com with 209.works (primary domain)
        if (content.includes(OLD_DOMAIN)) {
          updatedContent = updatedContent.replace(
            new RegExp(OLD_DOMAIN, 'g'),
            PRIMARY_DOMAIN
          );
          hasChanges = true;
        }

        // Update specific patterns that might need domain-aware logic
        const patterns = [
          {
            old: /https:\/\/209jobs\.com/g,
            new: 'https://209.works'
          },
          {
            old: /http:\/\/209jobs\.com/g,
            new: 'https://209.works'
          },
          {
            old: /@209jobs\.com/g,
            new: '@209.works'
          },
          {
            old: /209jobs\.com/g,
            new: '209.works'
          }
        ];

        for (const pattern of patterns) {
          if (pattern.old.test(updatedContent)) {
            updatedContent = updatedContent.replace(pattern.old, pattern.new);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          fs.writeFileSync(file, updatedContent, 'utf8');
          this.changes.push({
            file,
            type: 'domain_reference',
            description: `Updated domain references from ${OLD_DOMAIN} to ${PRIMARY_DOMAIN}`
          });
          console.log(`  ✅ Updated: ${file}`);
        }
      } catch (error) {
        this.errors.push({
          file,
          error: error.message
        });
        console.log(`  ❌ Error updating ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Update package.json with new domain references
   */
  async updatePackageJson() {
    console.log('📦 Updating package.json...');

    try {
      const packagePath = 'package.json';
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Update homepage URL
      if (packageJson.homepage && packageJson.homepage.includes(OLD_DOMAIN)) {
        packageJson.homepage = packageJson.homepage.replace(OLD_DOMAIN, PRIMARY_DOMAIN);
        this.changes.push({
          file: packagePath,
          type: 'package_json',
          description: 'Updated homepage URL'
        });
      }

      // Update repository URL if it exists
      if (packageJson.repository && packageJson.repository.url && packageJson.repository.url.includes(OLD_DOMAIN)) {
        packageJson.repository.url = packageJson.repository.url.replace(OLD_DOMAIN, PRIMARY_DOMAIN);
        this.changes.push({
          file: packagePath,
          type: 'package_json',
          description: 'Updated repository URL'
        });
      }

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('  ✅ Updated package.json');
    } catch (error) {
      this.errors.push({
        file: 'package.json',
        error: error.message
      });
      console.log(`  ❌ Error updating package.json: ${error.message}`);
    }
  }

  /**
   * Update environment files
   */
  async updateEnvironmentFiles() {
    console.log('🔧 Updating environment files...');

    const envFiles = ['.env.example', '.env.local.example'];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        try {
          const content = fs.readFileSync(envFile, 'utf8');
          const updatedContent = content.replace(
            new RegExp(OLD_DOMAIN, 'g'),
            PRIMARY_DOMAIN
          );

          if (content !== updatedContent) {
            fs.writeFileSync(envFile, updatedContent, 'utf8');
            this.changes.push({
              file: envFile,
              type: 'environment',
              description: 'Updated domain references in environment file'
            });
            console.log(`  ✅ Updated: ${envFile}`);
          }
        } catch (error) {
          this.errors.push({
            file: envFile,
            error: error.message
          });
          console.log(`  ❌ Error updating ${envFile}: ${error.message}`);
        }
      }
    }

    // Create new environment template with all domains
    const envTemplate = `
# Domain Configuration
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works

# Email Configuration  
EMAIL_FROM="209 Jobs <noreply@209.works>"
ALERT_EMAIL_FROM=alerts@209.works

# Allowed Origins (all .works domains)
ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works

# API Allowed Origins
API_ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works

# Domain-specific social media (examples)
FACEBOOK_209=https://www.facebook.com/209jobs
INSTAGRAM_209=https://www.instagram.com/209jobs
TWITTER_209=@209jobs

FACEBOOK_916=https://www.facebook.com/916jobs
INSTAGRAM_916=https://www.instagram.com/916jobs
TWITTER_916=@916jobs

FACEBOOK_510=https://www.facebook.com/510jobs
INSTAGRAM_510=https://www.instagram.com/510jobs
TWITTER_510=@510jobs
`;

    fs.writeFileSync('.env.domains.example', envTemplate.trim(), 'utf8');
    console.log('  ✅ Created .env.domains.example with multi-domain configuration');
  }

  /**
   * Generate domain-specific assets
   */
  async generateDomainAssets() {
    console.log('🎨 Generating domain assets...');

    // Create logos directory structure
    const logosDir = 'public/logos';
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Create og-images directory structure  
    const ogImagesDir = 'public/og-images';
    if (!fs.existsSync(ogImagesDir)) {
      fs.mkdirSync(ogImagesDir, { recursive: true });
    }

    // Generate placeholder files for each domain
    const domains = ['209', '916', '510', 'norcal'];
    
    for (const domain of domains) {
      // Create placeholder logo files
      const logoPlaceholder = `${logosDir}/${domain}-works-logo.png`;
      if (!fs.existsSync(logoPlaceholder)) {
        // Create a simple text file as placeholder
        fs.writeFileSync(
          `${logosDir}/${domain}-works-logo.txt`,
          `Placeholder for ${domain}.works logo\nReplace with actual PNG file`,
          'utf8'
        );
      }

      // Create placeholder OG image files
      const ogPlaceholder = `${ogImagesDir}/${domain}-og.jpg`;
      if (!fs.existsSync(ogPlaceholder)) {
        fs.writeFileSync(
          `${ogImagesDir}/${domain}-og.txt`,
          `Placeholder for ${domain}.works Open Graph image\nReplace with actual JPG file (1200x630px)`,
          'utf8'
        );
      }
    }

    console.log('  ✅ Created domain asset placeholders');
  }

  /**
   * Validate changes
   */
  async validateChanges() {
    console.log('🔍 Validating changes...');

    // Check that domain config exists
    const domainConfigPath = 'src/lib/domain/config.ts';
    if (!fs.existsSync(domainConfigPath)) {
      throw new Error('Domain configuration file not found');
    }

    // Check that middleware is updated
    const middlewarePath = 'middleware.ts';
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      if (!content.includes('getDomainConfig')) {
        console.log('  ⚠️  Warning: Middleware may not be updated for domain routing');
      }
    }

    // Check for remaining old domain references
    const remainingRefs = this.findRemainingReferences();
    if (remainingRefs.length > 0) {
      console.log('  ⚠️  Warning: Found remaining references to old domain:');
      remainingRefs.forEach(ref => {
        console.log(`    - ${ref.file}:${ref.line}: ${ref.content}`);
      });
    }

    console.log('  ✅ Validation completed');
  }

  /**
   * Generate migration report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      migration: {
        from: OLD_DOMAIN,
        to: NEW_DOMAINS,
        primary: PRIMARY_DOMAIN
      },
      changes: this.changes,
      errors: this.errors,
      summary: {
        filesChanged: this.changes.length,
        errorsCount: this.errors.length,
        success: this.errors.length === 0
      },
      nextSteps: [
        'Review all changes carefully',
        'Test domain routing locally',
        'Update DNS configuration',
        'Deploy to staging environment',
        'Update social media profiles',
        'Notify users of domain change',
        'Monitor for issues post-migration'
      ]
    };

    fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('📋 Migration report generated: migration-report.json');
  }

  /**
   * Restore from backup
   */
  async restoreBackup() {
    if (this.backupDir && fs.existsSync(this.backupDir)) {
      try {
        execSync(`cp -r ${this.backupDir}/* .`);
        console.log('✅ Restored from backup');
      } catch (error) {
        console.error('❌ Failed to restore backup:', error.message);
      }
    }
  }

  /**
   * Find files matching patterns
   */
  findFiles(includePatterns, excludePatterns = []) {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!excludePatterns.some(pattern => 
            fullPath.match(pattern.replace('**', '.*'))
          )) {
            walkDir(fullPath);
          }
        } else {
          // Check if file matches include patterns
          if (includePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*'));
            return regex.test(fullPath);
          })) {
            files.push(fullPath);
          }
        }
      }
    }
    
    walkDir('.');
    return files;
  }

  /**
   * Find remaining references to old domain
   */
  findRemainingReferences() {
    const references = [];
    const files = this.findFiles(['src/**/*', 'docs/**/*'], EXCLUDE_PATTERNS);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes(OLD_DOMAIN)) {
            references.push({
              file,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return references;
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DomainMigrator();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Domain Migration Script

Usage: node scripts/domain-migration.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be changed without making changes
  --backup-only  Only create backup, don't make changes

Examples:
  node scripts/domain-migration.js
  node scripts/domain-migration.js --dry-run
    `);
    process.exit(0);
  }
  
  if (args.includes('--dry-run')) {
    console.log('🔍 Dry run mode - no changes will be made\n');
    // TODO: Implement dry run mode
    process.exit(0);
  }
  
  if (args.includes('--backup-only')) {
    console.log('📦 Backup only mode\n');
    migrator.createBackup().then(() => {
      console.log('✅ Backup completed');
    }).catch(error => {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    });
    return;
  }
  
  // Run migration
  migrator.migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} 