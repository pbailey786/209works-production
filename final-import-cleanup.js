#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function finalImportCleanup(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix malformed import statements
    const lines = content.split('\n');
    const fixedLines = [];
    let inImportBlock = false;
    let currentImport = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if we're starting an import
      if (trimmedLine.startsWith('import ')) {
        if (trimmedLine.includes(' from ') && trimmedLine.endsWith(';')) {
          // Complete import on one line
          fixedLines.push(line);
        } else if (trimmedLine.includes('{')) {
          // Multi-line import starting
          inImportBlock = true;
          currentImport = [line];
        } else {
          // Simple import
          fixedLines.push(line);
        }
      } else if (inImportBlock) {
        currentImport.push(line);

        // Check if this line ends the import
        if (trimmedLine.includes('} from ') && trimmedLine.endsWith(';')) {
          // End of import block
          inImportBlock = false;

          // Clean up the import block
          const importText = currentImport.join('\n');

          // Remove any standalone import statements that got mixed in
          const cleanedImport = importText
            .replace(/import\s+[^;]+;\s*\n/g, '') // Remove standalone imports
            .replace(/\n\s*([^}]+),?\s*\n\s*}\s*from/g, '\n  $1\n} from') // Fix formatting
            .replace(/,\s*\n\s*}/g, '\n}'); // Remove trailing commas before }

          fixedLines.push(cleanedImport);
          currentImport = [];
          modified = true;
        } else if (trimmedLine.endsWith('}')) {
          // Malformed end - try to fix
          inImportBlock = false;
          const importText = currentImport.join('\n');
          fixedLines.push(importText);
          currentImport = [];
          modified = true;
        }
      } else {
        fixedLines.push(line);
      }
    }

    // Handle any remaining import block
    if (currentImport.length > 0) {
      fixedLines.push(...currentImport);
      modified = true;
    }

    if (modified) {
      const newContent = fixedLines.join('\n');

      // Additional cleanup patterns
      const cleanedContent = newContent
        // Remove duplicate import statements
        .replace(/^(import\s+[^;]+;)\s*\n\1/gm, '$1')
        // Fix broken import syntax
        .replace(
          /}\s*from\s*['"][^'"]*['"];\s*\n\s*([^}]+),?\s*\n\s*}\s*from/g,
          '} from'
        )
        // Remove empty import blocks
        .replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n/g, '')
        // Fix trailing commas in imports
        .replace(/,(\s*\n\s*})/g, '$1');

      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Final cleanup completed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error in final cleanup ${filePath}:`, error.message);
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
console.log('🔧 Final import cleanup...\n');

const allFiles = getAllTsFiles('src');
let fixedCount = 0;

for (const file of allFiles) {
  if (finalImportCleanup(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Final cleanup completed on ${fixedCount} files!`);
