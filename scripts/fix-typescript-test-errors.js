/**
 * TypeScript Test Error Fix Script
 * Identifies and fixes common TypeScript error patterns in test files and API routes
 */

const fs = require('fs');
const path = require('path');

// Common error patterns and their fixes
const errorPatterns = {
  // Testing Library import errors
  testingLibraryImports: {
    pattern: /import \{ render, screen, fireEvent, waitFor \} from '@testing-library\/react';/,
    fix: `import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';`
  },

  // Missing exports from API routes
  missingApiExports: {
    pattern: /import \{ GET, POST, PUT, DELETE \} from '@\/app\/api\/jobs\/route';/,
    fix: `import { GET, POST } from '@/app/api/jobs/route';
// Note: PUT and DELETE are not exported from this route`
  },

  // API function call signature errors (missing context parameter)
  apiCallSignature: {
    pattern: /const response = await (GET|POST|PUT|DELETE)\(req\);/g,
    fix: (match, method) => `const response = await ${method}(req, { params: {} });`
  },

  // Mock factory type mismatches
  mockFactoryTypes: {
    pattern: /prismaMock\.job\.findMany\.mockResolvedValue\(mockJobs\.slice\(0, 10\)\);/,
    fix: `prismaMock.job.findMany.mockResolvedValue(mockJobs.slice(0, 10) as any);`
  },

  // Params object structure for Next.js 15
  paramsStructure: {
    pattern: /\{ params: \{ id: ([^}]+) \} \}/g,
    fix: (match, id) => `{ params: Promise.resolve({ id: ${id} }) }`
  },

  // Missing properties in mock objects
  mockObjectProperties: {
    pattern: /mockFactories\.job\(\)/g,
    fix: `mockFactories.job() as any`
  },

  // Property access on arrays (path.join errors)
  arrayPathJoin: {
    pattern: /\.path\.join\(/g,
    fix: '.join('
  },

  // Missing imports for Node.js modules
  missingNodeImports: {
    fs: 'import * as fs from \'fs\';',
    path: 'import * as path from \'path\';',
    config: 'import { config } from \'dotenv\';'
  }
};

// Files to check and fix
const testFiles = [
  'src/__tests__/components/JobCard.test.tsx',
  'src/__tests__/integration/api/jobs.test.ts',
  'src/__tests__/setup/integration-setup.ts',
  'src/__tests__/setup/test-setup.ts',
  'src/__tests__/utils/test-helpers.tsx'
];

const scriptFiles = [
  'src/scripts/optimizeTasksFile.ts',
  'src/scripts/start-cron-scheduler.ts',
  'src/scripts/test-chatbot.ts',
  'src/scripts/test-instagram-automation.ts',
  'src/scripts/test-onboarding.ts'
];

const utilFiles = [
  'src/utils/modal-accessibility.ts'
];

function fixTestingLibraryImports(content) {
  // Fix @testing-library/react imports
  if (content.includes('screen, fireEvent, waitFor') && content.includes('@testing-library/react')) {
    content = content.replace(
      /import \{ render, screen, fireEvent, waitFor \} from '@testing-library\/react';/,
      `import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';`
    );
  }
  return content;
}

function fixApiRouteImports(content) {
  // Fix missing API route exports
  content = content.replace(
    /import \{ GET, POST, PUT, DELETE \} from '@\/app\/api\/jobs\/route';/,
    `import { GET, POST } from '@/app/api/jobs/route';
// Note: PUT and DELETE are not exported from this route`
  );
  return content;
}

function fixApiCallSignatures(content) {
  // Fix API function calls missing context parameter
  content = content.replace(
    /const response = await (GET|POST|PUT|DELETE)\(req\);/g,
    (match, method) => `const response = await ${method}(req, { params: {} });`
  );
  
  // Fix specific API calls with params
  content = content.replace(
    /await (GetJobById|UpdateJob|DeleteJob)\(req, \{ params: \{ id: ([^}]+) \} \}\);/g,
    (match, method, id) => `await ${method}(req, { params: Promise.resolve({ id: ${id} }) });`
  );
  
  return content;
}

function fixMockTypes(content) {
  // Fix mock factory type mismatches
  content = content.replace(
    /prismaMock\.(job|user)\.(findMany|findUnique|create|update|delete)\.mockResolvedValue\(([^)]+)\);/g,
    (match, model, method, value) => `prismaMock.${model}.${method}.mockResolvedValue(${value} as any);`
  );
  
  // Fix mock factory calls
  content = content.replace(
    /mockFactories\.(job|user)\(\)/g,
    (match, type) => `mockFactories.${type}() as any`
  );
  
  return content;
}

function fixArrayMethods(content) {
  // Fix .path.join() calls on arrays
  content = content.replace(
    /\.path\.join\(/g,
    '.join('
  );
  return content;
}

function fixMissingImports(content, filePath) {
  const lines = content.split('\n');
  const imports = [];
  
  // Check for missing Node.js imports
  if (content.includes('fs.') && !content.includes('import') && !content.includes('fs')) {
    imports.push('import * as fs from \'fs\';');
  }
  
  if (content.includes('path.') && !content.includes('import') && !content.includes('path')) {
    imports.push('import * as path from \'path\';');
  }
  
  if (content.includes('config()') && !content.includes('import') && !content.includes('config')) {
    imports.push('import { config } from \'dotenv\';');
  }
  
  // Add imports at the top
  if (imports.length > 0) {
    const firstImportIndex = lines.findIndex(line => line.startsWith('import'));
    if (firstImportIndex >= 0) {
      lines.splice(firstImportIndex, 0, ...imports, '');
    } else {
      lines.unshift(...imports, '');
    }
    content = lines.join('\n');
  }
  
  return content;
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes based on file type
    if (filePath.includes('test.ts') || filePath.includes('test.tsx')) {
      content = fixTestingLibraryImports(content);
      content = fixApiRouteImports(content);
      content = fixApiCallSignatures(content);
      content = fixMockTypes(content);
    }
    
    if (filePath.includes('scripts/')) {
      content = fixMissingImports(content, filePath);
      content = fixArrayMethods(content);
    }
    
    if (filePath.includes('utils/')) {
      content = fixArrayMethods(content);
    }
    
    // Apply common fixes to all files
    content = fixArrayMethods(content);
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting TypeScript test error fixes...\n');
  
  const allFiles = [...testFiles, ...scriptFiles, ...utilFiles];
  let fixedCount = 0;
  
  for (const file of allFiles) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${allFiles.length}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${allFiles.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 TypeScript test errors have been fixed!');
    console.log('💡 Run "npm run type-check" to verify the fixes.');
  } else {
    console.log('\n✨ All files are already up to date!');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fixTestingLibraryImports,
  fixApiRouteImports,
  fixApiCallSignatures,
  fixMockTypes,
  fixArrayMethods,
  fixMissingImports,
  fixFile
};
