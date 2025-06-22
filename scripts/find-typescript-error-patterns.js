/**
 * TypeScript Error Pattern Detection Script
 * Scans the codebase for common TypeScript error patterns and provides automated fixes
 */

const fs = require('fs');
const path = require('path');

// Error patterns to detect
const errorPatterns = {
  // 1. Testing Library import issues
  testingLibraryImports: {
    pattern: /import \{[^}]*screen[^}]*\} from '@testing-library\/react'/,
    description:
      'Testing Library imports - screen, fireEvent, waitFor should come from @testing-library/dom',
    severity: 'error',
    autoFix: true,
  },

  // 2. Missing API route exports
  missingApiExports: {
    pattern:
      /import \{[^}]*(PUT|DELETE)[^}]*\} from '@\/app\/api\/[^']+\/route'/,
    description: 'Importing non-existent exports from API routes',
    severity: 'error',
    autoFix: true,
  },

  // 3. API function calls missing context parameter
  apiCallMissingContext: {
    pattern: /await (GET|POST|PUT|DELETE)\([^,)]+\);/,
    description: 'API route handlers require both req and context parameters',
    severity: 'error',
    autoFix: true,
  },

  // 4. Mock type mismatches
  mockTypeMismatch: {
    pattern: /mockResolvedValue\([^)]+\);/,
    description: 'Mock return values may not match expected types',
    severity: 'warning',
    autoFix: true,
  },

  // 5. Array method confusion (.path.join)
  arrayMethodError: {
    pattern: /\.path\.join\(/,
    description: 'Incorrect use of .path.join() on arrays - should be .join()',
    severity: 'error',
    autoFix: true,
  },

  // 6. Missing Node.js imports
  missingNodeImports: {
    pattern: /(^|\s)(fs|path|config)\./,
    description: 'Using Node.js modules without proper imports',
    severity: 'error',
    autoFix: true,
  },

  // 7. Next.js 15 params structure
  nextjs15Params: {
    pattern: /\{ params: \{ [^}]+ \} \}/,
    description:
      'Next.js 15 requires params to be Promise<T> in route handlers',
    severity: 'error',
    autoFix: true,
  },

  // 8. Prisma type mismatches
  prismaTypeMismatch: {
    pattern: /prisma\.[a-zA-Z]+\.(create|update|findMany|findUnique)\(/,
    description: 'Potential Prisma type mismatches',
    severity: 'warning',
    autoFix: false,
  },

  // 9. React import issues
  reactImportIssues: {
    pattern: /import \{ React, \{/,
    description: 'Malformed React imports',
    severity: 'error',
    autoFix: true,
  },

  // 10. Component import path issues
  componentImportPaths: {
    pattern: /import \{[^}]+\} from '@\/components\/ui\/[^']+'/,
    description: 'Potential incorrect component import paths',
    severity: 'warning',
    autoFix: false,
  },
};

// File extensions to scan
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to scan
const scanDirectories = [
  'src/__tests__',
  'src/app',
  'src/components',
  'src/lib',
  'src/scripts',
  'src/utils',
  'src/hooks',
];

// Directories to exclude
const excludeDirectories = ['node_modules', '.next', '.git', 'dist', 'build'];

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirectories.includes(item)) {
        scanDirectory(fullPath, results);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (fileExtensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    for (const [patternName, config] of Object.entries(errorPatterns)) {
      const matches = content.match(config.pattern);
      if (matches) {
        issues.push({
          pattern: patternName,
          description: config.description,
          severity: config.severity,
          autoFix: config.autoFix,
          matches: matches.length,
          file: filePath,
        });
      }
    }

    return issues;
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return [];
  }
}

function generateReport(allIssues) {
  const report = {
    summary: {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0,
      autoFixableCount: 0,
    },
    byPattern: {},
    byFile: {},
    recommendations: [],
  };

  // Group issues by pattern and file
  for (const issue of allIssues) {
    report.summary.totalIssues++;

    if (issue.severity === 'error') {
      report.summary.errorCount++;
    } else {
      report.summary.warningCount++;
    }

    if (issue.autoFix) {
      report.summary.autoFixableCount++;
    }

    // Group by pattern
    if (!report.byPattern[issue.pattern]) {
      report.byPattern[issue.pattern] = {
        description: issue.description,
        severity: issue.severity,
        autoFix: issue.autoFix,
        files: [],
        totalMatches: 0,
      };
    }
    report.byPattern[issue.pattern].files.push(issue.file);
    report.byPattern[issue.pattern].totalMatches += issue.matches;

    // Group by file
    if (!report.byFile[issue.file]) {
      report.byFile[issue.file] = [];
    }
    report.byFile[issue.file].push(issue);
  }

  report.summary.filesWithIssues = Object.keys(report.byFile).length;

  // Generate recommendations
  if (report.byPattern.testingLibraryImports) {
    report.recommendations.push({
      priority: 'high',
      action:
        'Run the fix-typescript-test-errors.js script to fix Testing Library imports',
      command: 'node scripts/fix-typescript-test-errors.js',
    });
  }

  if (report.byPattern.apiCallMissingContext) {
    report.recommendations.push({
      priority: 'high',
      action:
        'Update API route calls to include context parameter for Next.js 15 compatibility',
      command: 'node scripts/fix-typescript-test-errors.js',
    });
  }

  if (report.byPattern.arrayMethodError) {
    report.recommendations.push({
      priority: 'medium',
      action: 'Fix .path.join() calls on arrays - should be .join()',
      command: 'node scripts/fix-typescript-test-errors.js',
    });
  }

  return report;
}

function printReport(report) {
  console.log('🔍 TypeScript Error Pattern Analysis Report\n');

  // Summary
  console.log('📊 Summary:');
  console.log(`   Total files scanned: ${report.summary.totalFiles}`);
  console.log(`   Files with issues: ${report.summary.filesWithIssues}`);
  console.log(`   Total issues found: ${report.summary.totalIssues}`);
  console.log(`   Errors: ${report.summary.errorCount}`);
  console.log(`   Warnings: ${report.summary.warningCount}`);
  console.log(`   Auto-fixable: ${report.summary.autoFixableCount}\n`);

  // Issues by pattern
  if (Object.keys(report.byPattern).length > 0) {
    console.log('🔧 Issues by Pattern:');
    for (const [pattern, data] of Object.entries(report.byPattern)) {
      const icon = data.severity === 'error' ? '❌' : '⚠️';
      const fixable = data.autoFix ? '🔧' : '🔍';
      console.log(
        `   ${icon} ${fixable} ${pattern}: ${data.totalMatches} matches in ${data.files.length} files`
      );
      console.log(`      ${data.description}`);
    }
    console.log('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    for (const rec of report.recommendations) {
      const priorityIcon = rec.priority === 'high' ? '🔥' : '📝';
      console.log(`   ${priorityIcon} ${rec.action}`);
      if (rec.command) {
        console.log(`      Command: ${rec.command}`);
      }
    }
    console.log('');
  }

  // Files with most issues
  const filesByIssueCount = Object.entries(report.byFile)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

  if (filesByIssueCount.length > 0) {
    console.log('📁 Files with most issues:');
    for (const [file, issues] of filesByIssueCount) {
      console.log(`   ${issues.length} issues: ${file}`);
    }
  }
}

function main() {
  console.log('🔍 Scanning codebase for TypeScript error patterns...\n');

  let allFiles = [];
  for (const dir of scanDirectories) {
    const files = scanDirectory(dir);
    allFiles = allFiles.concat(files);
  }

  console.log(
    `Found ${allFiles.length} TypeScript/JavaScript files to analyze...\n`
  );

  const allIssues = [];
  for (const file of allFiles) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  const report = generateReport(allIssues);
  report.summary.totalFiles = allFiles.length;

  printReport(report);

  // Save detailed report to file
  const reportPath = 'typescript-error-analysis.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return report;
}

if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  analyzeFile,
  generateReport,
  errorPatterns,
};
