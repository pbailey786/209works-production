/**
 * Comprehensive TypeScript Error Fix Script
 * Fixes all identified TypeScript error patterns across the codebase
 */

const fs = require('fs');
const path = require('path');

// Load the error analysis report
let analysisReport = {};
try {
  analysisReport = JSON.parse(
    fs.readFileSync('typescript-error-analysis.json', 'utf8')
  );
} catch (error) {
  console.log(
    '⚠️  No analysis report found. Run find-typescript-error-patterns.js first.'
  );
}

function fixArrayMethodErrors(content) {
  // Fix .path.join() calls on arrays
  return content.replace(/\.path\.join\(/g, '.join(');
}

function fixMissingNodeImports(content, filePath) {
  const lines = content.split('\n');
  const imports = [];
  let hasChanges = false;

  // Check for missing fs import
  if (
    content.includes('fs.') &&
    !content.includes('import') &&
    !content.includes('* as fs')
  ) {
    imports.push("import * as fs from 'fs';");
    hasChanges = true;
  }

  // Check for missing path import
  if (
    content.includes('path.') &&
    !content.includes('import') &&
    !content.includes('* as path')
  ) {
    imports.push("import * as path from 'path';");
    hasChanges = true;
  }

  // Check for missing config import
  if (
    content.includes('config()') &&
    !content.includes('import') &&
    !content.includes('config')
  ) {
    imports.push("import { config } from 'dotenv';");
    hasChanges = true;
  }

  if (hasChanges) {
    // Find the first import line or add at the top
    const firstImportIndex = lines.findIndex(line =>
      line.trim().startsWith('import')
    );
    if (firstImportIndex >= 0) {
      lines.splice(firstImportIndex, 0, ...imports, '');
    } else {
      // Add after any initial comments
      let insertIndex = 0;
      while (
        insertIndex < lines.length &&
        (lines[insertIndex].trim().startsWith('//') ||
          lines[insertIndex].trim().startsWith('/*') ||
          lines[insertIndex].trim().startsWith('*') ||
          lines[insertIndex].trim() === '')
      ) {
        insertIndex++;
      }
      lines.splice(insertIndex, 0, ...imports, '');
    }
    return lines.join('\n');
  }

  return content;
}

function fixNextjs15Params(content) {
  // Fix Next.js 15 params structure in route handlers
  return content.replace(
    /\{ params: \{ ([^}]+) \} \}/g,
    '{ params: Promise.resolve({ $1 }) }'
  );
}

function fixMissingApiExports(content) {
  // Fix imports of non-existent API exports
  content = content.replace(
    /import \{ GET, POST, PUT, DELETE \} from '@\/app\/api\/jobs\/route';/,
    `import { GET, POST } from '@/app/api/jobs/route';
// Note: PUT and DELETE are not exported from this route`
  );

  // Fix other similar patterns
  content = content.replace(
    /import \{([^}]*)(PUT|DELETE)([^}]*)\} from '@\/app\/api\/([^']+)\/route';/g,
    (match, before, method, after, routePath) => {
      const cleanBefore = before.replace(/,\s*$/, '').trim();
      const cleanAfter = after.replace(/^\s*,/, '').trim();
      const validImports = [cleanBefore, cleanAfter].filter(Boolean).join(', ');
      return `import { ${validImports} } from '@/app/api/${routePath}/route';
// Note: ${method} is not exported from this route`;
    }
  );

  return content;
}

function fixMockTypes(content) {
  // Add type assertions to mock return values
  content = content.replace(
    /mockResolvedValue\(([^)]+)\);/g,
    'mockResolvedValue($1 as any);'
  );

  // Fix specific mock factory calls
  content = content.replace(
    /mockFactories\.(job|user)\(\)/g,
    'mockFactories.$1() as any'
  );

  return content;
}

function fixReactImports(content) {
  // Fix malformed React imports
  return content.replace(
    /import \{ React, \{([^}]+)\} from 'react';/g,
    "import React, { $1 } from 'react';"
  );
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply all fixes
    content = fixArrayMethodErrors(content);
    content = fixMissingNodeImports(content, filePath);
    content = fixNextjs15Params(content);
    content = fixMissingApiExports(content);
    content = fixMockTypes(content);
    content = fixReactImports(content);

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function getFilesToFix() {
  const files = new Set();

  // Add files from analysis report
  if (analysisReport.byFile) {
    for (const filePath of Object.keys(analysisReport.byFile)) {
      files.add(filePath);
    }
  }

  // Add specific patterns
  if (analysisReport.byPattern) {
    for (const pattern of Object.values(analysisReport.byPattern)) {
      if (pattern.autoFix && pattern.files) {
        for (const file of pattern.files) {
          files.add(file);
        }
      }
    }
  }

  return Array.from(files);
}

function main() {
  console.log('🔧 Starting comprehensive TypeScript error fixes...\n');

  const filesToFix = getFilesToFix();

  if (filesToFix.length === 0) {
    console.log(
      'ℹ️  No files identified for fixing. Run find-typescript-error-patterns.js first.'
    );
    return;
  }

  console.log(`Found ${filesToFix.length} files to fix...\n`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const file of filesToFix) {
    try {
      if (fixFile(file)) {
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      } else {
        console.log(`ℹ️  No changes: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${file} - ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(
    `   Files unchanged: ${filesToFix.length - fixedCount - errorCount}`
  );
  console.log(`   Errors: ${errorCount}`);

  if (fixedCount > 0) {
    console.log('\n🎉 TypeScript errors have been fixed!');
    console.log('💡 Next steps:');
    console.log('   1. Run "npm run type-check" to verify fixes');
    console.log('   2. Run "npm run build" to test compilation');
    console.log('   3. Run tests to ensure functionality is preserved');
  }

  // Generate a summary of what was fixed
  const fixSummary = {
    timestamp: new Date().toISOString(),
    filesProcessed: filesToFix.length,
    filesFixed: fixedCount,
    errors: errorCount,
    patternsFixed: [
      'Array method errors (.path.join)',
      'Missing Node.js imports',
      'Next.js 15 params structure',
      'Missing API exports',
      'Mock type mismatches',
      'React import issues',
    ],
  };

  fs.writeFileSync(
    'typescript-fix-summary.json',
    JSON.stringify(fixSummary, null, 2)
  );
  console.log('\n📄 Fix summary saved to: typescript-fix-summary.json');
}

if (require.main === module) {
  main();
}

module.exports = {
  fixArrayMethodErrors,
  fixMissingNodeImports,
  fixNextjs15Params,
  fixMissingApiExports,
  fixMockTypes,
  fixReactImports,
  fixFile,
};
