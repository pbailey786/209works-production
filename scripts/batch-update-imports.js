#!/usr/bin/env node

/**
 * Batch update NextAuth imports for v5 compatibility
 * This script replaces all v4 import patterns with v5 equivalents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting batch import update for NextAuth v5...');

// Get all files that import from next-auth/next
try {
  const filesWithImports = execSync(
    'grep -r -l "from [\'\\"]next-auth/next[\'\\"]" src/',
    { encoding: 'utf8', cwd: '/mnt/c/Users/pbail/100devs/209jobs' }
  ).trim().split('\n').filter(Boolean);

  console.log(`📋 Found ${filesWithImports.length} files to update`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const file of filesWithImports) {
    const fullPath = path.join('/mnt/c/Users/pbail/100devs/209jobs', file);
    
    try {
      console.log(`🔧 Updating ${file}...`);
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Replace import patterns
      const patterns = [
        {
          old: /import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth\/next['"]/g,
          new: 'import { auth as getServerSession } from "@/auth"'
        },
        {
          old: /import\s*{\s*([^}]*),?\s*getServerSession\s*([^}]*)\s*}\s*from\s*['"]next-auth\/next['"]/g,
          new: (match, before, after) => {
            const imports = [before, after].filter(Boolean).join(', ').trim();
            if (imports) {
              return `import { ${imports} } from "next-auth"\nimport { auth as getServerSession } from "@/auth"`;
            } else {
              return 'import { auth as getServerSession } from "@/auth"';
            }
          }
        }
      ];

      for (const pattern of patterns) {
        if (pattern.old.test(content)) {
          content = content.replace(pattern.old, pattern.new);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        updatedCount++;
        console.log(`✅ Updated ${file}`);
      } else {
        console.log(`⚠️ No changes needed for ${file}`);
      }

    } catch (error) {
      errorCount++;
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  }

  console.log(`\n📊 Update Summary:`);
  console.log(`✅ Successfully updated: ${updatedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  
  if (updatedCount > 0) {
    console.log(`\n🚀 Ready to build! Run: npm run build`);
  }

} catch (error) {
  console.error('❌ Failed to find files:', error.message);
  process.exit(1);
}