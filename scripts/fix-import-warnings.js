/**
 * Fix Import Warnings Script
 * Fixes incorrect import paths and missing exports
 */

const fs = require('fs');
const path = require('path');

// Common import corrections
const importCorrections = {
  // React hooks should come from 'react'
  'useState': { from: ['@heroicons/react/24/outline', './config'], to: 'react' },
  'useEffect': { from: ['@heroicons/react/24/outline', './config'], to: 'react' },
  'useContext': { from: ['./config'], to: 'react' },
  'createContext': { from: ['./config'], to: 'react' },
  'Suspense': { from: ['@/components/ui/card'], to: 'react' },
  'useSearchParams': { from: ['@/components/ui/card'], to: 'next/navigation' },
  'notFound': { from: ['@/components/ui/card'], to: 'next/navigation' },
  'cache': { from: ['@/components/ui/card'], to: 'react' },
  'headers': { from: ['@/components/ui/card'], to: 'next/headers' },
  'NextResponse': { from: ['@/lib/ai'], to: 'next/server' },
  'ArrowLeft': { from: ['@/components/ui/card'], to: 'lucide-react' },

  // UI Components should come from correct UI paths
  'Card': { from: ['@/components/ui/select', '@/components/ui/dialog', '@/components/ui/dropdown-menu'], to: '@/components/ui/card' },
  'CardContent': { from: ['@/components/ui/select'], to: '@/components/ui/card' },
  'CardDescription': { from: ['@/components/ui/select'], to: '@/components/ui/card' },
  'CardHeader': { from: ['@/components/ui/select'], to: '@/components/ui/card' },
  'CardTitle': { from: ['@/components/ui/select'], to: '@/components/ui/card' },
  'Badge': { from: ['@/components/ui/dropdown-menu'], to: '@/components/ui/badge' },
  'Label': { from: ['@/components/ui/select'], to: '@/components/ui/label' },
  'Table': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },
  'TableBody': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },
  'TableCell': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },
  'TableHead': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },
  'TableHeader': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },
  'TableRow': { from: ['@/components/ui/dialog', 'lucide-react'], to: '@/components/ui/table' },

  // Validation and API
  'ZodError': { from: ['@/components/ui/card'], to: 'zod' },
  'cva': { from: ['@/components/ui/card'], to: 'class-variance-authority' },
  'format': { from: ['@/components/ui/select'], to: 'date-fns' },

  // API and middleware
  'withAPIMiddleware': { from: ['@/components/ui/card', '@/lib/middleware/api'], to: '@/lib/middleware/api-middleware' },
  'routeParamsSchemas': { from: ['@/components/ui/card', '@/lib/errors/api-errors'], to: '@/lib/errors/api-errors' },
  'updateUserSchema': { from: ['@/components/ui/card'], to: '@/lib/validations/api' },
  'userSearchQuerySchema': { from: ['@/components/ui/card', '@/lib/validations/api'], to: '@/lib/validations/api' },
  'createJobApplicationSchema': { from: ['@/components/ui/card'], to: '@/lib/validations/api' },
  'paginatedQuerySchema': { from: ['@/components/ui/card', '@/lib/validations/api'], to: '@/lib/validations/api' },
  'autocompleteQuerySchema': { from: ['@/components/ui/card'], to: '@/lib/validations/api' },
  'geolocationSearchSchema': { from: ['@/lib/validations/api'], to: '@/lib/validations/api' },
  'createSuccessResponse': { from: ['@/components/ui/card', '@/lib/utils/api-response', '@/lib/middleware/api-middleware'], to: '@/lib/middleware/api-middleware' },
  'createErrorResponse': { from: ['@/components/ui/card'], to: '@/lib/middleware/api-middleware' },
  'NotFoundError': { from: ['@/components/ui/card'], to: '@/lib/errors/api-errors' },
  'ApiError': { from: ['@/components/ui/card'], to: '@/lib/errors/api-errors' },
  'ErrorCode': { from: ['@/components/ui/card'], to: '@/lib/errors/api-errors' },

  // Database and services
  'prisma': { from: ['@/lib/errors/api-errors', '@/lib/utils/api-response', '@/lib/cache/redis', '@/lib/middleware/ai-security'], to: '@/lib/database/prisma' },
  'JobType': { from: ['@/components/ui/card'], to: '@prisma/client' },
  'UserRole': { from: ['@/components/ui/card'], to: '@prisma/client' },
  'z': { from: ['@/lib/cache/redis'], to: 'zod' },

  // Cache services
  'getCache': { from: ['@/components/ui/card'], to: '@/lib/cache/redis' },
  'setCache': { from: ['@/components/ui/card'], to: '@/lib/cache/redis' },
  'invalidateCache': { from: ['@/components/ui/card'], to: '@/lib/cache/redis' },

  // Email services
  'Resend': { from: ['@/components/ui/card'], to: 'resend' },
  'render': { from: ['@/components/ui/card'], to: '@react-email/render' },
  'emailService': { from: ['@/components/ui/card'], to: '@/lib/email/email-service' },
  'emailSecurityValidator': { from: ['@/components/ui/card'], to: '@/lib/email/security' },
  'SecurityLogger': { from: ['@/components/ui/card', './email/security', '@/lib/monitoring/error-monitor'], to: '@/lib/monitoring/security-logger' },
  'EmailHelpers': { from: ['@/components/ui/card'], to: '@/lib/email/email-helpers' },
  'emailAgent': { from: ['@/components/ui/card'], to: '@/lib/agents/email-agent' },
  'templateManager': { from: ['@/components/ui/card'], to: '@/lib/email/template-manager' },
  'TemplateManager': { from: ['@/components/ui/card'], to: '@/lib/email/template-manager' },
  'EmailQueue': { from: ['@/components/ui/card'], to: '@/lib/services/email-queue' },

  // Queue services
  'Queue': { from: ['@/components/ui/card'], to: 'bullmq' },
  'Worker': { from: ['@/components/ui/card'], to: 'bullmq' },
  'QueueEvents': { from: ['@/components/ui/card'], to: 'bullmq' },

  // AI and OpenAI
  'openai': { from: ['@/components/ui/card'], to: '@/lib/openai' },

  // Stripe
  'stripe': { from: ['@/components/ui/card'], to: '@/lib/stripe' },

  // Domain services
  'getDomainConfig': { from: ['@/components/ui/card'], to: '@/lib/domain/config' },

  // Regional services
  'RegionalJobService': { from: ['@/components/ui/card'], to: '@/lib/services/regional-job-service' },

  // User services
  'UserSearchService': { from: ['@/components/ui/card'], to: '@/lib/services/user-search' },

  // Instagram services
  'InstagramAPI': { from: ['@/components/ui/card'], to: '@/lib/services/instagram-api' },

  // Job services
  'JobMatchingService': { from: ['@/components/ui/card'], to: '@/lib/services/job-matching' },
  'ResumeEmbeddingService': { from: ['@/components/ui/card'], to: '@/lib/services/resume-embedding' },

  // Conversation services
  'ConversationManager': { from: ['@/components/ui/card'], to: '@/lib/conversation-memory' },
  'ChatbotPrompts': { from: ['@/components/ui/card'], to: '@/lib/conversation/prompts' },

  // Knowledge services
  'LocalKnowledgeService': { from: ['@/lib/knowledge/company-knowledge'], to: '@/lib/conversation/local-knowledge' },

  // Auth and permissions
  'Permission': { from: ['@/components/ui/card'], to: '@/types/auth' },
  'AdminRole': { from: ['@/lib/auth/permissions'], to: '@/types/auth' },
  'ROLE_PERMISSIONS': { from: ['@/lib/auth/permissions'], to: '@/types/auth' },
  'ROLE_DISPLAY_INFO': { from: ['@/lib/auth/permissions'], to: '@/types/auth' },
  'getUserPermissions': { from: ['@/lib/auth/permissions', '@/components/ui/card'], to: '@/hooks/usePermissions' },
  'hasPermission': { from: ['@/components/ui/card'], to: '@/types/auth' },
  'requireRole': { from: ['@/components/ui/card'], to: '@/lib/auth/middleware' },

  // Additional services and utilities
  'DataIntegrityService': { from: ['@/components/ui/card'], to: '@/lib/database/data-integrity' },
  'DuplicateDetectionService': { from: ['@/components/ui/card'], to: '@/lib/services/duplicate-detection' },
  'JobQueueService': { from: ['@/components/ui/card'], to: '@/lib/services/job-queue' },
  'UserCacheService': { from: ['@/lib/errors/api-errors'], to: '@/lib/services/user-cache' },
  'JobCacheService': { from: ['@/lib/services/regional-job-service'], to: '@/lib/services/job-cache' },
  'TextProcessor': { from: ['@/lib/cache/redis'], to: '@/lib/utils/text-processor' },
  'ShouldIApplyAnalysisService': { from: ['@/components/ui/card'], to: '@/lib/services/should-i-apply' },

  // Stripe and payment services
  'validateStripeConfig': { from: ['@/components/ui/card'], to: '@/lib/stripe/config' },
  'getStripePriceId': { from: ['@/components/ui/card'], to: '@/lib/stripe/config' },
  'STRIPE_CONFIG': { from: ['@/components/ui/card'], to: '@/lib/stripe/config' },
  'STRIPE_PRICE_IDS': { from: ['@/components/ui/card'], to: '@/lib/stripe/config' },

  // File processing utilities
  'isValidResumeFile': { from: ['@/components/ui/card'], to: '@/lib/utils/file-validation' },
  'extractTextFromFile': { from: ['@/components/ui/card'], to: '@/lib/utils/file-processing' },
  'validateExtractedText': { from: ['@/components/ui/card'], to: '@/lib/utils/file-validation' },
  'saveResumeFile': { from: ['@/components/ui/card'], to: '@/lib/utils/file-storage' },

  // Supabase utilities
  'createServerSupabaseClient': { from: ['@/components/ui/card'], to: '@/lib/supabase/server' },
};

// Component corrections
const componentCorrections = {
  'DashboardLayout': { from: ['@/components/dashboard/DashboardCards'], to: '@/components/dashboard/DashboardLayout' },
  'RecentChatsWidget': { from: ['@/components/dashboard/JobSeekerWidgets'], to: '@/components/dashboard/JobsGPTWidgets' },
  'SavedSearchesWidget': { from: ['@/components/dashboard/JobSeekerWidgets'], to: '@/components/dashboard/JobsGPTWidgets' },
  'JobsGPTStatsWidget': { from: ['@/components/dashboard/JobSeekerWidgets'], to: '@/components/dashboard/JobsGPTWidgets' },
  'motion': { from: ['./DashboardCards'], to: 'framer-motion' },
  'AdPreviewModal': { from: ['./AdPreviewModal'], to: '@/components/admin/AdPreviewModal' }
};

function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix import corrections
    Object.entries(importCorrections).forEach(([importName, correction]) => {
      correction.from.forEach(wrongPath => {
        const patterns = [
          // Single import
          new RegExp(`import\\s*\\{\\s*${importName}\\s*\\}\\s*from\\s*['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g'),
          // Multiple imports containing this one
          new RegExp(`(import\\s*\\{[^}]*?)\\b${importName}\\b([^}]*\\}\\s*from\\s*['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?)`, 'g')
        ];

        patterns.forEach(pattern => {
          if (pattern.test(content)) {
            // For single imports, replace entirely
            content = content.replace(
              new RegExp(`import\\s*\\{\\s*${importName}\\s*\\}\\s*from\\s*['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g'),
              `import { ${importName} } from '${correction.to}';`
            );

            // For multiple imports, we need to remove the item and add a new import
            const multiImportRegex = new RegExp(`(import\\s*\\{)([^}]*?)\\b${importName}\\b,?([^}]*)(\\}\\s*from\\s*['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?)`, 'g');
            content = content.replace(multiImportRegex, (match, start, before, after, end) => {
              // Clean up the remaining imports
              const remaining = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
              const newImport = `import { ${importName} } from '${correction.to}';`;
              
              if (remaining) {
                return `${newImport}\n${start}${remaining}${end}`;
              } else {
                return newImport;
              }
            });

            modified = true;
          }
        });
      });
    });

    // Fix component corrections
    Object.entries(componentCorrections).forEach(([componentName, correction]) => {
      correction.from.forEach(wrongPath => {
        const pattern = new RegExp(`import\\s*\\{[^}]*\\b${componentName}\\b[^}]*\\}\\s*from\\s*['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g');
        if (pattern.test(content)) {
          content = content.replace(pattern, `import { ${componentName} } from '${correction.to}';`);
          modified = true;
        }
      });
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript and TSX files
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

function main() {
  console.log('🔧 Starting import warning fixes...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const allFiles = getAllTsFiles(srcDir);
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixImportsInFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Import Warning Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run build');
    console.log('   2. Check for remaining warnings');
    console.log('   3. Address any remaining issues');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile };
