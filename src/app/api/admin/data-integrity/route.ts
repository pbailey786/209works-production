/**
 * Admin API: Data Integrity Management
 * Task 45.14: Fix Cascading Delete Risks and Data Integrity Constraints
 *
 * This endpoint provides data integrity monitoring, validation, and safe deletion operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DataIntegrityService } from '@/lib/database/data-integrity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'validate';

    console.log(`Data integrity operation requested: ${operation}`);
    const startTime = Date.now();

    let result: any;

    switch (operation) {
      case 'validate':
        result = await DataIntegrityService.validateDataIntegrity();
        break;

      case 'monitor':
        result = await DataIntegrityService.monitorDataIntegrity();
        break;

      case 'soft-deleted':
        const entityType = searchParams.get('entityType') as any;
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!entityType) {
          return NextResponse.json(
            {
              error: 'entityType parameter required for soft-deleted operation',
            },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.getSoftDeletedRecords(
          entityType,
          limit
        );
        break;

      case 'user-audit':
        const userId = searchParams.get('userId');

        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter required for user-audit operation' },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.getUserDeletionAudit(userId);
        break;

      case 'company-audit':
        const companyId = searchParams.get('companyId');

        if (!companyId) {
          return NextResponse.json(
            {
              error: 'companyId parameter required for company-audit operation',
            },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.getCompanyDeletionAudit(companyId);
        break;

      case 'billing-audit':
        const auditUserId = searchParams.get('userId');
        const auditLimit = parseInt(searchParams.get('limit') || '50');

        if (!auditUserId) {
          return NextResponse.json(
            { error: 'userId parameter required for billing-audit operation' },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.getBillingAudit(
          auditUserId,
          auditLimit
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      operation,
      data: result,
      queryTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in data integrity operation:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Data integrity operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, ...params } = body;

    console.log(`Data integrity POST operation: ${operation}`, params);
    const startTime = Date.now();

    let result: any;

    switch (operation) {
      case 'safe-delete-user':
        const { userId, deletionReason, deletedBy } = params;

        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for safe-delete-user operation' },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.safeDeleteUser(
          userId,
          deletionReason,
          deletedBy || (session.user as any).id
        );
        break;

      case 'safe-delete-company':
        const {
          companyId,
          deletionReason: companyReason,
          deletedBy: companyDeletedBy,
        } = params;

        if (!companyId) {
          return NextResponse.json(
            {
              error: 'companyId is required for safe-delete-company operation',
            },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.safeDeleteCompany(
          companyId,
          companyReason,
          companyDeletedBy || (session.user as any).id
        );
        break;

      case 'soft-delete-job':
        const { jobId, reason } = params;

        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId is required for soft-delete-job operation' },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.softDeleteJob(
          jobId,
          (session.user as any).id,
          reason
        );
        break;

      case 'restore-user':
        const { userId: restoreUserId } = params;

        if (!restoreUserId) {
          return NextResponse.json(
            { error: 'userId is required for restore-user operation' },
            { status: 400 }
          );
        }

        result = await DataIntegrityService.restoreSoftDeletedUser(
          restoreUserId,
          (session.user as any).id
        );
        break;

      case 'cleanup-soft-deleted':
        const { daysOld = 90 } = params;

        result = await DataIntegrityService.cleanupSoftDeletedRecords(daysOld);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      operation,
      data: result,
      queryTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in data integrity POST operation:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Data integrity operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
