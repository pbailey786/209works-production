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

function fixImportCommas(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix double commas in imports
    content = content.replace(/,,/g, ',');
    
    // Fix trailing commas before closing braces
    content = content.replace(/,\s*,/g, ',');
    
    // Fix imports with extra commas and malformed syntax
    content = content.replace(
      /import\s*{\s*\n([^}]*),\s*,\s*\n([^}]*)\s*}\s*from/g,
      "import {\n$1,\n$2\n} from"
    );
    
    // Fix specific pattern: "name,," -> "name,"
    content = content.replace(/(\w+),,/g, '$1,');
    
    // Fix imports with "// imports here" comments
    content = content.replace(
      /import\s*{\s*\n([^}]*),\s*\n\s*\/\/\s*imports\s*here\s*\n\s*}\s*from/g,
      "import {\n$1\n} from"
    );
    
    // Clean up malformed import structures
    const lines = content.split('\n');
    const fixedLines = [];
    let inImport = false;
    let importLines = [];
    let importFrom = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('import {') && !line.includes('}')) {
        inImport = true;
        importLines = [line];
        continue;
      }
      
      if (inImport) {
        if (line.includes('} from')) {
          importLines.push(line);
          
          // Clean up the import
          const importContent = importLines.join('\n');
          const cleanedImport = importContent
            .replace(/,,/g, ',')
            .replace(/,\s*,/g, ',')
            .replace(/,\s*\n\s*\/\/[^\n]*\n/g, ',\n')
            .replace(/,\s*\n\s*}\s*from/g, '\n} from');
          
          fixedLines.push(cleanedImport);
          inImport = false;
          importLines = [];
          modified = true;
          continue;
        } else if (line.trim() && !line.includes('//')) {
          importLines.push(line);
          continue;
        } else if (line.includes('//')) {
          // Skip comment lines in imports
          continue;
        }
      }
      
      fixedLines.push(line);
    }
    
    if (modified) {
      content = fixedLines.join('\n');
    }
    
    // Additional cleanup
    content = content.replace(/,\s*,\s*/g, ', ');
    content = content.replace(/(\w+),\s*,/g, '$1,');
    
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed import commas: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import comma issues...\n');
  
  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixImportCommas(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Import Comma Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
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

module.exports = { fixImportCommas };
