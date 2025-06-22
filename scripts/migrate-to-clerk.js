#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process - remaining files from TypeScript errors
const filesToUpdate = [
  // API routes - second batch
  'src/app/api/debug/current-user/route.ts',
  'src/app/api/debug/database-status/route.ts',
  'src/app/api/debug/email-template/route.ts',
  'src/app/api/debug/email/route.ts',
  'src/app/api/debug/env-check/route.ts',
  'src/app/api/debug/openai-status/route.ts',
  'src/app/api/debug/resume-parse-minimal/route.ts',
  'src/app/api/debug/resume-parse/route.ts',
  'src/app/api/debug/session-flow/route.ts',
  'src/app/api/debug/stripe-config/route.ts',
  'src/app/api/debug/test-login/route.ts',
  'src/app/api/email-alerts/[id]/route.ts',
  'src/app/api/email-alerts/route.ts',
  'src/app/api/email/test-integration/route.ts',
  'src/app/api/employers/applicants/[id]/route.ts',
  'src/app/api/employers/applicants/route.ts',
  'src/app/api/employers/applications/route.ts',
  'src/app/api/employers/bulk-upload/approve/route.ts',
  'src/app/api/employers/bulk-upload/optimize/route.ts',
  'src/app/api/employers/bulk-upload/process/route.ts',
  'src/app/api/employers/bulk-upload/route.ts',
  'src/app/api/employers/candidates/[id]/notes/route.ts',
  'src/app/api/employers/candidates/[id]/route.ts',
  'src/app/api/employers/candidates/[id]/status/route.ts',
  'src/app/api/employers/contact-applicant/route.ts',
  'src/app/api/employers/credits/purchase/route.ts',
  'src/app/api/employers/credits/route.ts',
  'src/app/api/employers/dashboard-stats/route.ts',
  'src/app/api/employers/jobs-with-applications/route.ts',
  'src/app/api/employers/jobs/route.ts',
  'src/app/api/employers/knowledge/route.ts',
  'src/app/api/employers/logo/route.ts',
  'src/app/api/employers/my-jobs/route.ts',
  'src/app/api/employers/onboarding/route.ts',
  'src/app/api/employers/resumes/bulk-download/route.ts',
  'src/app/api/employers/send-email/route.ts',
  'src/app/api/employers/subscription/status/route.ts',
  'src/app/api/instagram/analytics/account/route.ts',
  'src/app/api/instagram/analytics/alerts/route.ts',
  'src/app/api/instagram/analytics/insights/route.ts',
  'src/app/api/instagram/analytics/route.ts',
  'src/app/api/instagram/posts/[id]/route.ts',
  'src/app/api/instagram/posts/route.ts',
  'src/app/api/job-post-optimizer/[id]/publish/route.ts',
  'src/app/api/job-post-optimizer/[id]/route.ts',
  'src/app/api/job-post-optimizer/autofill/route.ts',
  'src/app/api/job-post-optimizer/route.ts',
  'src/app/api/job-posting/buy-credits/route.ts',
  'src/app/api/job-posting/checkout/route.ts',
  'src/app/api/job-posting/credits/route.ts',
  'src/app/api/job-posting/upsell-checkout/route.ts',
  'src/app/api/jobbot/route.ts',
  'src/app/api/jobs/[id]/route.ts',
  'src/app/api/jobs/[id]/stats/route.ts',
  'src/app/api/jobs/application-status/route.ts',
  'src/app/api/jobs/apply/route.ts',
  'src/app/api/jobs/regional/assign/route.ts',
  'src/app/api/jobs/report/route.ts',
  'src/app/api/jobs/upsells/route.ts',
  'src/app/api/profile/applications/archive/route.ts',
  'src/app/api/profile/applications/route.ts',
  'src/app/api/profile/jobseeker/route.ts',
  'src/app/api/profile/onboarding/route.ts',
  'src/app/api/profile/saved-jobs/route.ts',
  'src/app/api/profile/update/route.ts',
  'src/app/api/profile/upload/route.ts',
  'src/app/api/resume/parse/enhanced-route.ts',
  'src/app/api/resume/parse/route.ts',
  'src/app/api/search-history/route.ts',
  'src/app/api/should-i-apply/route.ts',
  'src/app/api/stripe/create-checkout-session/route.ts',
  'src/app/api/stripe/create-portal-session/route.ts',
  'src/app/api/stripe/subscription/change/route.ts',
  'src/app/api/support/bulk-upload/route.ts',
  'src/app/api/support/genie/route.ts',
  'src/app/api/test/add-credits/route.ts',
  'src/app/api/user-profile/route.ts',

  // App pages
  'src/app/dashboard/page.tsx',
  'src/app/employers/create-job-post/page.tsx',
  'src/app/employers/job/[id]/edit/page.tsx',
  'src/app/employers/job/[id]/page.tsx',
  'src/app/employers/my-jobs/page.tsx',
  'src/app/employers/onboarding/page.tsx',
  'src/app/employers/post-job-simple/page.tsx',
  'src/app/employers/settings-simple/page.tsx',
  'src/app/employers/settings/profile/page.tsx',
  'src/app/employers/upgrade/page.tsx',
  'src/app/jobs/[id]/page.tsx',
  'src/app/onboarding/employer/page.tsx',
  'src/app/onboarding/jobseeker/page.tsx',
  'src/app/onboarding/page.tsx',
  'src/app/profile/applications/page.tsx',
  'src/app/profile/settings/page.tsx',
  'src/app/test-resume/page.tsx',

  // Components
  'src/components/auth/ProfileIcon.tsx',
  'src/components/chat/ChatHistory.tsx',
  'src/components/onboarding/OnboardingWizard.tsx',
  'src/components/pricing/InteractivePricingCard.tsx',
  'src/components/pricing/PricingCard.tsx',

  // Hooks and libs
  'src/hooks/usePermissions.ts',
  'src/lib/middleware/ai-security.ts',
  'src/lib/middleware/api.ts',
];

// Replacement patterns
const replacements = [
  // Import replacements
  {
    pattern: /import\s+{\s*auth\s*}\s+from\s+["']@\/auth["'];?/g,
    replacement: "import { auth } from '@clerk/nextjs/server';",
  },
  {
    pattern:
      /import\s+{\s*auth\s+as\s+getServerSession\s*}\s+from\s+["']@\/auth["'];?/g,
    replacement: "import { auth } from '@clerk/nextjs/server';",
  },
  {
    pattern: /import\s+type\s+{\s*Session\s*}\s+from\s+["']next-auth["'];?/g,
    replacement: "import { prisma } from '@/lib/database/prisma';",
  },
  {
    pattern: /import\s+{\s*useSession\s*}\s+from\s+["']next-auth\/react["'];?/g,
    replacement: "import { useUser } from '@clerk/nextjs';",
  },
  {
    pattern: /import\s+{\s*ActionResult\s*}\s+from\s+["']\.\/auth["'];?/g,
    replacement: '// ActionResult type removed - using standard return types',
  },

  // Function call replacements
  {
    pattern:
      /const\s+session\s*=\s*await\s+auth\(\)\s*as\s+Session\s*\|\s*null;?/g,
    replacement: `const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });`,
  },
  {
    pattern:
      /const\s+session\s*=\s*await\s+getServerSession\(\)\s*as\s+Session\s*\|\s*null;?/g,
    replacement: `const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });`,
  },
  {
    pattern: /const\s+{\s*data:\s*session\s*}\s*=\s*useSession\(\);?/g,
    replacement: 'const { user, isLoaded } = useUser();',
  },
  {
    pattern: /const\s+session\s*=\s*useSession\(\);?/g,
    replacement: 'const { user, isLoaded } = useUser();',
  },

  // Session checks
  {
    pattern: /if\s*\(\s*!session\?\.\s*user\s*\)\s*{/g,
    replacement: 'if (!user) {',
  },
  {
    pattern: /if\s*\(\s*!session\s*\)\s*{/g,
    replacement: 'if (!user) {',
  },
  {
    pattern: /session\!\.\s*user\?\.\s*email/g,
    replacement: 'user?.emailAddresses?.[0]?.emailAddress',
  },
  {
    pattern: /session\?\.\s*user\?\.\s*email/g,
    replacement: 'user?.emailAddresses?.[0]?.emailAddress',
  },
  {
    pattern: /session\!\.\s*user\?\.\s*name/g,
    replacement: 'user?.fullName',
  },
  {
    pattern: /session\?\.\s*user\?\.\s*name/g,
    replacement: 'user?.fullName',
  },
  {
    pattern: /session\!\.\s*user\?\.\s*role/g,
    replacement: 'user?.publicMetadata?.role',
  },
  {
    pattern: /session\?\.\s*user\?\.\s*role/g,
    replacement: 'user?.publicMetadata?.role',
  },
];

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply all replacements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting Clerk migration...\n');

  let updatedCount = 0;
  let totalCount = filesToUpdate.length;

  filesToUpdate.forEach(filePath => {
    if (updateFile(filePath)) {
      updatedCount++;
    }
  });

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Updated: ${updatedCount}/${totalCount} files`);
  console.log(`   Skipped: ${totalCount - updatedCount} files`);

  if (updatedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Run npm run type-check');
    console.log('   3. Fix any remaining issues manually');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, replacements };
