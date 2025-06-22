#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common import fixes
const importFixes = [
  // React imports
  {
    pattern: /React\.useRef/g,
    replacement: 'useRef',
    addImport: 'import { useRef } from "react";',
  },
  {
    pattern: /React\.useCallback/g,
    replacement: 'useCallback',
    addImport: 'import { useCallback } from "react";',
  },
  {
    pattern: /React\.useEffect/g,
    replacement: 'useEffect',
    addImport: 'import { useEffect } from "react";',
  },
  {
    pattern: /React\.useState/g,
    replacement: 'useState',
    addImport: 'import { useState } from "react";',
  },

  // Node.js built-ins
  {
    pattern: /(?<!import.*)\bfs\./g,
    replacement: 'fs.',
    addImport: 'import fs from "fs";',
  },
  {
    pattern: /(?<!import.*)\bpath\./g,
    replacement: 'path.',
    addImport: 'import path from "path";',
  },
  {
    pattern: /\breadFileSync\(/g,
    replacement: 'fs.readFileSync(',
    addImport: 'import fs from "fs";',
  },
  {
    pattern: /\bwriteFileSync\(/g,
    replacement: 'fs.writeFileSync(',
    addImport: 'import fs from "fs";',
  },
  {
    pattern: /\bexistsSync\(/g,
    replacement: 'fs.existsSync(',
    addImport: 'import fs from "fs";',
  },
  {
    pattern: /\bmkdirSync\(/g,
    replacement: 'fs.mkdirSync(',
    addImport: 'import fs from "fs";',
  },
  {
    pattern: /\bjoin\(/g,
    replacement: 'path.join(',
    addImport: 'import path from "path";',
  },

  // Cron imports
  {
    pattern: /\bcron\./g,
    replacement: 'cron.',
    addImport: 'import cron from "node-cron";',
  },
  {
    pattern: /\bcronScheduler\./g,
    replacement: 'cronScheduler.',
    addImport: 'import { cronScheduler } from "@/lib/services/cron-scheduler";',
  },

  // Config imports
  {
    pattern: /import\s*{\s*config\s*}\s*from\s*['"]dotenv\/config['"];?/g,
    replacement: 'import "dotenv/config";',
  },
  {
    pattern: /import\s*{\s*cron\s*}\s*from\s*['"]node-cron['"];?/g,
    replacement: 'import cron from "node-cron";',
  },
];

function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const addedImports = new Set();

    for (const fix of importFixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);

        // Add import if needed and not already present
        if (
          fix.addImport &&
          !content.includes(fix.addImport) &&
          !addedImports.has(fix.addImport)
        ) {
          // Find the last import statement
          const importLines = content.split('\n');
          let lastImportIndex = -1;

          for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].trim().startsWith('import ')) {
              lastImportIndex = i;
            }
          }

          if (lastImportIndex >= 0) {
            importLines.splice(lastImportIndex + 1, 0, fix.addImport);
            content = importLines.join('\n');
            addedImports.add(fix.addImport);
          }
        }

        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files
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

// Main execution
console.log('🔧 Fixing remaining import issues...\n');

const allFiles = getAllTsFiles('src');
let fixedCount = 0;

for (const file of allFiles) {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed imports in ${fixedCount} files!`);
