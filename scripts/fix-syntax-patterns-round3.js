/**
 * Fix Syntax Patterns Round 3
 * Targets the most common remaining syntax errors
 */

const fs = require('fs');
const path = require('path');

function fixSyntaxPatternsRound3(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix "Declaration or statement expected" errors
  // Remove stray characters and malformed syntax
  content = content.replace(/^\s*\}\s*$/gm, ''); // Remove standalone closing braces
  content = content.replace(/^\s*\)\s*$/gm, ''); // Remove standalone closing parentheses
  content = content.replace(/^\s*\]\s*$/gm, ''); // Remove standalone closing brackets
  content = content.replace(/^\s*;\s*$/gm, ''); // Remove standalone semicolons

  // 2. Fix "',' expected" errors
  // Fix function parameters and object properties
  content = content.replace(/(\w+)\s+(\w+)\s*\)/g, '$1, $2)'); // function(param1 param2) -> function(param1, param2)
  content = content.replace(/(\w+)\s+(\w+)\s+(\w+)\s*\)/g, '$1, $2, $3)'); // function(a b c) -> function(a, b, c)
  content = content.replace(/(\w+):\s*(\w+)\s+(\w+):/g, '$1: $2, $3:'); // obj: { prop1: val1 prop2: val2 } -> obj: { prop1: val1, prop2: val2 }

  // 3. Fix "Expression expected" errors
  // Fix malformed expressions and operators
  content = content.replace(/\{\s*\}\s*\{/g, '{}'); // Remove empty object followed by opening brace
  content = content.replace(/\[\s*\]\s*\[/g, '[]'); // Remove empty array followed by opening bracket
  content = content.replace(/\(\s*\)\s*\(/g, '()'); // Remove empty parentheses followed by opening paren

  // 4. Fix "';' expected" errors
  // Add missing semicolons
  content = content.replace(/^(\s*)(const|let|var)\s+([^;]+)$/gm, '$1$2 $3;'); // Variable declarations
  content = content.replace(/^(\s*)(import\s+[^;]+)$/gm, '$1$2;'); // Import statements
  content = content.replace(/^(\s*)(export\s+[^;]+)$/gm, '$1$2;'); // Export statements
  content = content.replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+)$/gm, '$1$2;'); // Assignments

  // 5. Fix "Parameter declaration expected" errors
  // Fix malformed function parameters
  content = content.replace(/function\s*\(\s*([^)]*)\s*\{/g, (match, params) => {
    if (params.trim()) {
      // Ensure parameters are properly formatted
      const cleanParams = params.split(/\s+/).filter(p => p.trim()).join(', ');
      return `function(${cleanParams}) {`;
    }
    return 'function() {';
  });

  // 6. Fix "Unterminated string literal" errors
  // Find and fix unterminated strings
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check for unterminated single quotes
    const singleQuotes = (line.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      // Odd number of single quotes - likely unterminated
      line += "'";
    }
    
    // Check for unterminated double quotes
    const doubleQuotes = (line.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      // Odd number of double quotes - likely unterminated
      line += '"';
    }
    
    // Check for unterminated template literals
    const backticks = (line.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      // Odd number of backticks - likely unterminated
      line += '`';
    }
    
    fixedLines.push(line);
  }
  
  content = fixedLines.join('\n');

  // 7. Fix "Unexpected keyword or identifier" errors
  // Remove duplicate keywords and identifiers
  content = content.replace(/\b(const|let|var)\s+\1\b/g, '$1'); // Remove duplicate variable keywords
  content = content.replace(/\b(function)\s+\1\b/g, '$1'); // Remove duplicate function keywords
  content = content.replace(/\b(import)\s+\1\b/g, '$1'); // Remove duplicate import keywords
  content = content.replace(/\b(export)\s+\1\b/g, '$1'); // Remove duplicate export keywords

  // 8. Fix "Identifier expected" errors
  // Fix malformed identifiers
  content = content.replace(/\.\s*\./g, '.'); // Remove double dots
  content = content.replace(/\[\s*\]/g, '[]'); // Fix empty array access
  content = content.replace(/\{\s*\}/g, '{}'); // Fix empty object access

  // 9. Fix "'{' or ';' expected" errors
  // Fix malformed function and object declarations
  content = content.replace(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, 'function $1('); // Fix function declarations
  content = content.replace(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\{/g, 'class $1 {'); // Fix class declarations

  // 10. Fix malformed JSX syntax
  // Clean up JSX-specific issues
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+([^>]*)\s*>/g, '<$1 $2>'); // Fix JSX opening tags
  content = content.replace(/<\/([A-Z][a-zA-Z0-9]*)\s+>/g, '</$1>'); // Fix JSX closing tags

  // 11. Fix malformed object and array syntax
  content = content.replace(/\{\s*,/g, '{'); // Remove leading commas in objects
  content = content.replace(/,\s*\}/g, '}'); // Remove trailing commas before closing braces
  content = content.replace(/\[\s*,/g, '['); // Remove leading commas in arrays
  content = content.replace(/,\s*\]/g, ']'); // Remove trailing commas before closing brackets

  // 12. Fix malformed template literals
  content = content.replace(/\$\{\s*\}/g, '${undefined}'); // Fix empty template expressions
  content = content.replace(/\$\{([^}]*)\s*\$\{/g, '${$1} ${'); // Fix nested template expressions

  // 13. Fix malformed arrow functions
  content = content.replace(/=>\s*\{([^}]*)\s*=>/g, '=> { $1 }'); // Fix nested arrow functions
  content = content.replace(/\(\)\s*=>\s*\(\)/g, '() => {}'); // Fix empty arrow functions

  // 14. Fix malformed conditional expressions
  content = content.replace(/\?\s*:/g, '? undefined :'); // Fix empty ternary conditions
  content = content.replace(/:\s*\?/g, ': undefined'); // Fix malformed ternary operators

  // 15. Fix malformed type annotations (TypeScript specific)
  content = content.replace(/:\s*,/g, ': any,'); // Fix empty type annotations
  content = content.replace(/:\s*\}/g, ': any}'); // Fix empty type annotations at end of objects
  content = content.replace(/:\s*\)/g, ': any)'); // Fix empty type annotations in function parameters

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixSyntaxPatternsRound3(content, filePath);

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
  console.log('🎯 Fixing syntax patterns round 3...\n');

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

  console.log(`\n📊 Syntax Patterns Round 3 Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Syntax patterns round 3 complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No syntax pattern fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixSyntaxPatternsRound3, fixFile };
