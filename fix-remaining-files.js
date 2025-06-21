#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need specific fixes
const fixes = [
  {
    file: 'src/components/job-posting/FeaturedPostUpgrade.tsx',
    pattern: /^([^}]*)} from 'lucide-react';/m,
    replacement: 'import {\n$1} from \'lucide-react\';'
  },
  {
    file: 'src/components/job-search/EnhancedJobCard.tsx',
    pattern: /^([^}]*)} from 'lucide-react';/m,
    replacement: 'import {\n$1} from \'lucide-react\';'
  },
  {
    file: 'src/components/job-search/FeaturedJobCard.tsx',
    pattern: /^([^}]*)} from 'lucide-react';/m,
    replacement: 'import {\n$1} from \'lucide-react\';'
  },
  {
    file: 'src/components/job-search/NLPJobSearch.tsx',
    pattern: /^([^}]*)} from 'lucide-react';/m,
    replacement: 'import {\n$1} from \'lucide-react\';'
  },
  {
    file: 'src/components/ui/ErrorDisplay.tsx',
    pattern: /^([^}]*)} from '@heroicons\/react\/24\/outline';/m,
    replacement: 'import {\n$1} from \'@heroicons/react/24/outline\';'
  },
  {
    file: 'src/components/ui/FocusManager.tsx',
    pattern: /^([^}]*)} from '@\/hooks\/useFocusManagement';/m,
    replacement: 'import {\n$1} from \'@/hooks/useFocusManagement\';'
  },
  {
    file: 'src/lib/knowledge/company-knowledge.ts',
    pattern: /^([^}]*)} from '@prisma\/client';/m,
    replacement: 'import {\n$1} from \'@prisma/client\';'
  },
  {
    file: 'src/lib/llm/shouldIApplyAnalysis.ts',
    pattern: /^([^}]*)} from '@\/lib\/prompts\/shouldIApply';/m,
    replacement: 'import {\n$1} from \'@/lib/prompts/shouldIApply\';'
  },
  {
    file: 'src/lib/performance/db-optimization.ts',
    pattern: /^([^}]*)} from '\.\/cache-utils';/m,
    replacement: 'import {\n$1} from \'./cache-utils\';'
  },
  {
    file: 'src/lib/services/billing.ts',
    pattern: /^([^}]*)} from '@prisma\/client';/m,
    replacement: 'import {\n$1} from \'@prisma/client\';'
  }
];

function applyFix(fixConfig) {
  try {
    const fullPath = path.resolve(fixConfig.file);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fixConfig.file}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (fixConfig.pattern.test(content)) {
      content = content.replace(fixConfig.pattern, fixConfig.replacement);
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed ${fixConfig.file}`);
    } else {
      console.log(`⚪ No changes needed for ${fixConfig.file}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${fixConfig.file}:`, error.message);
  }
}

function fixJobCard() {
  try {
    const jobCardPath = 'src/components/JobCard.tsx';
    if (fs.existsSync(jobCardPath)) {
      let content = fs.readFileSync(jobCardPath, 'utf8');
      
      // Fix the malformed import statement
      content = content.replace(
        /^import LoadingSpinner from '@\/components\/ui\/LoadingSpinner';$/m,
        'import LoadingSpinner from \'@/components/ui/LoadingSpinner\';'
      );
      
      // Fix missing import {
      content = content.replace(
        /^([^}]*)} from '@\/lib\/types\/component-props';/m,
        'import {\n$1} from \'@/lib/types/component-props\';'
      );
      
      fs.writeFileSync(jobCardPath, content);
      console.log('✅ Fixed JobCard.tsx');
    }
  } catch (error) {
    console.error('❌ Error fixing JobCard.tsx:', error.message);
  }
}

function fixKeyboardNavigationList() {
  try {
    const filePath = 'src/components/ui/keyboard-navigation-list.tsx';
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix the malformed import statement
      content = content.replace(
        /^import { useRovingTabIndex } from '@\/hooks\/useKeyboardNavigation';$/m,
        'import { useRovingTabIndex } from \'@/hooks/useKeyboardNavigation\';'
      );
      
      // Fix missing import {
      content = content.replace(
        /^([^}]*)} from 'react';/m,
        'import {\n$1} from \'react\';'
      );
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed keyboard-navigation-list.tsx');
    }
  } catch (error) {
    console.error('❌ Error fixing keyboard-navigation-list.tsx:', error.message);
  }
}

function fixMenubar() {
  try {
    const filePath = 'src/components/ui/menubar.tsx';
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix the malformed import statement
      content = content.replace(
        /^import \* as MenubarPrimitive from '@radix-ui\/react-menubar';$/m,
        'import * as MenubarPrimitive from \'@radix-ui/react-menubar\';'
      );
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed menubar.tsx');
    }
  } catch (error) {
    console.error('❌ Error fixing menubar.tsx:', error.message);
  }
}

function fixUseAnalytics() {
  try {
    const filePath = 'src/hooks/useAnalytics.ts';
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix JSX in TypeScript file - this should probably be a .tsx file
      if (content.includes('return <Component {...props} />;')) {
        // Rename to .tsx
        const newPath = filePath.replace('.ts', '.tsx');
        fs.renameSync(filePath, newPath);
        console.log('✅ Renamed useAnalytics.ts to useAnalytics.tsx');
      }
    }
  } catch (error) {
    console.error('❌ Error fixing useAnalytics:', error.message);
  }
}

console.log('🔧 Fixing remaining syntax errors...\n');

fixes.forEach(applyFix);
fixJobCard();
fixKeyboardNavigationList();
fixMenubar();
fixUseAnalytics();

console.log('\n✨ Remaining fixes complete!');
