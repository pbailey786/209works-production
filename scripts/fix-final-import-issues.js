#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all TypeScript files in the project
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

function fixFinalImportIssues(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix the main pattern: "} from 'module';" without corresponding "import {"
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Check if this line is a standalone "} from 'module';" 
      if (trimmed.match(/^}\s*from\s*['"][^'"]*['"];?\s*$/)) {
        // Look backwards to find the import items
        let importItems = [];
        let j = i - 1;
        let foundImportStart = false;
        
        // Collect import items going backwards
        while (j >= 0) {
          const prevLine = lines[j].trim();
          
          // If we find an import statement, we're done
          if (prevLine.startsWith('import ') && prevLine.includes('{')) {
            foundImportStart = true;
            break;
          }
          
          // If we find a comment or other import, stop
          if (prevLine.startsWith('import ') || 
              prevLine.startsWith('//') || 
              prevLine.startsWith('/*') ||
              prevLine.includes('export') ||
              prevLine === '') {
            // Skip empty lines and comments, but stop at other imports
            if (prevLine.startsWith('import ') || prevLine.includes('export')) {
              break;
            }
            j--;
            continue;
          }
          
          // This should be an import item
          if (prevLine.match(/^[A-Za-z_][A-Za-z0-9_]*,?\s*$/) || 
              prevLine.match(/^type\s+[A-Za-z_][A-Za-z0-9_]*,?\s*$/)) {
            importItems.unshift(prevLine.replace(/,$/, ''));
            j--;
          } else {
            break;
          }
        }
        
        if (importItems.length > 0 && !foundImportStart) {
          // Remove the collected import item lines
          for (let k = 0; k < importItems.length; k++) {
            fixedLines.pop();
          }
          
          // Create proper import statement
          const fromPart = trimmed;
          fixedLines.push('import {');
          importItems.forEach((item, index) => {
            const comma = index < importItems.length - 1 ? ',' : '';
            fixedLines.push(`  ${item}${comma}`);
          });
          fixedLines.push(`} ${fromPart.substring(1)}`);
          modified = true;
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }
    
    if (modified) {
      content = fixedLines.join('\n');
    }
    
    // Additional specific fixes
    
    // Fix shebang lines that got moved
    content = content.replace(/^([^#]*)(#!\/usr\/bin\/env node)/gm, '$2\n$1');
    
    // Fix import statements with missing 'import' keyword
    content = content.replace(
      /^(\s*)(\/\/[^\n]*\n)?\s*([A-Za-z_][A-Za-z0-9_]*(?:,\s*\n\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*\n\s*}\s*from\s*(['"][^'"]*['"];?)/gm,
      '$1$2import {\n  $3\n} from $4'
    );
    
    // Fix type imports
    content = content.replace(
      /^(\s*)(type\s+[A-Za-z_][A-Za-z0-9_]*),?\s*\n\s*}\s*from/gm,
      '$1import {\n  $2,\n} from'
    );
    
    // Clean up any remaining malformed patterns
    content = content.replace(/import\s*{\s*\nimport\s*{/g, 'import {');
    content = content.replace(/}\s*from[^;]*;\s*\n\s*import\s*{/g, '} from \'@/components/ui/card\';\nimport {');
    
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed final import issues: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing final import statement issues...\n');
  
  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixFinalImportIssues(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Final Import Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run type-check');
    console.log('   2. Verify the migration is complete!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFinalImportIssues };
