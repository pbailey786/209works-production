#!/usr/bin/env node

/**
 * Quick Type Check Script for Phase 1
 * 
 * This script helps identify which files are causing TypeScript slowdowns
 * by checking only core files first, then expanding.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 1 Quick Type Check');
console.log('========================================');

// Core files that MUST work in Phase 1
const coreFiles = [
  'src/app/page.tsx',                        // Homepage
  'src/app/jobs/page.tsx',                   // Job search
  'src/app/jobs/[id]/page.tsx',              // Job details
  'src/app/employers/page.tsx',              // Employer landing
  'src/app/employers/create-job-post/page.tsx', // Job posting
  'src/app/contact/page.tsx',                // Contact
  'src/lib/feature-flags.ts',               // Our new feature flags
];

console.log('✅ Checking core files first...');

let hasErrors = false;

for (const file of coreFiles) {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing core file: ${file}`);
    hasErrors = true;
    continue;
  }
  
  try {
    // Check individual file
    execSync(`npx tsc --noEmit ${fullPath}`, { 
      stdio: 'pipe',
      timeout: 10000 // 10 second timeout per file
    });
    console.log(`✅ ${file}`);
  } catch (error) {
    console.log(`❌ ${file}`);
    console.log(`   Error: ${error.stdout?.toString() || error.message}`);
    hasErrors = true;
  }
}

console.log('\n========================================');

if (hasErrors) {
  console.log('❌ Found errors in core files. Fix these first before proceeding.');
  process.exit(1);
} else {
  console.log('✅ All core files pass TypeScript check!');
  console.log('🚀 Ready to test build with simplified codebase.');
}