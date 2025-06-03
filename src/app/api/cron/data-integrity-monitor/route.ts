/**
 * Cron Job: Data Integrity Monitoring
 * Task 45.14: Fix Cascading Delete Risks and Data Integrity Constraints
 *
 * This endpoint runs automated data integrity checks and alerts if issues are found
 */

import { NextRequest, NextResponse } from 'next/server';
import { DataIntegrityService } from '@/lib/database/data-integrity';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const headersList = await headers();
    const cronSecret = headersList.get('x-cron-secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      console.error('Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting automated data integrity monitoring...');
    const startTime = Date.now();

    // Run data integrity monitoring
    const monitoringResult = await DataIntegrityService.monitorDataIntegrity();

    const duration = Date.now() - startTime;

    console.log(`Data integrity monitoring completed in ${duration}ms`);
    console.log(
      `Status: ${monitoringResult.status}, Issues: ${monitoringResult.totalIssues}`
    );

    // If issues found, also run validation for detailed report
    let validationResult = null;
    if (monitoringResult.totalIssues > 0) {
      console.log('Issues detected, running detailed validation...');
      validationResult = await DataIntegrityService.validateDataIntegrity();
    }

    // Prepare response
    const response = {
      success: true,
      message: 'Data integrity monitoring completed',
      duration,
      timestamp: new Date().toISOString(),
      monitoring: monitoringResult,
      validation: validationResult,
      recommendations: generateRecommendations(monitoringResult),
    };

    // Log critical issues
    if (monitoringResult.totalIssues > 0) {
      console.warn('⚠️ Data integrity issues detected:', {
        totalIssues: monitoringResult.totalIssues,
        issues: monitoringResult.issues,
      });
    } else {
      console.log('✅ Data integrity check passed - no issues found');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in data integrity monitoring:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Data integrity monitoring failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Generate recommendations based on integrity issues
 */
function generateRecommendations(monitoringResult: any): string[] {
  const recommendations: string[] = [];
  const { issues } = monitoringResult;

  // Orphaned jobs recommendations
  if (issues.orphanedJobs > 0) {
    recommendations.push(
      `Found ${issues.orphanedJobs} orphaned jobs. Consider running: UPDATE "Job" SET "companyId" = NULL WHERE "companyId" NOT IN (SELECT id FROM "Company" WHERE "deletedAt" IS NULL)`
    );
  }

  // Orphaned job applications recommendations
  if (issues.orphanedJobApplications > 0) {
    recommendations.push(
      `Found ${issues.orphanedJobApplications} orphaned job applications. Consider soft-deleting applications for deleted users/jobs.`
    );
  }

  // Orphaned user add-ons recommendations
  if (issues.orphanedUserAddOns > 0) {
    recommendations.push(
      `Found ${issues.orphanedUserAddOns} orphaned user add-ons. These may indicate billing inconsistencies that need manual review.`
    );
  }

  // Invalid subscription dates recommendations
  if (issues.invalidSubscriptionDates > 0) {
    recommendations.push(
      `Found ${issues.invalidSubscriptionDates} invalid subscription dates. Review and fix subscription date logic.`
    );
  }

  // General recommendations
  if (monitoringResult.totalIssues > 10) {
    recommendations.push(
      'High number of integrity issues detected. Consider running a comprehensive data cleanup operation.'
    );
  }

  if (monitoringResult.totalIssues === 0) {
    recommendations.push(
      'Data integrity is healthy. Continue regular monitoring.'
    );
  }

  return recommendations;
}
