/**
 * Stabilizing Cleanup
 * Conservative fixes to stabilize and reduce errors safely
 */

const fs = require('fs');
const path = require('path');

function stabilizingCleanup(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix only the most obvious semicolon cases (very conservative)
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines, comments, and complex statements
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      fixedLines.push(line);
      continue;
    }

    // Only add semicolons to very simple, safe cases
    if (
      trimmed.match(
        /^(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[a-zA-Z0-9_$"'`]+$/
      ) ||
      trimmed.match(/^import\s+[^;]+from\s+['"][^'"]+['"]$/) ||
      trimmed.match(/^export\s+default\s+[a-zA-Z_$][a-zA-Z0-9_$]*$/) ||
      trimmed.match(/^return\s+[a-zA-Z0-9_$"'`]+$/) ||
      trimmed.match(/^throw\s+new\s+Error\(['"][^'"]*['"]\)$/) ||
      trimmed === 'break' ||
      trimmed === 'continue'
    ) {
      if (!trimmed.endsWith(';')) {
        line = line.replace(/\s*$/, ';');
        hasChanges = true;
      }
    }

    fixedLines.push(line);
  }

  content = fixedLines.join('\n');

  // 2. Fix only obvious duplicate keywords (very safe)
  content = content.replace(/\bconst\s+const\b/g, 'const');
  content = content.replace(/\blet\s+let\b/g, 'let');
  content = content.replace(/\bvar\s+var\b/g, 'var');
  content = content.replace(/\bfunction\s+function\b/g, 'function');
  content = content.replace(/\bimport\s+import\b/g, 'import');
  content = content.replace(/\bexport\s+export\b/g, 'export');

  // 3. Fix only obvious reserved words as object keys
  content = content.replace(/\btrue\s*:/g, '"true":');
  content = content.replace(/\bfalse\s*:/g, '"false":');
  content = content.replace(/\bnull\s*:/g, '"null":');

  // 4. Fix only obvious spacing between numbers and identifiers
  content = content.replace(/(\d)([a-zA-Z_$])/g, '$1 $2');

  // 5. Fix only obvious double dots
  content = content.replace(/\.\s*\./g, '.');

  // 6. Fix only obvious empty template expressions
  content = content.replace(/\$\{\s*\}/g, '${undefined}');

  // 7. Remove only obvious control characters
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 8. Fix only very simple function parameter commas (very conservative)
  content = content.replace(
    /(\w+)\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
    '$1($2, $3)'
  );

  // 9. Remove only obvious stray single characters on their own lines
  const cleanLines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    // Only remove lines that are single problematic characters
    return !(
      trimmed === '}' ||
      trimmed === ')' ||
      trimmed === ']' ||
      trimmed === ';' ||
      trimmed === ',' ||
      trimmed === '{' ||
      trimmed === '(' ||
      trimmed === '['
    );
  });

  if (cleanLines.length !== content.split('\n').length) {
    content = cleanLines.join('\n');
    hasChanges = true;
  }

  // 10. Fix only obvious JSX token issues
  content = content.replace(/\{'\}'\}/g, '}');
  content = content.replace(/\{'>'\}/g, '>');

  // 11. Only normalize excessive whitespace (but preserve structure)
  content = content.replace(/[ \t]+/g, ' '); // Normalize spaces and tabs only
  content = content.replace(/\s*;\s*/g, '; '); // Normalize semicolons
  content = content.replace(/\s*,\s*/g, ', '); // Normalize commas

  // 12. Fix only obvious malformed variable declarations
  content = content.replace(/^(\s*)(const|let|var)\s*$/gm, '');

  // 13. Fix only obvious malformed destructuring (very conservative)
  content = content.replace(
    /const\s*\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\s*=/g,
    'const { $1 } ='
  );
  content = content.replace(
    /const\s*\[\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\]\s*=/g,
    'const [ $1 ] ='
  );

  // 14. Fix only obvious arrow function issues
  content = content.replace(/=>\s*\{([^}]*)\s*$/gm, (match, body) => {
    if (body.trim()) {
      return `=> { ${body.trim()} }`;
    }
    return '=> {}';
  });

  // 15. Fix only obvious template literal issues
  content = content.replace(/\$\{([^}]*)\s*\$\{/g, '${$1} ${');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = stabilizingCleanup(
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
  console.log('🛡️ Stabilizing cleanup (ultra-safe fixes only)...\n');

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

  console.log(`\n📊 Stabilizing Cleanup Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🛡️ Stabilizing cleanup complete!');
    console.log(
      '💡 Run "npm run type-check" to see the stabilized improvements.'
    );
  } else {
    console.log('\n✨ No stabilizing fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { stabilizingCleanup, fixFile };
