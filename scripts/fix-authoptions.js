#!/usr/bin/env node

/**
 * Fix remaining authOptions imports for NextAuth v5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Fixing remaining authOptions imports...');

try {
  const filesWithAuthOptions = execSync(
    'grep -r -l "authOptions" src/',
    { encoding: 'utf8', cwd: '/mnt/c/Users/pbail/100devs/209jobs' }
  ).trim().split('\n').filter(Boolean);

  console.log(`📋 Found ${filesWithAuthOptions.length} files with authOptions`);

  let updatedCount = 0;

  for (const file of filesWithAuthOptions) {
    const fullPath = path.join('/mnt/c/Users/pbail/100devs/209jobs', file);
    
    try {
      console.log(`🔧 Updating ${file}...`);
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Remove authOptions import lines completely
      const authOptionsImportPattern = /import\s+authOptions\s+from\s+[^;]+;?\s*\n/g;
      if (authOptionsImportPattern.test(content)) {
        content = content.replace(authOptionsImportPattern, '');
        modified = true;
      }

      // Remove authOptions references in getServerSession calls
      const authOptionsUsagePattern = /getServerSession\([^)]*authOptions[^)]*\)/g;
      if (authOptionsUsagePattern.test(content)) {
        content = content.replace(authOptionsUsagePattern, 'getServerSession()');
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

  console.log(`\n📊 AuthOptions Cleanup:`);
  console.log(`✅ Successfully updated: ${updatedCount} files`);

} catch (error) {
  console.error('❌ Failed to find files:', error.message);
}