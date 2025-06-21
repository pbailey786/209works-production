#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with duplicate import issues based on TypeScript errors
const filesToFix = [
  'src/app/jobs/[id]/JobDetailClient.tsx',
  'src/components/admin/AdEditForm.tsx',
  'src/components/admin/AdminRecentActivity.tsx',
  'src/components/admin/AdminSystemStatus.tsx',
  'src/components/admin/AuditLogsDashboard.tsx',
  'src/components/admin/CreditManagementDashboard.tsx',
  'src/components/admin/JobModerationDetail.tsx',
  'src/components/admin/JobModerationTable.tsx',
  'src/components/admin/MemoryLeakMonitoringDashboard.tsx',
  'src/components/admin/ReportsExportDashboard.tsx',
  'src/components/admin/SystemHealthDashboard.tsx',
  'src/components/ads/InstagramPostAd.tsx',
  'src/components/analytics/business-dashboard.tsx',
  'src/components/analytics/ConsentBanner.tsx',
  'src/components/analytics/FunnelAnalyticsDashboard.tsx',
  'src/components/analytics/RegionalAnalyticsDashboard.tsx',
  'src/components/emails/application-status-email.tsx',
  'src/components/emails/company-newsletter-email.tsx',
  'src/components/emails/credit-confirmation-email.tsx',
  'src/components/emails/interview-invitation-email.tsx',
  'src/components/emails/job-alert-email.tsx',
  'src/components/emails/password-reset-email.tsx',
  'src/components/emails/platform-notice-email.tsx',
  'src/components/emails/weekly-digest-email.tsx',
  'src/components/emails/welcome-employer-email.tsx',
  'src/components/emails/welcome-job-seeker-email.tsx',
  'src/components/forms/ExampleRegistrationForm.tsx',
  'src/components/instagram/InstagramAnalyticsDashboard.tsx',
  'src/components/job-posting/BuyCreditsModal.tsx',
  'src/components/job-posting/CreditPackageModal.tsx',
  'src/components/job-posting/JobPostingUpsellModal.tsx',
  'src/components/job-posting/JobUpsellModal.tsx',
  'src/components/job-posting/JobUpsellSelector.tsx',
  'src/components/job-posting/PromotionUpsellPopup.tsx',
  'src/components/JobApplicationModal.tsx',
  'src/components/JobGenie.tsx',
  'src/components/monitoring/performance-dashboard.tsx',
  'src/components/onboarding/CreditSystemExplanationModal.tsx',
  'src/components/onboarding/OnboardingWizard.tsx',
  'src/components/onboarding/WelcomeBanner.tsx',
  'src/components/PerformanceProvider.tsx',
  'src/components/pricing/PricingCard.tsx',
  'src/components/regional/RegionalLandingPage.tsx',
  'src/components/ShouldIApplyCalculator.tsx',
  'src/components/ui/accessible-modal.tsx',
  'src/components/ui/comprehensive-ui-provider.tsx',
  'src/components/ui/context-menu.tsx',
  'src/components/ui/date-range-picker.tsx',
  'src/components/ui/toaster.tsx',
  'src/lib/analytics/session-tracker.ts',
  'src/lib/conversation/manager.ts',
  'src/lib/email/templates/employer-candidate-contact.tsx',
  'src/scripts/finalizeCacheSystemMigration.ts',
  'src/scripts/optimizeTasksFile.ts'
];

function fixDuplicateImports(filePath) {
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
      const nextLine = lines[i + 1];
      
      // Check for duplicate "import {" pattern
      if (line.trim() === 'import {' && nextLine && nextLine.trim() === 'import {') {
        // Skip the duplicate line
        modified = true;
        console.log(`Fixed duplicate import in ${filePath} at line ${i + 1}`);
        continue;
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

console.log('🔧 Fixing duplicate import statements...\n');

filesToFix.forEach(fixDuplicateImports);

console.log('\n✨ Import fixing complete!');
