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

function fixImportSyntax(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix broken import syntax patterns

    // Pattern 1: 'use server' in the middle of imports
    content = content.replace(
      /import\s*{\s*\n'use server';\s*\n\n\n\/\/[^}]*}\s*from/g,
      "'use server';\n\nimport {\n  // Fixed import\n} from"
    );

    // Pattern 2: Missing import opening braces
    content = content.replace(
      /import\s*{\s*\n'use server';\s*\n\n\n\/\/\s*Import[^{]*\n\s*([^}]+)\s*}\s*from\s*(['"][^'"]*['"]);\s*\n\n\/\/\s*Import[^{]*\n\s*([^}]+)\s*}\s*from\s*(['"][^'"]*['"])/g,
      "'use server';\n\nimport {\n  $1\n} from $2;\nimport {\n  $3\n} from $4"
    );

    // Pattern 3: Fix specific broken import structure
    if (content.includes("'use server';") && content.includes('// Import')) {
      const lines = content.split('\n');
      const fixedLines = [];
      let inBrokenImport = false;
      let currentImport = [];
      let importFrom = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes("'use server';")) {
          fixedLines.push(line);
          continue;
        }

        if (line.includes('import {') && !line.includes('}')) {
          inBrokenImport = true;
          currentImport = ['import {'];
          continue;
        }

        if (inBrokenImport) {
          if (line.includes('} from')) {
            currentImport.push('  // imports here');
            currentImport.push(line);
            fixedLines.push(currentImport.join('\n'));
            inBrokenImport = false;
            currentImport = [];
            continue;
          } else if (line.trim().startsWith('//')) {
            // Skip comment lines in broken imports
            continue;
          } else if (line.trim() && !line.includes("'use server'")) {
            currentImport.push(`  ${line.trim()},`);
            continue;
          }
        }

        fixedLines.push(line);
      }

      const newContent = fixedLines.join('\n');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    // Fix specific patterns found in the codebase

    // Fix actions files with broken imports
    if (filePath.includes('/actions/')) {
      content = content.replace(
        /import\s*{\s*\n'use server';\s*\n/g,
        "'use server';\n\nimport {\n"
      );

      // Fix missing closing braces in imports
      content = content.replace(
        /import\s*{\s*\n([^}]+)\nfrom\s*(['"][^'"]*['"])/g,
        'import {\n$1\n} from $2'
      );
    }

    // Fix admin pages with broken imports
    if (filePath.includes('/admin/')) {
      content = content.replace(
        /import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/database\/prisma['"];\s*\n([^}]+)\s*}\s*from/g,
        "import { prisma } from '@/lib/database/prisma';\nimport {\n$1\n} from"
      );
    }

    // Remove duplicate 'use server' directives
    const useServerMatches = content.match(/'use server';/g);
    if (useServerMatches && useServerMatches.length > 1) {
      content = content.replace(/'use server';\s*\n/g, '');
      content = "'use server';\n\n" + content;
      modified = true;
    }

    // Clean up malformed import structures
    content = content.replace(
      /import\s*{\s*\n\s*([^}]*)\s*\n\s*}\s*from\s*(['"][^'"]*['"])/g,
      'import {\n  $1\n} from $2'
    );

    // Fix variable redeclaration issues
    content = content.replace(/const clerkUserId = /g, 'const userId = ');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed import syntax: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import syntax issues...\n');

  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');

  let fixedCount = 0;
  let totalCount = allFiles.length;

  allFiles.forEach(filePath => {
    if (fixImportSyntax(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 Import Syntax Fix Summary:`);
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

module.exports = { fixImportSyntax };
