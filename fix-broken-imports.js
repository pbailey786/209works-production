#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixBrokenImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix broken import statements where imports were inserted in the middle
    const brokenImportPatterns = [
      // Pattern: import {\nimport something from "somewhere";\n  actualImport
      /import\s*{\s*\nimport\s+([^;]+);\s*\n\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"];?/g,
      
      // Pattern: import {\nimport something from "somewhere";\n
      /import\s*{\s*\nimport\s+([^;]+);\s*\n/g,
    ];

    for (const pattern of brokenImportPatterns) {
      if (pattern.test(content)) {
        // Fix the first pattern (complete broken import)
        content = content.replace(
          /import\s*{\s*\nimport\s+([^;]+);\s*\n\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"];?/g,
          (match, brokenImport, actualImport, fromPath) => {
            // Add the broken import as a separate import
            const fixedImport = `import ${brokenImport};\nimport {\n  ${actualImport.trim()}\n} from '${fromPath}';`;
            return fixedImport;
          }
        );

        // Fix the second pattern (incomplete broken import)
        content = content.replace(
          /import\s*{\s*\nimport\s+([^;]+);\s*\n/g,
          (match, brokenImport) => {
            return `import ${brokenImport};\nimport {\n`;
          }
        );

        modified = true;
      }
    }

    // Remove duplicate imports
    const lines = content.split('\n');
    const seenImports = new Set();
    const filteredLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        if (!seenImports.has(line.trim())) {
          seenImports.add(line.trim());
          filteredLines.push(line);
        } else {
          modified = true; // Skip duplicate
        }
      } else {
        filteredLines.push(line);
      }
    }
    
    if (modified) {
      content = filteredLines.join('\n');
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed broken imports in: ${filePath}`);
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
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('🔧 Fixing broken import statements...\n');

const allFiles = getAllTsFiles('src');
let fixedCount = 0;

for (const file of allFiles) {
  if (fixBrokenImports(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed broken imports in ${fixedCount} files!`);
