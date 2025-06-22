/**
 * Fix Remaining Syntax Errors
 * Targets specific syntax error patterns from TypeScript output
 */

const fs = require('fs');
const path = require('path');

function fixRemainingSyntaxErrors(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix missing commas in function calls
  // Pattern: function(arg1 arg2) should be function(arg1, arg2)
  content = content.replace(/(\w+)\s+(\w+)\s*\)/g, '$1, $2)');
  content = content.replace(/(\w+)\s+(\w+)\s+(\w+)\s*\)/g, '$1, $2, $3)');

  // 2. Fix malformed template literals with missing closing braces
  // Pattern: ${variable should be ${variable}
  content = content.replace(/\$\{([^}]+)(?!\})/g, '${$1}');

  // 3. Fix malformed JSX expressions
  // Pattern: {variable should be {variable}
  content = content.replace(/\{([^}]+)(?!\})\s*$/gm, '{$1}');

  // 4. Fix missing closing parentheses in function calls
  // Pattern: function(args should be function(args)
  content = content.replace(/(\w+)\(([^)]+)(?!\))\s*$/gm, '$1($2)');

  // 5. Fix malformed arrow function syntax
  // Pattern: => { should have proper closing }
  const lines = content.split('\n');
  const fixedLines = [];
  let openBraces = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Count opening braces
    const openBraceCount = (line.match(/\{/g) || []).length;
    const closeBraceCount = (line.match(/\}/g) || []).length;

    openBraces += openBraceCount - closeBraceCount;

    // If we have unmatched opening braces and this looks like the end of a function
    if (openBraces > 0 && (line.trim() === '' || line.includes('}'))) {
      // Add missing closing braces
      while (openBraces > 0) {
        line += '}';
        openBraces--;
      }
    }

    fixedLines.push(line);
  }

  if (fixedLines.join('\n') !== content) {
    content = fixedLines.join('\n');
    hasChanges = true;
  }

  // 6. Fix specific patterns from error messages
  // Fix: ',' expected errors
  content = content.replace(/(\w+)\s+(\w+)\s*\)/g, '$1, $2)');
  content = content.replace(/(\w+)\s+(\w+)\s+(\w+)\s*\)/g, '$1, $2, $3)');

  // 7. Fix malformed JSX closing tags
  content = content.replace(/<\/([A-Z][a-zA-Z0-9]*)\s+>/g, '</$1>');

  // 8. Fix missing semicolons
  content = content.replace(/(\w+)\s*$/gm, '$1;');

  // 9. Fix malformed object destructuring
  content = content.replace(/\{\s*([^}]+)\s*(?!\})/g, '{ $1 }');

  // 10. Fix malformed array destructuring
  content = content.replace(/\[\s*([^\]]+)\s*(?!\])/g, '[ $1 ]');

  // 11. Fix specific JSX syntax errors
  // Pattern: className={`class ${variable`} should be className={`class ${variable}`}
  content = content.replace(
    /className=\{\`([^`]*)\$\{([^}]+)\`\}/g,
    'className={`$1${$2}`}'
  );

  // 12. Fix malformed event handlers
  // Pattern: onClick={function should be onClick={function}
  content = content.replace(/onClick=\{([^}]+)(?!\})/g, 'onClick={$1}');
  content = content.replace(/onChange=\{([^}]+)(?!\})/g, 'onChange={$1}');

  // 13. Fix missing closing quotes
  content = content.replace(/"([^"]*?)(?!")$/gm, '"$1"');
  content = content.replace(/'([^']*?)(?!')$/gm, "'$1'");

  // 14. Fix malformed import statements
  content = content.replace(/import\s+\{([^}]+)(?!\})/g, 'import { $1 }');

  // 15. Fix malformed export statements
  content = content.replace(/export\s+\{([^}]+)(?!\})/g, 'export { $1 }');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixRemainingSyntaxErrors(
      content,
      filePath
    );

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

    if (
      stat.isDirectory() &&
      !['node_modules', '.next', '.git', 'dist'].includes(item)
    ) {
      getAllTSFiles(fullPath, files);
    } else if (
      stat.isFile() &&
      (item.endsWith('.ts') || item.endsWith('.tsx'))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log('🎯 Fixing remaining syntax errors...\n');

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
      console.log(
        `📊 Progress: ${processedCount}/${allFiles.length} files processed...`
      );
    }
  }

  console.log(`\n📊 Remaining Syntax Fix Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Remaining syntax fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No remaining syntax fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixRemainingSyntaxErrors, fixFile };
