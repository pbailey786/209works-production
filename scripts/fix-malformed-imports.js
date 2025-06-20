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

function fixMalformedImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file has malformed imports (scattered import statements)
    const lines = content.split('\n');
    const importLines = [];
    const nonImportLines = [];
    let inImportSection = true;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is an import line
      if (line.trim().startsWith('import ') || 
          (line.trim().startsWith('{') && inImportSection) ||
          (line.trim().startsWith('}') && inImportSection) ||
          (line.trim().includes('} from ') && inImportSection) ||
          (line.trim() === '' && inImportSection && i < 50)) { // Empty lines in import section
        importLines.push(line);
      } else if (line.trim().startsWith('//') && inImportSection) {
        // Skip comments in import section
        continue;
      } else {
        // This is not an import line
        inImportSection = false;
        nonImportLines.push(line);
      }
    }
    
    // Check if we have scattered imports (imports mixed with non-imports)
    const hasScatteredImports = content.includes('import {') && 
                               content.includes('} from') && 
                               (content.match(/import\s*{[^}]*$/m) || 
                                content.match(/^\s*[A-Z]/m));
    
    if (hasScatteredImports) {
      // Reconstruct the imports properly
      const reconstructedImports = [];
      let currentImport = '';
      let inMultiLineImport = false;
      
      for (const line of importLines) {
        if (line.trim().startsWith('import ') && line.includes('{') && !line.includes('}')) {
          // Start of multi-line import
          currentImport = line;
          inMultiLineImport = true;
        } else if (inMultiLineImport && line.includes('} from')) {
          // End of multi-line import
          currentImport += '\n' + line;
          reconstructedImports.push(currentImport);
          currentImport = '';
          inMultiLineImport = false;
        } else if (inMultiLineImport) {
          // Middle of multi-line import
          currentImport += '\n' + line;
        } else if (line.trim().startsWith('import ') && line.includes('}')) {
          // Single line import
          reconstructedImports.push(line);
        } else if (line.trim() === '') {
          // Empty line
          if (!inMultiLineImport) {
            reconstructedImports.push(line);
          }
        }
      }
      
      // Clean up any remaining malformed imports
      const cleanedImports = reconstructedImports.map(imp => {
        if (typeof imp === 'string') {
          return imp
            .replace(/import\s*{\s*\nimport\s*{/g, 'import {')
            .replace(/}\s*from[^;]*;\s*\n\s*([A-Z])/g, '} from \'@/components/ui/card\';\nimport {\n  $1')
            .replace(/,,/g, ',')
            .replace(/,\s*,/g, ',');
        }
        return imp;
      });
      
      const newContent = cleanedImports.join('\n') + '\n\n' + nonImportLines.join('\n');
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Additional cleanup for specific patterns
    content = content.replace(/import\s*{\s*\nimport\s*{/g, 'import {');
    content = content.replace(/}\s*from[^;]*;\s*\n\s*import\s*{/g, '} from \'@/components/ui/card\';\nimport {');
    
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed malformed imports: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing malformed import structures...\n');
  
  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixMalformedImports(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Malformed Import Fix Summary:`);
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

module.exports = { fixMalformedImports };
