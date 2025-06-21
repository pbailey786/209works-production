/**
 * Fix Corrupted Import Statements
 * Fixes malformed import statements caused by previous script
 */

const fs = require('fs');
const path = require('path');

function fixCorruptedImports(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix malformed import statements with extra } } } characters
  // Pattern: import { something } } } from 'module';'
  content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*\}\s*\}\s*from\s*'([^']+)';'/g, "import { $1 } from '$2';");
  content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*\}\s*from\s*'([^']+)';'/g, "import { $1 } from '$2';");
  content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*'([^']+)';'/g, "import { $1 } from '$2';");

  // 2. Fix default imports with extra characters
  // Pattern: import something } } } from 'module';'
  content = content.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*\}\s*\}\s*from\s*'([^']+)';'/g, "import $1 from '$2';");
  content = content.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*from\s*'([^']+)';'/g, "import $1 from '$2';");

  // 3. Fix mixed imports with extra characters
  // Pattern: import React, { useState } } } from 'react';'
  content = content.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*),\s*\{\s*([^}]+)\s*\}\s*\}\s*\}\s*from\s*'([^']+)';'/g, "import $1, { $2 } from '$3';");
  content = content.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*),\s*\{\s*([^}]+)\s*\}\s*\}\s*from\s*'([^']+)';'/g, "import $1, { $2 } from '$3';");

  // 4. Fix statements ending with extra semicolons and quotes
  // Pattern: something;'
  content = content.replace(/([^']+);'/g, '$1;');

  // 5. Fix malformed object destructuring
  // Pattern: const { prop }s} = object;
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}s\}\s*=/g, 'const { $1 } =');
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*\}\s*=/g, 'const { $1 } =');

  // 6. Fix malformed function calls
  // Pattern: function( param }s}
  content = content.replace(/(\w+)\(\s*([^)]+)\s*\}s\}/g, '$1($2)');
  content = content.replace(/(\w+)\(\s*([^)]+)\s*\}\s*\}/g, '$1($2)');

  // 7. Fix malformed JSX props
  // Pattern: <Component {...prop }s} />
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+\{\.\.\.\s*([^}]+)\s*\}s\}\s*\/>/g, '<$1 {...$2} />');
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+\{\.\.\.\s*([^}]+)\s*\}\s*\}\s*\/>/g, '<$1 {...$2} />');
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+\{\.\.\.\s*([^}]+)\s*\}s\}/g, '<$1 {...$2}');
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+\{\.\.\.\s*([^}]+)\s*\}\s*\}/g, '<$1 {...$2}');

  // 8. Fix malformed variable assignments
  // Pattern: variable = value };}
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+)\s*\};/g, '$1 = $2;');
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+)\s*\}\s*;/g, '$1 = $2;');

  // 9. Fix malformed function definitions
  // Pattern: function() { code };}
  content = content.replace(/(\w+)\(\)\s*\{\s*([^}]+)\s*\};/g, '$1() { $2 }');
  content = content.replace(/(\w+)\(\)\s*\{\s*([^}]+)\s*\}\s*;/g, '$1() { $2 }');

  // 10. Fix malformed arrow functions
  // Pattern: () => { code };}'
  content = content.replace(/\(\)\s*=>\s*\{\s*([^}]+)\s*\};'/g, '() => { $1 }');
  content = content.replace(/\(\)\s*=>\s*\{\s*([^}]+)\s*\}'/g, '() => { $1 }');

  // 11. Fix malformed string literals
  // Pattern: 'string content';'
  content = content.replace(/'([^']+)';'/g, "'$1'");

  // 12. Fix malformed template literals
  // Pattern: `template ${var }l}e}`
  content = content.replace(/`([^`]*)\$\{([^}]+)\s*\}l\}e\}`/g, '`$1${$2}`');
  content = content.replace(/`([^`]*)\$\{([^}]+)\s*\}\s*\}e\}`/g, '`$1${$2}`');

  // 13. Fix malformed describe/it blocks
  // Pattern: describe('test', () => { code };}
  content = content.replace(/describe\('([^']+)',\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\};/g, "describe('$1', () => { $2 });");
  content = content.replace(/it\('([^']+)',\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\};/g, "it('$1', () => { $2 });");

  // 14. Fix malformed expect statements
  // Pattern: expect(something).toBe(value);'
  content = content.replace(/expect\(([^)]+)\)\.([a-zA-Z]+)\(([^)]*)\);'/g, 'expect($1).$2($3);');

  // 15. Fix malformed async function syntax
  // Pattern: async () => { code };}
  content = content.replace(/async\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\};/g, 'async () => { $1 }');

  // 16. Fix specific patterns from the error output
  // Fix: 'from' expected errors
  content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*\}\s*\}\s*from/g, 'import { $1 } from');
  content = content.replace(/import\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*\}\s*\}\s*from/g, 'import $1 from');

  // 17. Fix unterminated string literals
  content = content.replace(/from\s*'([^']+)';'/g, "from '$1';");

  // 18. Remove extra semicolons and quotes at end of lines
  content = content.replace(/;'/g, ';');
  content = content.replace(/\}'/g, '}');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixCorruptedImports(content, filePath);

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function getAllTSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git', 'dist'].includes(item)) {
      getAllTSFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('🔧 Fixing corrupted import statements...\n');

  const allFiles = getAllTSFiles('src');
  console.log(`Found ${allFiles.length} TypeScript files to process...\n`);

  let fixedCount = 0;
  let processedCount = 0;

  for (const file of allFiles) {
    processedCount++;
    if (fixFile(file)) {
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
    
    if (processedCount % 100 === 0) {
      console.log(`📊 Progress: ${processedCount}/${allFiles.length} files processed...`);
    }
  }

  console.log(`\n📊 Corrupted Import Fix Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🔧 Corrupted import fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No corrupted imports found!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixCorruptedImports, fixFile };
