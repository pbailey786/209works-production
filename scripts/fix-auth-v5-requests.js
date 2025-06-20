#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing NextAuth v5 API routes to pass request object...');

// Find all TypeScript files in the API routes
const files = glob.sync('src/app/api/**/*.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

let totalFiles = 0;
let modifiedFiles = 0;

const patterns = [
  {
    // Pattern: getServerSession() without request
    old: /const session = await getServerSession\(\)/g,
    new: 'const session = await getServerSession(req)',
    description: 'getServerSession() without request'
  },
  {
    // Pattern: auth() without request in export functions with req parameter
    old: /export async function (GET|POST|PUT|DELETE|PATCH)\(req: NextRequest[^)]*\) \{[\s\S]*?const session = await auth\(\);/g,
    new: (match) => match.replace('await auth()', 'await auth(req)'),
    description: 'auth() without request in API routes'
  },
  {
    // Pattern: auth() without request in export functions with request parameter
    old: /export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest[^)]*\) \{[\s\S]*?const session = await auth\(\);/g,
    new: (match) => match.replace('await auth()', 'await auth(request)'),
    description: 'auth() without request in API routes (using request param)'
  }
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Check if this is an API route file (should have export async function)
    if (!content.includes('export async function')) {
      return;
    }
    
    totalFiles++;
    
    // Apply pattern fixes
    patterns.forEach(pattern => {
      const hasPattern = pattern.old.test(newContent);
      
      if (hasPattern) {
        if (typeof pattern.new === 'function') {
          newContent = newContent.replace(pattern.old, pattern.new);
        } else {
          newContent = newContent.replace(pattern.old, pattern.new);
        }
        
        if (newContent !== content) {
          modified = true;
          console.log(`  ✅ Fixed ${pattern.description} in ${path.relative(process.cwd(), file)}`);
        }
      }
    });
    
    // More specific patterns for common cases
    if (newContent.includes('const session = await auth()') && 
        (newContent.includes('req: NextRequest') || newContent.includes('request: NextRequest'))) {
      
      // Determine the parameter name
      const paramName = newContent.includes('req: NextRequest') ? 'req' : 'request';
      
      // Replace auth() with auth(paramName)
      newContent = newContent.replace(/const session = await auth\(\)/g, `const session = await auth(${paramName})`);
      modified = true;
      console.log(`  ✅ Fixed auth() call in ${path.relative(process.cwd(), file)}`);
    }
    
    if (modified) {
      fs.writeFileSync(file, newContent, 'utf8');
      modifiedFiles++;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n🎉 Completed! Modified ${modifiedFiles} out of ${totalFiles} API route files.`);