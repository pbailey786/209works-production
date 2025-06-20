#!/usr/bin/env node

/**
 * Fix all remaining getServerSession references for NextAuth v5 beta
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing all remaining getServerSession references...');

// Find all TypeScript files in the API routes
const files = glob.sync('src/app/api/**/*.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

let totalFiles = 0;
let modifiedFiles = 0;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Check if this file has getServerSession references
    if (!content.includes('getServerSession')) {
      return;
    }
    
    totalFiles++;
    console.log(`🔧 Processing: ${path.relative(process.cwd(), file)}`);
    
    // Fix import statements
    if (content.includes('import { auth as getServerSession }')) {
      newContent = newContent.replace(
        /import { auth as getServerSession } from ["']@\/auth["']/g,
        'import { auth } from "@/auth"'
      );
      modified = true;
      console.log(`  ✅ Fixed import statement`);
    }
    
    // Fix function calls
    if (content.includes('await getServerSession()')) {
      newContent = newContent.replace(
        /await getServerSession\(\)/g,
        'await auth()'
      );
      modified = true;
      console.log(`  ✅ Fixed function calls`);
    }
    
    // Fix any remaining getServerSession references
    if (content.includes('getServerSession')) {
      // Look for patterns like: const session = await getServerSession() as Session | null;
      newContent = newContent.replace(
        /const session = await getServerSession\(\) as ([^;]+);/g,
        'const session = await auth() as $1;'
      );
      
      // Look for patterns like: session = await getServerSession() as Session | null;
      newContent = newContent.replace(
        /session = await getServerSession\(\) as ([^;]+);/g,
        'session = await auth() as $1;'
      );
      
      modified = true;
      console.log(`  ✅ Fixed remaining getServerSession references`);
    }
    
    if (modified) {
      fs.writeFileSync(file, newContent, 'utf8');
      modifiedFiles++;
      console.log(`  ✅ Updated: ${path.relative(process.cwd(), file)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Processed ${totalFiles} files with getServerSession references`);
console.log(`✅ Modified ${modifiedFiles} files`);
console.log(`🚀 All getServerSession references should now be fixed for NextAuth v5 beta!`);
