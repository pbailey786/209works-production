/**
 * Round 4 Syntax Cleanup
 * Targets the specific remaining error patterns from analysis
 */

const fs = require('fs');
const path = require('path');

function round4SyntaxCleanup(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix "';' expected" (59 instances) - Most common remaining error
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines, comments, and lines that already end with semicolon
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.endsWith(';')) {
      fixedLines.push(line);
      continue;
    }
    
    // Add semicolon to lines that clearly need it
    if (trimmed.match(/^(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/) ||
        trimmed.match(/^import\s+/) ||
        trimmed.match(/^export\s+/) ||
        trimmed.match(/^return\s+/) ||
        trimmed.match(/^throw\s+/) ||
        trimmed.match(/^break$/) ||
        trimmed.match(/^continue$/)) {
      
      // Only add semicolon if line doesn't end with {, }, (, ), [, ], or ,
      if (!trimmed.match(/[{}\(\)\[\],]$/)) {
        line = line.replace(/\s*$/, ';');
        hasChanges = true;
      }
    }
    
    fixedLines.push(line);
  }
  
  content = fixedLines.join('\n');

  // 2. Fix "Unexpected keyword or identifier" (31 instances)
  // Remove duplicate keywords
  content = content.replace(/\b(const|let|var)\s+\1\b/g, '$1');
  content = content.replace(/\b(function)\s+\1\b/g, '$1');
  content = content.replace(/\b(import)\s+\1\b/g, '$1');
  content = content.replace(/\b(export)\s+\1\b/g, '$1');
  content = content.replace(/\b(class)\s+\1\b/g, '$1');
  content = content.replace(/\b(interface)\s+\1\b/g, '$1');
  content = content.replace(/\b(type)\s+\1\b/g, '$1');

  // Fix keywords followed by unexpected identifiers
  content = content.replace(/\bconst\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, 'const $1 =');
  content = content.replace(/\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, 'let $1 =');
  content = content.replace(/\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, 'var $1 =');

  // 3. Fix "Unexpected token. Did you mean `{'}'}` or `&rbrace;`?" (29 instances)
  // Fix malformed JSX and template literals
  content = content.replace(/\{'\}'\}/g, '}');
  content = content.replace(/&rbrace;/g, '}');
  content = content.replace(/\{\s*'\}'\s*\}/g, '}');

  // 4. Fix "'}' expected" (16 instances)
  // Add missing closing braces
  content = content.replace(/\{[^}]*$/gm, (match) => {
    const openCount = (match.match(/\{/g) || []).length;
    const closeCount = (match.match(/\}/g) || []).length;
    if (openCount > closeCount) {
      return match + '}'.repeat(openCount - closeCount);
    }
    return match;
  });

  // 5. Fix "',' expected" (14 instances)
  // Fix function parameters and object properties
  content = content.replace(/(\w+)\s+(\w+)\s*\)/g, '$1, $2)');
  content = content.replace(/(\w+)\s+(\w+)\s+(\w+)\s*\)/g, '$1, $2, $3)');
  content = content.replace(/(\w+):\s*([^,}]+)\s+(\w+):/g, '$1: $2, $3:');

  // 6. Fix "Expression expected" (12 instances)
  // Clean up malformed expressions
  content = content.replace(/\.\s*\./g, '.');
  content = content.replace(/\{\s*\}\s*\{/g, '{}');
  content = content.replace(/\[\s*\]\s*\[/g, '[]');
  content = content.replace(/\(\s*\)\s*\(/g, '()');

  // 7. Fix "Unexpected token. Did you mean `{'>'}` or `&gt;`?" (5 instances)
  // Fix malformed JSX
  content = content.replace(/\{'>'\}/g, '>');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/\{\s*'>'\s*\}/g, '>');

  // 8. Fix "Declaration or statement expected" (5 instances)
  // Remove stray characters
  content = content.replace(/^\s*[\}\)\];,]+\s*$/gm, '');

  // 9. Fix "Identifier expected" (4 instances)
  // Fix malformed identifiers
  content = content.replace(/\.\s*\./g, '.');
  content = content.replace(/\[\s*\]/g, '[]');
  content = content.replace(/\{\s*\}/g, '{}');

  // Fix reserved words as identifiers
  content = content.replace(/\btrue\s*:/g, '"true":');
  content = content.replace(/\bfalse\s*:/g, '"false":');
  content = content.replace(/\bnull\s*:/g, '"null":');

  // 10. Fix "')' expected" (4 instances)
  // Add missing closing parentheses
  content = content.replace(/\([^)]*$/gm, (match) => {
    const openCount = (match.match(/\(/g) || []).length;
    const closeCount = (match.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      return match + ')'.repeat(openCount - closeCount);
    }
    return match;
  });

  // 11. Fix "'(' expected" (3 instances)
  // Add missing opening parentheses for function calls
  content = content.replace(/(\w+)\s*\)/g, '$1()');
  content = content.replace(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\{/g, 'function $1() {');

  // 12. Fix "Unterminated string literal" (1 instance)
  // Find and fix unterminated strings
  const stringLines = content.split('\n');
  const fixedStringLines = [];
  
  for (let i = 0; i < stringLines.length; i++) {
    let line = stringLines[i];
    
    // Check for unterminated single quotes
    const singleQuotes = (line.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      line += "'";
      hasChanges = true;
    }
    
    // Check for unterminated double quotes
    const doubleQuotes = (line.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      line += '"';
      hasChanges = true;
    }
    
    // Check for unterminated template literals
    const backticks = (line.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      line += '`';
      hasChanges = true;
    }
    
    fixedStringLines.push(line);
  }
  
  content = fixedStringLines.join('\n');

  // 13. Fix JSX closing tag issues
  // Fix "JSX element 'header' has no corresponding closing tag"
  // Fix "Expected corresponding JSX closing tag for 'div'"
  content = content.replace(/<(header|div|span|p|h1|h2|h3|h4|h5|h6|section|article|main|nav|aside|footer)\s*([^>]*)>/g, (match, tag, attrs) => {
    // If it's a self-closing tag, make sure it ends with />
    if (attrs.includes('/')) {
      return `<${tag} ${attrs.replace(/\s*\/\s*$/, '')} />`;
    }
    return match;
  });

  // 14. Fix "Invalid character" (1 instance)
  // Remove invalid characters
  content = content.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters

  // 15. Fix "Variable declaration expected" (1 instance)
  // Fix malformed variable declarations
  content = content.replace(/^(\s*)(const|let|var)\s*$/gm, ''); // Remove incomplete declarations

  // 16. Fix "Property or signature expected" (1 instance)
  // Fix malformed object properties
  content = content.replace(/\{\s*,/g, '{'); // Remove leading commas in objects
  content = content.replace(/,\s*\}/g, '}'); // Remove trailing commas before closing braces

  // 17. Fix "Property assignment expected" (1 instance)
  // Fix malformed property assignments
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*$/gm, ''); // Remove incomplete property assignments

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = round4SyntaxCleanup(content, filePath);

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
  console.log('🎯 Round 4 syntax cleanup - targeting specific error patterns...\n');

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

  console.log(`\n📊 Round 4 Syntax Cleanup Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Round 4 syntax cleanup complete!');
    console.log('💡 Run "npm run type-check" to see the targeted improvements.');
  } else {
    console.log('\n✨ No round 4 syntax fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { round4SyntaxCleanup, fixFile };
