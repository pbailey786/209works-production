/**
 * Fix Final Corrupted Files
 * Addresses remaining corruption from previous scripts
 */

const fs = require('fs');
const path = require('path');

function fixFinalCorruption(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix malformed jest.mock statements
  // Pattern: jest.mock('module', () => ({ func: () => ({'
  content = content.replace(
    /jest\.mock\('([^']+)',\s*\(\)\s*=>\s*\(\{\s*([^:]+):\s*\(\)\s*=>\s*\(\{'/g,
    "jest.mock('$1', () => ({\n  $2: () => ({"
  );

  // 2. Fix malformed object destructuring in mocks
  // Pattern: },}} should be })
  content = content.replace(/\},\}\}/g, '})');
  content = content.replace(/\}\s*,\s*\}\}/g, '})');

  // 3. Fix malformed describe/it blocks
  // Pattern: describe('test', () => { const mockProps = {'
  content = content.replace(
    /describe\('([^']+)',\s*\(\)\s*=>\s*\{\s*const\s+([^=]+)\s*=\s*\{'/g,
    "describe('$1', () => {\n  const $2 = {"
  );

  // 4. Fix malformed function calls with extra characters
  // Pattern: function() };}
  content = content.replace(/(\w+)\(\)\s*\};\}/g, '$1();');
  content = content.replace(/(\w+)\(\)\s*\}\s*;\s*\}/g, '$1();');

  // 5. Fix malformed arrow functions in it blocks
  // Pattern: it('test', () =>  }{}
  content = content.replace(/it\('([^']+)',\s*\(\)\s*=>\s*\}\{\}/g, "it('$1', () => {");
  content = content.replace(/it\('([^']+)',\s*async\s*\(\)\s*=>\s*\{\s*'/g, "it('$1', async () => {");

  // 6. Fix malformed JSX props with extra characters
  // Pattern: {...mockProp }s}
  content = content.replace(/\{\.\.\.\s*([^}]+)\s*\}s\}/g, '{...$1}');
  content = content.replace(/\{\.\.\.\s*([^}]+)\s*\}\s*\}s\}/g, '{...$1}');

  // 7. Fix malformed variable references
  // Pattern: mockProp }s should be mockProps
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}s/g, '$1s');
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*s/g, '$1s');

  // 8. Fix malformed template literals
  // Pattern: ${ variable }l}e} should be ${variable}
  content = content.replace(/\$\{\s*([^}]+)\s*\}l\}e\}/g, '${$1}');
  content = content.replace(/\$\{\s*([^}]+)\s*\}\s*l\s*\}\s*e\s*\}/g, '${$1}');

  // 9. Fix malformed string concatenations
  // Pattern: variable }n}y} should be variable
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}n\}y\}/g, '$1');
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*n\s*\}\s*y\s*\}/g, '$1');

  // 10. Fix malformed boolean values
  // Pattern: tru }e should be true
  content = content.replace(/tru\s*\}e/g, 'true');
  content = content.replace(/fals\s*\}e/g, 'false');

  // 11. Fix malformed function parameters
  // Pattern: function( param }e}
  content = content.replace(/(\w+)\(\s*([^)]+)\s*\}e\}/g, '$1($2)');
  content = content.replace(/(\w+)\(\s*([^)]+)\s*\}\s*e\s*\}/g, '$1($2)');

  // 12. Fix malformed expect statements with extra quotes
  // Pattern: expect(something).toBeInTheDocument();'
  content = content.replace(/expect\(([^)]+)\)\.([a-zA-Z]+)\(([^)]*)\);'/g, 'expect($1).$2($3);');

  // 13. Fix malformed object properties with extra characters
  // Pattern: property: value },}
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,}]+)\s*\},\}/g, '$1');

  // 14. Fix malformed array/object closing
  // Pattern: ] },} should be ]
  content = content.replace(/\]\s*\},\}/g, ']');
  content = content.replace(/\}\s*\},\}/g, '}');

  // 15. Fix malformed async function syntax
  // Pattern: async () => { code };}'
  content = content.replace(/async\s*\(\)\s*=>\s*\{\s*([^}]+)\s*\};'/g, 'async () => { $1 }');

  // 16. Fix specific test patterns
  // Fix: const user = userEvent.setup() };}
  content = content.replace(/const\s+user\s*=\s*userEvent\.setup\(\)\s*\};\}/g, 'const user = userEvent.setup();');

  // Fix: const { container } } = 
  content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*\}\s*=/g, 'const { $1 } =');

  // Fix: const { rerender } } = 
  content = content.replace(/const\s*\{\s*rerender\s*\}\s*\}\s*=/g, 'const { rerender } =');

  // 17. Fix malformed waitFor statements
  // Pattern: await waitFor(() => { expect(something) };}
  content = content.replace(/await\s+waitFor\(\(\)\s*=>\s*\{\s*([^}]+)\s*\};\}/g, 'await waitFor(() => { $1 });');

  // 18. Fix malformed fireEvent statements
  // Pattern: fireEvent.keyDown(element, { key: 'Enter' } });'
  content = content.replace(/fireEvent\.([a-zA-Z]+)\(([^)]+)\);'/g, 'fireEvent.$1($2);');

  // 19. Fix malformed screen queries
  // Pattern: screen.getByRole('button', { name: /save/i } });'
  content = content.replace(/screen\.([a-zA-Z]+)\(([^)]+)\);'/g, 'screen.$1($2);');

  // 20. Fix malformed renderWithProviders calls
  // Pattern: renderWithProviders(<Component {...props} />);'
  content = content.replace(/renderWithProviders\(([^)]+)\);'/g, 'renderWithProviders($1);');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixFinalCorruption(content, filePath);

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
  console.log('🔧 Final corruption cleanup...\n');

  // Focus on test files first since they're most corrupted
  const allFiles = getAllTSFiles('src');
  const testFiles = allFiles.filter(file => file.includes('test') || file.includes('__tests__'));
  const otherFiles = allFiles.filter(file => !file.includes('test') && !file.includes('__tests__'));

  console.log(`Found ${testFiles.length} test files and ${otherFiles.length} other files...\n`);

  let fixedCount = 0;

  // Fix test files first
  console.log('🧪 Fixing test files...');
  for (const file of testFiles) {
    if (fixFile(file)) {
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  }

  // Fix other files
  console.log('\n📁 Fixing other files...');
  for (const file of otherFiles) {
    if (fixFile(file)) {
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  }

  console.log(`\n📊 Final Corruption Fix Summary:`);
  console.log(`   Total files processed: ${allFiles.length}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🔧 Final corruption fixes complete!');
    console.log('💡 Run "npm run type-check" to see the final results.');
  } else {
    console.log('\n✨ No corruption found!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFinalCorruption, fixFile };
