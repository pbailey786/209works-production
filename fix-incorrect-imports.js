#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping of incorrect imports to correct ones
const importMappings = {
  // Next.js imports
  'NextRequest, NextResponse': 'next/server',
  NextRequest: 'next/server',
  NextResponse: 'next/server',
  revalidatePath: 'next/cache',
  redirect: 'next/navigation',
  useRouter: 'next/navigation',

  // React imports
  useState: 'react',
  useEffect: 'react',
  useCallback: 'react',
  useMemo: 'react',
  useRef: 'react',
  React: 'react',

  // Zod imports
  z: 'zod',

  // Node.js built-ins
  'writeFileSync, existsSync, mkdirSync': 'fs',
  writeFileSync: 'fs',
  existsSync: 'fs',
  mkdirSync: 'fs',
  readFileSync: 'fs',
  join: 'path',
  config: 'dotenv/config',

  // Database imports
  prisma: '@/lib/database/prisma',
  PrismaClient: '@prisma/client',

  // Auth imports
  auth: '@clerk/nextjs/server',
  useUser: '@clerk/nextjs',
  useAuth: '@clerk/nextjs',

  // External libraries
  cron: 'node-cron',
  cronScheduler: '@/lib/services/cron-scheduler',
  getEmbedding: '@/lib/ai/embeddings',
  'getRedisClient, isRedisAvailable': '@/lib/cache/redis',
  getRedisClient: '@/lib/cache/redis',
  isRedisAvailable: '@/lib/cache/redis',
  getAtomicCacheManager: '@/lib/cache/atomic-cache-manager',
  TaskPerformanceOptimizer: '@/lib/task-management/performance',
  ConfigManager: '@/lib/task-management/config',
  ChatbotService: '@/lib/conversation/chatbot-service',

  // UI imports that should stay as card
  'Card, CardContent, CardHeader, CardTitle': '@/components/ui/card',
  Card: '@/components/ui/card',
  CardContent: '@/components/ui/card',
  CardHeader: '@/components/ui/card',
  CardTitle: '@/components/ui/card',

  // Other UI components
  Button: '@/components/ui/button',
  Badge: '@/components/ui/badge',
  'Check, X': 'lucide-react',
  Check: 'lucide-react',
  X: 'lucide-react',
  Loader2: 'lucide-react',

  // Form imports
  useForm: 'react-hook-form',
  zodResolver: '@hookform/resolvers/zod',
  'Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage':
    '@/components/ui/form',
  FormErrorBoundary: '@/components/ui/form-error-boundary',
  'FormInput, PasswordInput, FormTextarea, FileInput':
    '@/components/ui/form-input',

  // Service imports
  AdRotationService: '@/lib/services/ad-rotation',
  PaymentRetryService: '@/lib/services/payment-retry',

  // Type imports
  'PricingTier, BillingInterval': '@/types/pricing',
  ActionResult: '@/types/actions',

  // Validation imports
  'validationPatterns, handleFormSubmission, useFormDirtyState, useDebounceValidation':
    '@/lib/validations/form-utils',

  // Toast imports
  UnifiedToastContainer: '@/components/ui/unified-toast-system',
  UnifiedModalContainer: '@/components/ui/unified-modal-system',
  'UIStateProvider, UIStateErrorBoundary':
    '@/components/ui/comprehensive-ui-provider',
  'componentRegistry, withRegistry, createFeedbackComponent, createOverlayComponent, createUtilityComponent, ComponentInfo':
    '@/lib/ui/component-registry',
};

function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix imports from '@/components/ui/card' that should be from other modules
    for (const [importNames, correctModule] of Object.entries(importMappings)) {
      const patterns = [
        // Single line import
        new RegExp(
          `import\\s*{\\s*${importNames.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}\\s*from\\s*['"]@/components/ui/card['"];?`,
          'g'
        ),
        // Multi-line import
        new RegExp(
          `import\\s*{[^}]*${importNames.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*}\\s*from\\s*['"]@/components/ui/card['"];?`,
          'g'
        ),
        // Default import
        new RegExp(
          `import\\s+${importNames.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+from\\s*['"]@/components/ui/card['"];?`,
          'g'
        ),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `import { ${importNames} } from '${correctModule}';`
          );
          modified = true;
        }
      }
    }

    // Fix specific patterns
    content = content.replace(
      /import\s*{\s*z\s*}\s*from\s*['"]@\/components\/ui\/card['"];?/g,
      "import { z } from 'zod';"
    );

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
console.log('🔧 Fixing incorrect import paths...\n');

const allFiles = getAllTsFiles('src');
let fixedCount = 0;

for (const file of allFiles) {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed imports in ${fixedCount} files!`);
