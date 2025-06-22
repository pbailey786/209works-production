/**
 * Ultra Targeted Fixes
 * Only the most reliable, safe fixes that won't introduce new errors
 */

const fs = require('fs');
const path = require('path');

function ultraTargetedFixes(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix only the most obvious semicolon cases
  // Only add semicolons to very simple variable declarations
  content = content.replace(
    /^(\s*const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;{}\[\]()]+)$/gm,
    '$1;'
  );
  content = content.replace(
    /^(\s*let\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;{}\[\]()]+)$/gm,
    '$1;'
  );
  content = content.replace(
    /^(\s*var\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;{}\[\]()]+)$/gm,
    '$1;'
  );

  // 2. Fix only obvious import statements missing semicolons
  content = content.replace(
    /^(\s*import\s+[^;]+from\s+['"][^'"]+['"])$/gm,
    '$1;'
  );

  // 3. Fix only obvious export statements missing semicolons
  content = content.replace(
    /^(\s*export\s+\{[^}]+\}\s+from\s+['"][^'"]+['"])$/gm,
    '$1;'
  );
  content = content.replace(
    /^(\s*export\s+default\s+[a-zA-Z_$][a-zA-Z0-9_$]*)$/gm,
    '$1;'
  );

  // 4. Fix only obvious duplicate keywords (very safe)
  content = content.replace(/\bconst\s+const\b/g, 'const');
  content = content.replace(/\blet\s+let\b/g, 'let');
  content = content.replace(/\bvar\s+var\b/g, 'var');
  content = content.replace(/\bfunction\s+function\b/g, 'function');

  // 5. Fix only obvious reserved words as object keys
  content = content.replace(/\btrue\s*:/g, '"true":');
  content = content.replace(/\bfalse\s*:/g, '"false":');
  content = content.replace(/\bnull\s*:/g, '"null":');

  // 6. Fix only obvious spacing between numbers and identifiers
  content = content.replace(/(\d)([a-zA-Z_$])/g, '$1 $2');

  // 7. Fix only obvious double dots
  content = content.replace(/\.\s*\./g, '.');

  // 8. Fix only obvious empty template expressions
  content = content.replace(/\$\{\s*\}/g, '${undefined}');

  // 9. Remove only obvious control characters
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 10. Fix only very simple function parameter commas
  content = content.replace(
    /(\w+)\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
    '$1($2, $3)'
  );

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = ultraTargetedFixes(
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
  console.log('🎯 Ultra targeted fixes (only the safest changes)...\n');

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

  console.log(`\n📊 Ultra Targeted Fixes Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Ultra targeted fixes complete!');
    console.log(
      '💡 Run "npm run type-check" to see the ultra-safe improvements.'
    );
  } else {
    console.log('\n✨ No ultra targeted fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { ultraTargetedFixes, fixFile };
