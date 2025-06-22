#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to convert kebab-case to camelCase
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Function to convert kebab-case to PascalCase
function kebabToPascalCase(str) {
  return str.replace(/(^|-)([a-z])/g, (match, dash, letter) => letter.toUpperCase());
}

// Get all files that need fixing based on the error output
const filesToFix = [
  'src/hooks/use-toast.ts',
  'src/lib/agents/email-agent.ts',
  'src/lib/ai/advanced-recommendation-engine.ts',
  'src/lib/ai/career-transition-analytics.ts',
  'src/lib/ai/enhanced-jobsgpt.ts',
  'src/lib/ai/predictive-analytics.ts',
  'src/lib/ai/resume-intelligence.ts',
  'src/lib/ai/semantic-search.ts',
  'src/lib/analytics/advanced-analytics.ts',
  'src/lib/analytics/analytics-middleware.ts',
  'src/lib/analytics/business-metrics.ts',
  'src/lib/analytics/comprehensive-analytics.ts',
  'src/lib/analytics/funnel-analysis.ts',
  'src/lib/analytics/google-analytics.ts',
  'src/lib/analytics/job-board-analytics.ts',
  'src/lib/analytics/posthog-provider.tsx',
  'src/lib/analytics/session-tracker.ts',
  'src/lib/api/platform-manager.ts',
  'src/lib/auth/env-checker.ts',
  'src/lib/auth/password-reset-service.ts',
  'src/lib/auth/security-utils.ts',
  'src/lib/auth/url-fix.ts',
  'src/lib/backup/database-backup.ts',
  'src/lib/cache/atomic-cache-manager.ts',
  'src/lib/cache/cache-migration-utility.ts',
  'src/lib/cache/enhanced-cache-services.ts',
  'src/lib/compliance/gdpr-compliance.ts',
  'src/lib/conversation-memory.ts',
  'src/lib/conversation/chatbot-service.ts',
  'src/lib/conversation/local-knowledge.ts',
  'src/lib/database/data-integrity.ts',
  'src/lib/database/optimized-queries.ts',
  'src/lib/database/prisma-with-timeout.ts',
  'src/lib/database/type-safety.ts',
  'src/lib/database/validation-middleware.ts'
];

function fixFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    const isReactComponent = filePath.endsWith('.tsx');
    
    // Convert kebab-case names to valid JavaScript identifiers
    const camelCaseName = kebabToCamelCase(fileName);
    const pascalCaseName = kebabToPascalCase(fileName);
    
    let newContent = content;
    
    // Fix variable/function names with hyphens
    newContent = newContent.replace(new RegExp(`\\b${fileName}\\b`, 'g'), camelCaseName);
    
    // Fix interface names for React components
    if (isReactComponent) {
      newContent = newContent.replace(
        new RegExp(`interface ${fileName}Props`, 'g'),
        `interface ${pascalCaseName}Props`
      );
      newContent = newContent.replace(
        new RegExp(`export function ${fileName}`, 'g'),
        `export function ${pascalCaseName}`
      );
    }
    
    // Fix export statements
    newContent = newContent.replace(
      new RegExp(`export const ${fileName}`, 'g'),
      `export const ${camelCaseName}`
    );
    newContent = newContent.replace(
      new RegExp(`export function ${fileName}`, 'g'),
      `export function ${camelCaseName}`
    );
    newContent = newContent.replace(
      new RegExp(`export default ${fileName}`, 'g'),
      `export default ${camelCaseName}`
    );
    
    return newContent;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

let fixedCount = 0;

console.log('Fixing naming errors...');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const fixedContent = fixFileContent(filePath);
    if (fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed: ${filePath}`);
      fixedCount++;
    }
  } else {
    console.log(`Not found: ${filePath}`);
  }
});

console.log(`\nFixed ${fixedCount} files with naming errors.`);
