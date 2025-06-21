/**
 * Fix Remaining TypeScript Errors Script
 * Fixes specific remaining import and syntax issues
 */

const fs = require('fs');
const path = require('path');

// Specific fixes for remaining problematic files
const specificFixes = {
  'src/app/admin/users/page.tsx': [
    {
      search: /import \{ Card \} from '@\/components\/ui\/select';/,
      replace: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';'
    },
    {
      search: /import \{\s*Table,\s*TableBody,\s*TableCell,\s*TableHead,\s*TableHeader,\s*TableRow\s*\} from 'lucide-react';/,
      replace: 'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from \'@/components/ui/table\';'
    },
    {
      search: /\s*DropdownMenu,\s*DropdownMenuContent,\s*DropdownMenuItem,\s*DropdownMenuTrigger\s*\} from '@\/components\/ui\/dropdown-menu';/,
      replace: 'import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from \'@/components/ui/dropdown-menu\';'
    },
    {
      search: /import \{ Input \} from '@\/components\/ui\/input';/,
      replace: 'import { Input } from \'@/components/ui/input\';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \'@/components/ui/select\';\nimport { Search, Filter, Download, UserPlus, MoreHorizontal, Eye, Edit, Trash2 } from \'lucide-react\';'
    }
  ],
  'src/app/api/alerts/route.ts': [
    {
      search: /\s*\} from '@\/lib\/cache\/pagination';/,
      replace: 'import { PaginationService } from \'@/lib/cache/pagination\';'
    }
  ],
  'src/app/api/chat-job-search/route.ts': [
    {
      search: /import \{\s*type AISecurityContext,\s*sanitizeUserData \} from '@\/lib\/middleware\/ai-security';/,
      replace: 'import { type AISecurityContext, sanitizeUserData } from \'@/lib/middleware/ai-security\';'
    }
  ],
  'src/app/dashboard/page.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect \} from 'react';/,
      replace: 'import React, { useState, useEffect } from \'react\';'
    }
  ],
  'src/app/employers/dashboard/page.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect, Suspense \} from 'react';/,
      replace: 'import React, { useState, useEffect, Suspense } from \'react\';'
    }
  ],
  'src/components/admin/RoleManagement.tsx': [
    {
      search: /\s*\} from 'lucide-react';/,
      replace: 'import { Shield, Users, Settings, Plus, Edit, Trash2 } from \'lucide-react\';'
    }
  ],
  'src/components/forms/ExampleRegistrationForm.tsx': [
    {
      search: /\s*\} from '@\/lib\/validations\/form-utils';/,
      replace: 'import { validateFormData, sanitizeInput } from \'@/lib/validations/form-utils\';'
    }
  ],
  'src/components/analytics/AdvancedAnalyticsDashboard.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect \} from 'react';/,
      replace: 'import React, { useState, useEffect } from \'react\';'
    }
  ],
  'src/components/analytics/business-dashboard.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect \} from '@\/components\/ui\/card';/,
      replace: 'import React, { useState, useEffect } from \'react\';\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';'
    }
  ],
  'src/components/dashboard/DashboardLayout.tsx': [
    {
      search: /import \{ React, \{ useState \} from 'react';/,
      replace: 'import React, { useState } from \'react\';'
    }
  ],
  'src/components/instagram/InstagramAnalyticsDashboard.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect \} from '@\/components\/ui\/card';/,
      replace: 'import React, { useState, useEffect } from \'react\';\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';'
    }
  ],
  'src/components/monitoring/performance-dashboard.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect, useCallback \} from '@\/components\/ui\/card';/,
      replace: 'import React, { useState, useEffect, useCallback } from \'react\';\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';'
    }
  ],
  'src/components/regional/RegionalLandingPage.tsx': [
    {
      search: /import \{ React, \{ useState, useEffect \} from '@\/components\/ui\/card';/,
      replace: 'import React, { useState, useEffect } from \'react\';\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';'
    }
  ],
  'src/lib/middleware/api.ts': [
    {
      search: /\s*\} from '\.\.\/monitoring\/error-monitor';/,
      replace: 'import { ErrorMonitor } from \'../monitoring/error-monitor\';'
    }
  ]
};

function fixSpecificFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const fixes = specificFixes[filePath];
    if (!fixes) {
      console.log(`⚠️  No specific fixes defined for: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    console.log(`🔧 Applying ${fixes.length} specific fixes to ${filePath}`);

    fixes.forEach((fix, index) => {
      const beforeContent = content;
      content = content.replace(fix.search, fix.replace);
      
      if (content !== beforeContent) {
        console.log(`  ✅ Applied fix ${index + 1}/${fixes.length}`);
        modified = true;
      } else {
        console.log(`  ⚠️  Fix ${index + 1}/${fixes.length} did not match`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Successfully fixed ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting remaining TypeScript error fixes...\n');
  
  const filesToFix = Object.keys(specificFixes);
  let fixedCount = 0;
  let totalCount = filesToFix.length;
  
  filesToFix.forEach(filePath => {
    if (fixSpecificFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Remaining Error Fix Summary:`);
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

module.exports = { fixSpecificFile };
