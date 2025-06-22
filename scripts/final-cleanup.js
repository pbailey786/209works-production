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

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix missing prisma imports
    if (content.includes('prisma.') && !content.includes('import { prisma }')) {
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' || lines[i].trim().startsWith('//')) {
          continue;
        } else {
          break;
        }
      }

      lines.splice(
        insertIndex,
        0,
        "import { prisma } from '@/lib/database/prisma';"
      );
      content = lines.join('\n');
      modified = true;
    }

    // Fix duplicate redirect imports
    content = content.replace(
      /import\s*{\s*([^}]*),?\s*redirect\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"];\s*\nimport\s*{\s*redirect\s*}\s*from\s*['"]next\/navigation['"];?/g,
      "import { $1 redirect $2 } from 'next/navigation';"
    );

    // Fix variable redeclaration issues
    const lines = content.split('\n');
    const variableDeclarations = new Map();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for const variable declarations
      const match = line.match(/^\s*const\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];

        if (variableDeclarations.has(varName)) {
          // This is a redeclaration, rename it
          if (varName === 'user') {
            lines[i] = line.replace(/const\s+user\s*=/, 'const dbUser =');
            modified = true;
          } else if (varName === 'userId') {
            lines[i] = line.replace(
              /const\s+userId\s*=/,
              'const clerkUserId ='
            );
            modified = true;
          }
        } else {
          variableDeclarations.set(varName, i);
        }
      }
    }

    if (modified) {
      content = lines.join('\n');
    }

    // Fix missing user variable definitions in actions
    if (
      filePath.includes('/actions/') &&
      content.includes('userId') &&
      !content.includes('const { userId }')
    ) {
      content = content.replace(
        /^(\s*'use server';?\s*\n)/m,
        "$1\nimport { auth } from '@clerk/nextjs/server';\n"
      );

      // Add userId extraction at the beginning of functions that use it
      content = content.replace(
        /(export\s+async\s+function\s+\w+[^{]*{\s*)/g,
        '$1\n  const { userId } = await auth();\n'
      );

      modified = true;
    }

    // Fix user variable issues in API routes
    if (
      filePath.includes('/api/') &&
      content.includes('user?.') &&
      !content.includes('const user =')
    ) {
      // Add user lookup after auth
      content = content.replace(
        /(const\s*{\s*userId\s*}\s*=\s*await\s+auth\(\);?\s*\n)/,
        '$1\n  const user = await prisma.user.findUnique({\n    where: { clerkId: userId! },\n  });\n'
      );

      modified = true;
    }

    // Fix Session type references
    content = content.replace(/import.*Session.*from.*next-auth.*\n?/g, '');
    content = content.replace(/:\s*Session\s*\|\s*null/g, '');
    content = content.replace(/as\s+Session\s*\|\s*null/g, '');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting final cleanup...\n');

  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');

  let fixedCount = 0;
  let totalCount = allFiles.length;

  allFiles.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 Final Cleanup Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);

  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Run npm run type-check');
    console.log('   3. Test the application');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
