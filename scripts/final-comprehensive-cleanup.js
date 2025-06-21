/**
 * Final Comprehensive TypeScript Cleanup
 * Last attempt to fix remaining issues
 */

const fs = require('fs');
const path = require('path');

function finalComprehensiveCleanup(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Remove all trailing quotes and semicolons from lines
  content = content.replace(/;'$/gm, ';');
  content = content.replace(/'$/gm, '');

  // 2. Fix malformed object properties
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*): '([^']*)','/g, "$1: '$2',");
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*): '([^']*)'$/gm, "$1: '$2'");

  // 3. Fix malformed JSX props
  content = content.replace(/\{\.\.\.\s*([^}]+)\s*\)/g, '{...$1}');
  content = content.replace(/\{\.\.\.\s*([^}]+)\s*\}\s*\)/g, '{...$1}');

  // 4. Fix malformed function calls
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\(\s*([^)]+)\s*\)/g, '$1($2)');

  // 5. Fix malformed template literals
  content = content.replace(/\$\{([^}]+)\s*\}([^}]*)\s*\}/g, '${$1}');

  // 6. Fix malformed boolean values
  content = content.replace(/\btru\s*\}/g, 'true');
  content = content.replace(/\bfals\s*\}/g, 'false');

  // 7. Fix malformed variable names
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}([a-zA-Z])/g, '$1$2');

  // 8. Fix malformed screen queries
  content = content.replace(/screen\.([a-zA-Z]+)\(([^)]+)\)\s*\)/g, 'screen.$1($2)');

  // 9. Fix malformed expect statements
  content = content.replace(/expect\(([^)]+)\)\.([a-zA-Z]+)\(([^)]*)\)\s*;/g, 'expect($1).$2($3);');

  // 10. Fix malformed arrow functions
  content = content.replace(/\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*;/g, '() => { $1 }');

  // 11. Fix malformed async functions
  content = content.replace(/async\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*;/g, 'async () => { $1 }');

  // 12. Fix malformed describe/it blocks
  content = content.replace(/describe\('([^']+)',\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*;/g, "describe('$1', () => { $2 });");
  content = content.replace(/it\('([^']+)',\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*;/g, "it('$1', () => { $2 });");

  // 13. Fix malformed object destructuring
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*\}/g, 'const { $1 }');

  // 14. Fix malformed array destructuring
  content = content.replace(/const\s*\[\s*([^\]]+)\s*\]\s*\]/g, 'const [ $1 ]');

  // 15. Fix malformed import statements
  content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*'([^']+)'\s*;/g, "import { $1 } from '$2';");
  content = content.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*'([^']+)'\s*;/g, "import $1 from '$2';");

  // 16. Fix malformed export statements
  content = content.replace(/export\s*\{\s*([^}]+)\s*\}\s*;/g, 'export { $1 };');
  content = content.replace(/export\s+default\s+([^;]+)\s*;/g, 'export default $1;');

  // 17. Fix malformed jest.mock statements
  content = content.replace(/jest\.mock\('([^']+)',\s*\(\)\s*=>\s*\(\{\s*([^}]+)\s*\}\)\s*\)\s*;/g, "jest.mock('$1', () => ({ $2 }));");

  // 18. Fix malformed beforeEach statements
  content = content.replace(/beforeEach\(\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*\)\s*;/g, 'beforeEach(() => { $1 });');

  // 19. Fix malformed afterEach statements
  content = content.replace(/afterEach\(\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*\)\s*;/g, 'afterEach(() => { $1 });');

  // 20. Fix malformed waitFor statements
  content = content.replace(/await\s+waitFor\(\(\)\s*=>\s*\{\s*([^}]+)\s*\}\s*\)\s*;/g, 'await waitFor(() => { $1 });');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = finalComprehensiveCleanup(content, filePath);

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
  console.log('🎯 Final comprehensive TypeScript cleanup...\n');

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

  console.log(`\n📊 Final Comprehensive Cleanup Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Final comprehensive cleanup complete!');
    console.log('💡 Run "npm run type-check" to see the final results.');
  } else {
    console.log('\n✨ No issues found in final cleanup!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { finalComprehensiveCleanup, fixFile };
