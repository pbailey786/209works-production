#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with missing import statements or other syntax issues
const filesToFix = [
  'src/components/Dropdown.tsx',
  'src/components/Footer.tsx',
  'src/components/job-posting/FeaturedPostUpgrade.tsx',
  'src/components/job-search/EnhancedJobCard.tsx',
  'src/components/job-search/FeaturedJobCard.tsx',
  'src/components/job-search/NLPJobSearch.tsx',
  'src/components/JobCard.tsx',
  'src/components/ui/ErrorDisplay.tsx',
  'src/components/ui/FocusManager.tsx',
  'src/components/ui/keyboard-navigation-list.tsx',
  'src/components/ui/menubar.tsx',
  'src/hooks/useAnalytics.ts',
  'src/lib/cache/cache-migration-utility.ts',
  'src/lib/cache/enhanced-cache-services.ts',
  'src/lib/conversation/chatbot-service.ts',
  'src/lib/knowledge/company-knowledge.ts',
  'src/lib/llm/shouldIApplyAnalysis.ts',
  'src/lib/middleware/api.ts',
  'src/lib/performance/db-optimization.ts',
  'src/lib/search/services.ts',
  'src/lib/services/billing.ts'
];

function fixMissingImports(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    let modified = false;
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Fix missing import { at the beginning of import statements
      if (line.trim().startsWith('} from ') && i > 0) {
        // Look backwards for the start of the import
        let j = i - 1;
        while (j >= 0 && !lines[j].trim().startsWith('import')) {
          j--;
        }
        
        if (j >= 0 && !lines[j].includes('import {')) {
          // This is likely a missing import { case
          const importLine = lines[j].trim();
          if (importLine === 'import' || importLine.endsWith('import')) {
            newLines[j] = lines[j].replace(/import\s*$/, 'import {');
            modified = true;
            console.log(`Fixed missing import { in ${filePath} at line ${j + 1}`);
          }
        }
      }
      
      // Fix lines that start with just identifiers (missing import {)
      if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('*') && 
          /^[A-Z][a-zA-Z0-9]*,?\s*$/.test(line.trim()) && i > 0) {
        const prevLine = lines[i - 1];
        if (prevLine && prevLine.trim() === '') {
          // This might be a missing import { case
          newLines[i - 1] = 'import {';
          modified = true;
          console.log(`Added missing import { in ${filePath} before line ${i + 1}`);
        }
      }
      
      newLines.push(line);
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, newLines.join('\n'));
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚪ No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function fixSpecificFiles() {
  // Fix specific known issues
  
  // Fix Dropdown.tsx
  try {
    const dropdownPath = 'src/components/Dropdown.tsx';
    if (fs.existsSync(dropdownPath)) {
      let content = fs.readFileSync(dropdownPath, 'utf8');
      if (content.includes('} from \'@/hooks/useKeyboardNavigation\';') && !content.includes('import {')) {
        content = content.replace(/^([^}]*)} from '@\/hooks\/useKeyboardNavigation';/m, 'import {\n$1} from \'@/hooks/useKeyboardNavigation\';');
        fs.writeFileSync(dropdownPath, content);
        console.log('✅ Fixed Dropdown.tsx import');
      }
    }
  } catch (error) {
    console.error('❌ Error fixing Dropdown.tsx:', error.message);
  }
  
  // Fix Footer.tsx
  try {
    const footerPath = 'src/components/Footer.tsx';
    if (fs.existsSync(footerPath)) {
      let content = fs.readFileSync(footerPath, 'utf8');
      if (content.includes('} from \'lucide-react\';') && !content.includes('import {')) {
        content = content.replace(/^([^}]*)} from 'lucide-react';/m, 'import {\n$1} from \'lucide-react\';');
        fs.writeFileSync(footerPath, content);
        console.log('✅ Fixed Footer.tsx import');
      }
    }
  } catch (error) {
    console.error('❌ Error fixing Footer.tsx:', error.message);
  }
  
  // Fix JobCard.tsx
  try {
    const jobCardPath = 'src/components/JobCard.tsx';
    if (fs.existsSync(jobCardPath)) {
      let content = fs.readFileSync(jobCardPath, 'utf8');
      // Fix malformed import statement
      content = content.replace(/^import LoadingSpinner from '@\/components\/ui\/LoadingSpinner';$/m, 'import LoadingSpinner from \'@/components/ui/LoadingSpinner\';');
      // Fix missing import {
      if (content.includes('} from \'@/lib/types/component-props\';') && !content.includes('import {')) {
        content = content.replace(/^([^}]*)} from '@\/lib\/types\/component-props';/m, 'import {\n$1} from \'@/lib/types/component-props\';');
      }
      fs.writeFileSync(jobCardPath, content);
      console.log('✅ Fixed JobCard.tsx imports');
    }
  } catch (error) {
    console.error('❌ Error fixing JobCard.tsx:', error.message);
  }
}

console.log('🔧 Fixing remaining syntax errors...\n');

filesToFix.forEach(fixMissingImports);
fixSpecificFiles();

console.log('\n✨ Syntax fixing complete!');
