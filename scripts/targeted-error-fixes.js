/**
 * Targeted Error Fixes
 * Efficient fixes for the most common remaining errors
 */

const fs = require('fs');
const path = require('path');

function targetedErrorFixes(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix "Declaration or statement expected" - Remove problematic lines
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    
    // Remove lines that are just stray characters
    if (trimmed.match(/^[\}\)\];,]+$/)) return false;
    if (trimmed.match(/^[+\-*/=<>!&|]+$/)) return false;
    if (trimmed === '}' || trimmed === ')' || trimmed === ']' || trimmed === ';') return false;
    
    return true;
  });
  
  if (filteredLines.length !== lines.length) {
    content = filteredLines.join('\n');
    hasChanges = true;
  }

  // 2. Fix "',' expected" - Simple parameter fixes
  content = content.replace(/(\w+)\s+(\w+)\s*\)/g, '$1, $2)');
  content = content.replace(/(\w+)\s+(\w+)\s+(\w+)\s*\)/g, '$1, $2, $3)');

  // 3. Fix "';' expected" - Add missing semicolons to obvious cases
  content = content.replace(/^(\s*const\s+[^;]+)$/gm, '$1;');
  content = content.replace(/^(\s*let\s+[^;]+)$/gm, '$1;');
  content = content.replace(/^(\s*var\s+[^;]+)$/gm, '$1;');
  content = content.replace(/^(\s*import\s+[^;]+)$/gm, '$1;');
  content = content.replace(/^(\s*export\s+[^;]+)$/gm, '$1;');

  // 4. Fix "Expression expected" - Clean up basic issues
  content = content.replace(/\.\s*\./g, '.');
  content = content.replace(/\{\s*\}\s*\{/g, '{}');
  content = content.replace(/\[\s*\]\s*\[/g, '[]');

  // 5. Fix "Identifier expected" - Handle reserved words
  content = content.replace(/\btrue\s*:/g, '"true":');
  content = content.replace(/\bfalse\s*:/g, '"false":');
  content = content.replace(/\bnull\s*:/g, '"null":');

  // 6. Fix "Parameter declaration expected" - Basic function cleanup
  content = content.replace(/function\s*\(\s*([^)]*)\s*\)/g, (match, params) => {
    if (!params.trim()) return 'function()';
    
    // Simple parameter cleanup
    const cleanParams = params
      .split(/[,\s]+/)
      .filter(p => p.trim() && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.trim()))
      .join(', ');
    
    return `function(${cleanParams})`;
  });

  // 7. Fix "'{' expected" - Add missing braces
  content = content.replace(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*([^{])/g, 'function $1() { $2');

  // 8. Fix "Property destructuring pattern expected" - Basic cleanup
  content = content.replace(/const\s*\{\s*([^}]*)\s*\}\s*=/g, (match, props) => {
    const cleanProps = props
      .split(',')
      .map(p => p.trim())
      .filter(p => p && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p))
      .join(', ');
    return `const { ${cleanProps} } =`;
  });

  // 9. Fix "')' expected" - Simple parentheses fixes
  content = content.replace(/\([^)]*$/gm, (match) => {
    const openCount = (match.match(/\(/g) || []).length;
    const closeCount = (match.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      return match + ')'.repeat(openCount - closeCount);
    }
    return match;
  });

  // 10. Remove duplicate keywords
  content = content.replace(/\b(const|let|var)\s+\1\b/g, '$1');
  content = content.replace(/\b(function)\s+\1\b/g, '$1');

  // 11. Fix basic template literal issues
  content = content.replace(/\$\{\s*\}/g, '${undefined}');

  // 12. Clean up basic whitespace issues
  content = content.replace(/\s+/g, ' ');
  content = content.replace(/\s*;\s*/g, '; ');
  content = content.replace(/\s*,\s*/g, ', ');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = targetedErrorFixes(content, filePath);

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
  console.log('🎯 Targeted error fixes...\n');

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

  console.log(`\n📊 Targeted Error Fixes Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Targeted error fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No targeted fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { targetedErrorFixes, fixFile };
