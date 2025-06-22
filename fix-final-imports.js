#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixFile(filePath, fixes) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
        console.log(`Applied fix to ${filePath}: ${fix.description}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚪ No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Fix keyboard-navigation-list.tsx
fixFile('src/components/ui/keyboard-navigation-list.tsx', [
  {
    pattern:
      /^import { useRovingTabIndex } from '@\/hooks\/useKeyboardNavigation';$/m,
    replacement:
      "import { useRovingTabIndex } from '@/hooks/useKeyboardNavigation';",
    description: 'Fix malformed import statement',
  },
  {
    pattern: /^([^}]*)} from 'react';/m,
    replacement: "import {\n$1} from 'react';",
    description: 'Add missing import {',
  },
]);

// Fix menubar.tsx
fixFile('src/components/ui/menubar.tsx', [
  {
    pattern:
      /^import \* as MenubarPrimitive from '@radix-ui\/react-menubar';$/m,
    replacement: "import * as MenubarPrimitive from '@radix-ui/react-menubar';",
    description: 'Fix malformed import statement',
  },
]);

// Fix cache-migration-utility.ts
fixFile('src/lib/cache/cache-migration-utility.ts', [
  {
    pattern: /^([^}]*)} from '\.\/services';/m,
    replacement: "import {\n$1} from './services';",
    description: 'Add missing import {',
  },
  {
    pattern: /^import {\s*import {/m,
    replacement: 'import {',
    description: 'Remove duplicate import {',
  },
]);

// Fix enhanced-cache-services.ts
fixFile('src/lib/cache/enhanced-cache-services.ts', [
  {
    pattern: /^([^}]*)} from '@\/components\/ui\/card';/m,
    replacement: "import {\n$1} from '@/components/ui/card';",
    description: 'Add missing import {',
  },
]);

// Fix chatbot-service.ts
fixFile('src/lib/conversation/chatbot-service.ts', [
  {
    pattern: /^([^}]*)} from '@\/components\/ui\/card';/m,
    replacement: "import {\n$1} from '@/components/ui/card';",
    description: 'Add missing import {',
  },
]);

// Fix middleware/api.ts
fixFile('src/lib/middleware/api.ts', [
  {
    pattern: /^([^}]*)} from '@\/components\/ui\/card';/m,
    replacement: "import {\n$1} from '@/components/ui/card';",
    description: 'Add missing import {',
  },
]);

// Fix search/services.ts
fixFile('src/lib/search/services.ts', [
  {
    pattern: /^([^}]*)} from '@\/components\/ui\/card';/m,
    replacement: "import {\n$1} from '@/components/ui/card';",
    description: 'Add missing import {',
  },
]);

console.log('\n✨ Final import fixes complete!');
