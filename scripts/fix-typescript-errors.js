/**
 * Fix TypeScript Import Errors Script
 * Fixes malformed import statements causing "Declaration or statement expected" errors
 */

const fs = require('fs');
const path = require('path');

// List of files with errors from the type-check output
const errorFiles = [
  'src/actions/alerts.ts',
  'src/app/admin/users/page.tsx',
  'src/app/alerts/analytics/page.tsx',
  'src/app/alerts/page.tsx',
  'src/app/api/ads/[id]/route.ts',
  'src/app/api/ads/route.ts',
  'src/app/api/ads/stats/route.ts',
  'src/app/api/alerts/[id]/route.ts',
  'src/app/api/alerts/[id]/test/route.ts',
  'src/app/api/alerts/route.ts',
  'src/app/api/chat-job-search/route.ts',
  'src/app/api/search/location/route.ts',
  'src/app/dashboard/page.tsx',
  'src/app/employers/applicants/page.tsx',
  'src/app/employers/dashboard/page.tsx',
  'src/app/signup/chamber-partner/page.tsx',
  'src/components/admin/AdCreationForm.tsx',
  'src/components/admin/AdManagementFilters.tsx',
  'src/components/admin/AdPreviewModal.tsx',
  'src/components/admin/AuditLogsDashboard.tsx',
  'src/components/admin/AutomatedReportsPanel.tsx',
  'src/components/admin/ReportsExportDashboard.tsx',
  'src/components/admin/RoleManagement.tsx',
  'src/components/admin/UserImpersonationPanel.tsx',
  'src/components/analytics/AdvancedAnalyticsDashboard.tsx',
  'src/components/analytics/business-dashboard.tsx',
  'src/components/dashboard/DashboardLayout.tsx',
  'src/components/dashboard/EmployerWidgets.tsx',
  'src/components/dashboard/JobSeekerWidgets.tsx',
  'src/components/employers/TeamManagement.tsx',
  'src/components/forms/ExampleRegistrationForm.tsx',
  'src/components/instagram/InstagramAnalyticsDashboard.tsx',
  'src/components/layout/DomainAwareHeader.tsx',
  'src/components/monitoring/performance-dashboard.tsx',
  'src/components/regional/RegionalLandingPage.tsx',
  'src/lib/cache/cache-migration-utility.ts',
  'src/lib/cache/enhanced-cache-services.ts',
  'src/lib/conversation/chatbot-service.ts',
  'src/lib/middleware/api.ts',
  'src/lib/search/services.ts',
];

function fixImportStatements(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // Split content into lines for easier processing
    const lines = content.split('\n');

    // Find lines with orphaned closing braces
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this line is an orphaned closing brace with 'from'
      if (trimmedLine.match(/^\} from ['"][^'"]+['"];?\s*$/)) {
        console.log(
          `🔧 Found orphaned closing brace at line ${i + 1} in ${filePath}`
        );

        // Extract the module path
        const moduleMatch = trimmedLine.match(
          /^\} from ['"]([^'"]+)['"];?\s*$/
        );
        if (!moduleMatch) continue;

        const modulePath = moduleMatch[1];
        const indentation = line.match(/^(\s*)/)[1];

        // Look backwards to find import items
        let importItems = [];
        let startIndex = i;

        // Search backwards for import items
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = lines[j].trim();

          // Stop if we hit an import statement, empty line, or comment
          if (
            prevLine.startsWith('import ') ||
            prevLine === '' ||
            prevLine.startsWith('//') ||
            prevLine.startsWith('/*') ||
            prevLine.startsWith('*') ||
            prevLine.startsWith('*/')
          ) {
            break;
          }

          // This line contains import items
          if (prevLine.length > 0) {
            // Clean up the line and add to import items
            const cleanedLine = prevLine.replace(/,$/, '').trim();
            if (cleanedLine.length > 0) {
              importItems.unshift(cleanedLine);
              startIndex = j;
            }
          }
        }

        if (importItems.length > 0) {
          // Create proper import statement
          const properImport = `${indentation}import {\n${importItems.map(item => `${indentation}  ${item}`).join(',\n')}\n${indentation}} from '${modulePath}';`;

          // Replace the problematic lines
          lines.splice(startIndex, i - startIndex + 1, properImport);

          // Update the content and mark as modified
          newContent = lines.join('\n');
          modified = true;

          console.log(
            `✅ Fixed import statement with ${importItems.length} items`
          );
          break; // Process one at a time to avoid index issues
        }
      }
    }

    // Additional pattern fixes
    newContent = newContent
      // Fix missing opening brace in imports
      .replace(
        /^(\s*)import\s+([^{].*?)\s*\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm,
        "$1import { $2 } from '$3';"
      )
      // Fix double import keywords
      .replace(/^(\s*)import\s+import\s+/gm, '$1import ')
      // Fix missing import keyword before { ... } from
      .replace(
        /^(\s*)\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm,
        "$1import { $2 } from '$3';"
      )
      // Fix type imports that are separated
      .replace(
        /^(\s*)type\s+([A-Za-z_$][A-Za-z0-9_$]*(?:\s*,\s*[A-Za-z_$][A-Za-z0-9_$]*)*)\s*,?\s*\n\s*\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm,
        "$1import { type $2 } from '$3';"
      );

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed import statements in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting TypeScript import error fixes...\n');

  let fixedCount = 0;
  let totalCount = errorFiles.length;

  errorFiles.forEach(filePath => {
    if (fixImportStatements(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 TypeScript Error Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);

  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run type-check');
    console.log('   2. Verify the fixes worked');
    console.log('   3. Address any remaining manual fixes');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportStatements };
