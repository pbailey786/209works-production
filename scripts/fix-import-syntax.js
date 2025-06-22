#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with broken import syntax
const brokenFiles = [
  'src/app/admin/advanced-analytics/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/api/ads/[id]/route.ts',
  'src/app/api/ads/route.ts',
  'src/app/api/ads/stats/route.ts',
  'src/app/api/alerts/[id]/route.ts',
  'src/app/api/alerts/[id]/test/route.ts',
  'src/app/api/chat-job-search/route.ts',
  'src/app/api/jobs/route.ts',
  'src/app/api/llm-job-search/route.ts',
  'src/app/api/search/autocomplete/route.ts',
  'src/app/api/search/location/route.ts',
  'src/app/api/search/suggestions/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/lib/cache/enhanced-cache-services.ts',
  'src/lib/cache/services.ts',
  'src/lib/conversation/chatbot-service.ts',
  'src/lib/knowledge/company-knowledge.ts',
  'src/lib/performance/db-optimization.ts',
  'src/lib/search/job-matching.ts',
  'src/lib/search/services.ts',
  'src/lib/services/email-queue.ts',
];

function fixImportSyntax(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix broken import syntax where prisma import was inserted in the middle of another import
    // Pattern: import {\nimport { prisma } from '@/lib/database/prisma';\n  Card,
    content = content.replace(
      /import\s*{\s*\nimport\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/database\/prisma['"];\s*\n/g,
      "import { prisma } from '@/lib/database/prisma';\nimport {\n"
    );

    // Fix cases where the import was inserted at the beginning of a line
    content = content.replace(
      /^import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/database\/prisma['"];\s*\n(\s*[A-Z])/gm,
      "import { prisma } from '@/lib/database/prisma';\n\n$1"
    );

    // Fix cases where there's a broken import structure
    content = content.replace(
      /import\s*{\s*\nimport\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/database\/prisma['"];\s*\n(\s*\w+)/g,
      "import { prisma } from '@/lib/database/prisma';\nimport {\n  $1"
    );

    // Fix specific pattern in the files
    content = content.replace(
      /import\s*{\s*\nimport\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/database\/prisma['"];\s*\n(\s*[^}]+)\s*}\s*from/g,
      "import { prisma } from '@/lib/database/prisma';\nimport {\n$1\n} from"
    );

    // Clean up any duplicate prisma imports
    const lines = content.split('\n');
    const cleanedLines = [];
    let seenPrismaImport = false;

    for (const line of lines) {
      if (line.includes("import { prisma } from '@/lib/database/prisma'")) {
        if (!seenPrismaImport) {
          cleanedLines.push(line);
          seenPrismaImport = true;
        }
        // Skip duplicate prisma imports
      } else {
        cleanedLines.push(line);
      }
    }

    const newContent = cleanedLines.join('\n');

    if (newContent !== content) {
      modified = true;
      content = newContent;
    }

    // Additional cleanup for specific syntax errors
    content = content.replace(/import\s*{\s*\n\s*import/g, 'import');
    content = content.replace(
      /;\s*\n\s*import\s*{\s*\n\s*([A-Z])/g,
      ';\nimport {\n  $1'
    );

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed import syntax: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import syntax errors...\n');

  let fixedCount = 0;
  let totalCount = brokenFiles.length;

  brokenFiles.forEach(filePath => {
    if (fixImportSyntax(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 Import Fix Summary:`);
  console.log(`   Fixed: ${fixedCount}/${totalCount} files`);
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
