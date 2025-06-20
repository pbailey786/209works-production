#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with duplicate prisma imports that need fixing
const filesToFix = [
  'src/app/admin/ads/[id]/edit/page.tsx',
  'src/app/admin/ads/page.tsx',
  'src/app/admin/credits/page.tsx',
  'src/app/admin/moderation/jobs/[id]/page.tsx',
  'src/app/admin/moderation/jobs/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/api/addons/apply/route.ts',
  'src/app/api/addons/purchase/route.ts',
  'src/app/api/admin/ai-analytics/route.ts',
  'src/app/api/admin/analytics-stats/route.ts',
  'src/app/api/admin/audit-logs/route.ts',
  'src/app/api/admin/backup/download/route.ts',
  'src/app/api/admin/backup/restore/route.ts',
  'src/app/api/admin/backup/route.ts',
  'src/app/api/admin/backup/status/route.ts',
  'src/app/api/admin/bulk-actions/route.ts',
  'src/app/api/admin/credits/assign/route.ts',
  'src/app/api/admin/data-integrity/route.ts',
  'src/app/api/admin/database-performance/route.ts',
  'src/app/api/admin/database-status/route.ts',
  'src/app/api/admin/deploy-chat-history/route.ts',
  'src/app/api/admin/duplicate-monitoring/route.ts',
  'src/app/api/admin/email/send/route.ts',
  'src/app/api/admin/email/status/route.ts',
  'src/app/api/admin/email/templates/[templateId]/preview/route.ts',
  'src/app/api/admin/email/templates/route.ts',
  'src/app/api/admin/email/test/route.ts',
  'src/app/api/admin/export-analytics/route.ts',
  'src/app/api/admin/health/route.ts',
  'src/app/api/admin/jobs/[id]/moderate/route.ts',
  'src/app/api/admin/jobs/bulk-moderate/route.ts',
  'src/app/api/admin/jobsgpt-stats/route.ts',
  'src/app/api/admin/migrate-database/route.ts',
  'src/app/api/admin/payment-retry/route.ts',
  'src/app/api/admin/reports/export/route.ts',
  'src/app/api/admin/run-migration/route.ts',
  'src/app/api/admin/system-alerts/route.ts',
  'src/app/api/admin/system-health/route.ts',
  'src/app/api/admin/test-connection/route.ts',
  'src/app/api/admin/update-user-role/route.ts',
  'src/app/api/ai/duplicate-check/route.ts',
  'src/app/api/alerts/analytics/route.ts',
  'src/app/api/alerts/route.ts',
  'src/app/api/chat-history/route.ts',
  'src/app/api/company-profile/route.ts',
  'src/app/api/credits/history/route.ts',
  'src/app/api/debug/current-user/route.ts',
  'src/app/api/debug/database-status/route.ts',
  'src/app/api/debug/email/route.ts',
  'src/app/api/debug/env-check/route.ts',
  'src/app/api/debug/resume-parse-minimal/route.ts',
  'src/app/api/debug/resume-parse/route.ts',
  'src/app/api/email-alerts/[id]/route.ts',
  'src/app/api/email-alerts/route.ts',
  'src/app/api/email/test-integration/route.ts',
  'src/app/api/employers/applicants/[id]/route.ts',
  'src/app/api/employers/applicants/route.ts',
  'src/app/api/employers/applications/route.ts',
  'src/app/api/employers/bulk-upload/approve/route.ts',
  'src/app/api/employers/bulk-upload/route.ts',
  'src/app/api/employers/candidates/[id]/notes/route.ts',
  'src/app/api/employers/candidates/[id]/route.ts',
  'src/app/api/employers/candidates/[id]/status/route.ts',
  'src/app/api/employers/contact-applicant/route.ts',
  'src/app/api/employers/knowledge/route.ts',
  'src/app/api/employers/logo/route.ts',
  'src/app/api/employers/my-jobs/route.ts',
  'src/app/api/employers/onboarding/route.ts',
  'src/app/api/employers/resumes/bulk-download/route.ts',
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
  'src/app/api/job-posting/checkout/route.ts',
  'src/app/api/job-posting/upsell-checkout/route.ts',
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
  'src/app/api/stripe/create-checkout-session/route.ts',
  'src/app/api/stripe/create-portal-session/route.ts',
  'src/app/api/stripe/subscription/change/route.ts',
  'src/app/api/support/bulk-upload/route.ts',
  'src/app/api/support/genie/route.ts',
  'src/app/api/test/add-credits/route.ts',
  'src/app/api/user-profile/route.ts',
  'src/app/dashboard/page.tsx',
  'src/app/employers/job/[id]/edit/page.tsx',
  'src/app/jobs/[id]/page.tsx',
  'src/app/onboarding/employer/page.tsx',
  'src/app/onboarding/jobseeker/page.tsx',
  'src/app/onboarding/page.tsx',
  'src/app/profile/applications/page.tsx',
  'src/app/profile/settings/page.tsx',
  'src/lib/middleware/ai-security.ts',
];

// Replacement patterns for common issues
const replacements = [
  // Remove duplicate prisma imports
  {
    pattern: /import\s+{\s*prisma\s*}\s+from\s+['"][^'"]*['"];\s*\n\s*import\s+{\s*prisma\s*}\s+from\s+['"]@\/lib\/database\/prisma['"];?/g,
    replacement: "import { prisma } from '@/lib/database/prisma';"
  },
  
  // Fix user property access
  {
    pattern: /user\?\.\s*emailAddresses\?\.\[0\]\?\.\s*emailAddress/g,
    replacement: "user?.email"
  },
  {
    pattern: /user\?\.\s*fullName/g,
    replacement: "user?.name"
  },
  {
    pattern: /user\?\.\s*publicMetadata\?\.\s*role/g,
    replacement: "user?.role"
  },
  
  // Fix session references
  {
    pattern: /session\!\.\s*user\?\.\s*email/g,
    replacement: "user?.email"
  },
  {
    pattern: /session\?\.\s*user\?\.\s*email/g,
    replacement: "user?.email"
  },
  {
    pattern: /session\!\.\s*user\?\.\s*name/g,
    replacement: "user?.name"
  },
  {
    pattern: /session\?\.\s*user\?\.\s*name/g,
    replacement: "user?.name"
  },
  
  // Fix variable redeclaration
  {
    pattern: /const\s+user\s*=\s*await\s+prisma\.user\.findUnique\(\{\s*where:\s*{\s*clerkId:\s*userId\s*},?\s*\}\);\s*\n\s*if\s*\(\s*!user\?\.\s*email\s*\)\s*\{\s*return\s+NextResponse\.json\(\{\s*error:\s*['"]Unauthorized['"],?\s*\},?\s*\{\s*status:\s*401\s*\}\);\s*\}\s*\n\s*const\s+user\s*=/g,
    replacement: `const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser =`
  },
  
  // Add missing imports
  {
    pattern: /Cannot find name 'redirect'/g,
    replacement: "import { redirect } from 'next/navigation';"
  },
  
  // Fix useSession to useUser
  {
    pattern: /const\s*{\s*data:\s*session,\s*status\s*}\s*=\s*useUser\(\);/g,
    replacement: "const { user, isLoaded } = useUser();"
  },
  {
    pattern: /const\s*session\s*=\s*useUser\(\);/g,
    replacement: "const { user, isLoaded } = useUser();"
  },
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all replacements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test && pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    // Remove duplicate imports manually
    const lines = content.split('\n');
    const seenImports = new Set();
    const filteredLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import') && line.includes('prisma')) {
        if (!seenImports.has(line.trim())) {
          seenImports.add(line.trim());
          filteredLines.push(line);
        } else {
          modified = true; // Skip duplicate
        }
      } else {
        filteredLines.push(line);
      }
    }
    
    if (modified) {
      content = filteredLines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting remaining error fixes...\n');
  
  let fixedCount = 0;
  let totalCount = filesToFix.length;
  
  filesToFix.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Fix Summary:`);
  console.log(`   Fixed: ${fixedCount}/${totalCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Run npm run type-check');
    console.log('   3. Address any remaining manual fixes');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, replacements };
