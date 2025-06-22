#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all TypeScript files in the project
function getAllTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith('.') &&
      item !== 'node_modules'
    ) {
      getAllTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixBrokenImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix pattern: "// Import comment\n  item1,\n  item2\n} from 'module';"
    // Should be: "// Import comment\nimport {\n  item1,\n  item2\n} from 'module';"
    content = content.replace(
      /(\/\/[^\n]*\n)\s*([A-Za-z_][A-Za-z0-9_]*,?\s*\n(?:\s*[A-Za-z_][A-Za-z0-9_]*,?\s*\n)*)\s*}\s*from\s*(['"][^'"]*['"];?)/g,
      '$1import {\n  $2\n} from $3'
    );

    // Fix missing 'import {' at the beginning of import statements
    content = content.replace(
      /^(\s*)(\/\/[^\n]*\n)\s*([A-Za-z_][A-Za-z0-9_]*(?:,\s*\n\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*}\s*from\s*(['"][^'"]*['"];?)/gm,
      '$1$2import {\n  $3\n} from $4'
    );

    // Fix imports that are missing the opening 'import {'
    const lines = content.split('\n');
    const fixedLines = [];
    let inBrokenImport = false;
    let importItems = [];
    let importComment = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this is a comment followed by import items
      if (trimmed.startsWith('//') && trimmed.includes('Import')) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().match(/^[A-Za-z_][A-Za-z0-9_]*,?$/)) {
          importComment = line;
          inBrokenImport = true;
          importItems = [];
          continue;
        }
      }

      if (inBrokenImport) {
        if (trimmed.match(/^[A-Za-z_][A-Za-z0-9_]*,?$/)) {
          // This is an import item
          importItems.push(trimmed.replace(/,$/, ''));
          continue;
        } else if (trimmed.match(/^}\s*from\s*['"][^'"]*['"];?$/)) {
          // End of import
          const fromPart = trimmed;
          fixedLines.push(importComment);
          fixedLines.push('import {');
          importItems.forEach((item, index) => {
            const comma = index < importItems.length - 1 ? ',' : '';
            fixedLines.push(`  ${item}${comma}`);
          });
          fixedLines.push(`} ${fromPart.substring(1)}`);
          inBrokenImport = false;
          importItems = [];
          importComment = '';
          modified = true;
          continue;
        } else {
          // Something unexpected, abort this import fix
          fixedLines.push(importComment);
          fixedLines.push(...importItems.map(item => `  ${item}`));
          fixedLines.push(line);
          inBrokenImport = false;
          importItems = [];
          importComment = '';
          continue;
        }
      }

      fixedLines.push(line);
    }

    if (modified) {
      content = fixedLines.join('\n');
    }

    // Additional fixes for common patterns

    // Fix missing commas in import lists
    content = content.replace(
      /import\s*{\s*\n(\s*[A-Za-z_][A-Za-z0-9_]*)\s*\n(\s*[A-Za-z_][A-Za-z0-9_]*)/g,
      'import {\n$1,\n$2'
    );

    // Fix trailing items without commas
    content = content.replace(
      /(\s+[A-Za-z_][A-Za-z0-9_]*)\s*\n\s*}\s*from/g,
      '$1,\n} from'
    );

    // Remove extra commas
    content = content.replace(/,\s*,/g, ',');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed broken imports: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing broken import statements...\n');

  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');

  let fixedCount = 0;
  let totalCount = allFiles.length;

  allFiles.forEach(filePath => {
    if (fixBrokenImports(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 Broken Import Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);

  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run type-check');
    console.log('   2. Verify the fixes worked');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixBrokenImports };
