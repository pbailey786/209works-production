#!/usr/bin/env node

/**
 * Fix remaining authOptions imports that previous script missed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Fixing remaining authOptions imports...');

try {
  const filesWithAuthOptionsImports = execSync(
    'grep -r "import.*authOptions" src/',
    { encoding: 'utf8', cwd: '/mnt/c/Users/pbail/100devs/209jobs' }
  ).trim().split('\n').filter(Boolean);

  console.log(`📋 Found ${filesWithAuthOptionsImports.length} files with authOptions imports`);

  let updatedCount = 0;

  for (const line of filesWithAuthOptionsImports) {
    const [file] = line.split(':');
    const fullPath = path.join('/mnt/c/Users/pbail/100devs/209jobs', file);
    
    try {
      console.log(`🔧 Updating ${file}...`);
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Remove authOptions import lines from @/lib/auth
      const authOptionsLibImportPattern = /import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"]\s*;?\s*\n/g;
      if (authOptionsLibImportPattern.test(content)) {
        content = content.replace(authOptionsLibImportPattern, '');
        modified = true;
      }

      // Remove authOptions usage in getServerSession calls - replace with empty call
      const authOptionsUsagePattern = /getServerSession\(\s*authOptions\s*\)/g;
      if (authOptionsUsagePattern.test(content)) {
        content = content.replace(authOptionsUsagePattern, 'getServerSession()');
        modified = true;
      }

      // Remove standalone authOptions references 
      const standaloneAuthOptionsPattern = /\bauthOptions\b/g;
      if (standaloneAuthOptionsPattern.test(content)) {
        content = content.replace(standaloneAuthOptionsPattern, '{}');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        updatedCount++;
        console.log(`✅ Updated ${file}`);
      } else {
        console.log(`⚠️ No changes needed for ${file}`);
      }

    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  }

  console.log(`\n📊 Remaining AuthOptions Cleanup:`);
  console.log(`✅ Successfully updated: ${updatedCount} files`);

} catch (error) {
  console.error('❌ Failed to find files:', error.message);
}