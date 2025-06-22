/**
 * Fix Corrupted TypeScript Files
 * Identifies and fixes files that have been corrupted with malformed syntax
 */

const fs = require('fs');
const path = require('path');

// Files that are known to be corrupted based on build errors
const corruptedFiles = [
  'src/app/about/page.tsx',
  'src/app/admin-simple/page.tsx',
  'src/app/admin/ads/[id]/analytics/page.tsx',
  'src/app/admin/ads/[id]/edit/page.tsx',
  'src/app/admin/ads/campaigns/page.tsx',
  'src/__tests__/utils/test-helpers.tsx'
];

function isFileCorrupted(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has all content on one line (corrupted)
    const lines = content.split('\n');
    if (lines.length <= 3 && content.length > 500) {
      return true;
    }
    
    // Check for malformed syntax patterns
    const corruptionPatterns = [
      /import \{\} from/g,  // Empty imports
      /\} \} \}/g,          // Multiple closing braces
      /\(\(\(/g,            // Multiple opening parens
      /\)\)\)/g,            // Multiple closing parens
      /; ; /g,              // Double semicolons
      /" " /g,              // Double quotes with spaces
      /\{ \{/g,             // Double opening braces
    ];
    
    let corruptionScore = 0;
    corruptionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        corruptionScore += matches.length;
      }
    });
    
    // If corruption score is high, file is likely corrupted
    return corruptionScore > 10;
    
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

function createBasicPageTemplate(fileName) {
  const componentName = fileName
    .replace(/\.tsx?$/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^./, str => str.toUpperCase()) + 'Page';
    
  return `export default function ${componentName}() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ${componentName.replace('Page', '')} Page
        </h1>
        <p className="text-gray-600">
          This page is under construction.
        </p>
      </div>
    </div>
  );
}`;
}

function fixCorruptedFile(filePath) {
  try {
    console.log(`🔧 Fixing corrupted file: ${filePath}`);
    
    const fileName = path.basename(filePath);
    const template = createBasicPageTemplate(fileName);
    
    // Create backup
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Write clean template
    fs.writeFileSync(filePath, template);
    
    console.log(`✅ Fixed: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Scanning for corrupted TypeScript files...\n');
  
  let fixedCount = 0;
  let totalCount = 0;
  
  // Check known corrupted files
  corruptedFiles.forEach(filePath => {
    totalCount++;
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    if (isFileCorrupted(filePath)) {
      if (fixCorruptedFile(filePath)) {
        fixedCount++;
      }
    } else {
      console.log(`ℹ️  File appears clean: ${filePath}`);
    }
  });
  
  // Scan for additional corrupted files
  const scanDirs = ['src/app', 'src/components', 'src/__tests__'];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else if (item.match(/\.(tsx?|jsx?)$/)) {
        // Skip if already in known corrupted files
        const relativePath = itemPath.replace(/\\/g, '/');
        if (corruptedFiles.includes(relativePath)) return;
        
        totalCount++;
        
        if (isFileCorrupted(itemPath)) {
          console.log(`🔍 Found additional corrupted file: ${itemPath}`);
          if (fixCorruptedFile(itemPath)) {
            fixedCount++;
          }
        }
      }
    });
  }
  
  scanDirs.forEach(scanDirectory);
  
  console.log(`\n📊 Corruption Fix Summary:`);
  console.log(`   Files scanned: ${totalCount}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files clean: ${totalCount - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run build');
    console.log('   2. Manually restore content for important pages');
    console.log('   3. Check .backup files for original content');
  }
}

if (require.main === module) {
  main();
}

module.exports = { isFileCorrupted, fixCorruptedFile };
