import { prisma } from '@/lib/database/prisma';
import { getCache, setCache, invalidateCache } from '@/components/ui/card';
import { DEFAULT_TTL } from '@/lib/cache/config';

/**
 * Data Integrity Service
 * Task 45.14: Fix Cascading Delete Risks and Data Integrity Constraints
 *
 * This service provides safe deletion operations and data integrity validation
 * to prevent cascading delete issues and maintain referential integrity.
 */


// Types for data integrity operations
export interface DeletionResult {
  success: boolean;
  entityId: string;
  entityType:
    | 'user'
    | 'company'
    | 'job'
    | 'jobApplication'
    | 'alert'
    | 'userAddOn';
  relatedRecords: Record<string, number>;
  auditRecordCreated: boolean;
  warnings?: string[];
  errors?: string[];
}

export interface IntegrityIssues {
  timestamp: Date;
  totalIssues: number;
  issues: {
    orphanedJobs: number;
    orphanedJobApplications: number;
    orphanedUserAddOns: number;
    invalidSubscriptionDates: number;
  };
  status: 'HEALTHY' | 'ISSUES_FOUND';
}

export interface CleanupResult {
  success: boolean;
  cutoffDate: Date;
  deletedCounts: Record<string, number>;
  totalDeleted: number;
}

/**
 * Data Integrity Service
 * Provides safe deletion operations and integrity validation
 */
export class DataIntegrityService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short;
  private static readonly CACHE_PREFIX = 'data_integrity';

  /**
   * Safely delete a user with proper cascade handling
   * Uses the safe_delete_user database function
   */
  static async safeDeleteUser(
    userId: string,
    deletionReason?: string,
    deletedBy?: string
  ): Promise<DeletionResult> {
    try {
      console.log(`Starting safe deletion of user: ${userId}`);

      // Call the database function for safe user deletion
      const result = await prisma.$queryRaw<any[]>`
        SELECT safe_delete_user(
          ${userId}::UUID,
          ${deletionReason || null},
          ${deletedBy || null}::UUID
        ) as result
      `;

      const deletionResult = result[0]?.result;

      if (!deletionResult?.success) {
        throw new Error('Safe user deletion failed');
      }

      // Invalidate related caches
      await this.invalidateUserCaches(userId);

      console.log(`User ${userId} safely deleted with audit trail`);

      return {
        success: true,
        entityId: userId,
        entityType: 'user',
        relatedRecords: deletionResult.relatedRecords || {},
        auditRecordCreated: deletionResult.auditRecordCreated || false,
      };
    } catch (error) {
      console.error('Error in safe user deletion:', error);

      return {
        success: false,
        entityId: userId,
        entityType: 'user',
        relatedRecords: {},
        auditRecordCreated: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Safely delete a company with proper cascade handling
   * Uses the safe_delete_company database function
   */
  static async safeDeleteCompany(
    companyId: string,
    deletionReason?: string,
    deletedBy?: string
  ): Promise<DeletionResult> {
    try {
      console.log(`Starting safe deletion of company: ${companyId}`);

      // Call the database function for safe company deletion
      const result = await prisma.$queryRaw<any[]>`
        SELECT safe_delete_company(
          ${companyId}::UUID,
          ${deletionReason || null},
          ${deletedBy || null}::UUID
        ) as result
      `;

      const deletionResult = result[0]?.result;

      if (!deletionResult?.success) {
        throw new Error('Safe company deletion failed');
      }

      // Invalidate related caches
      await this.invalidateCompanyCaches(companyId);

      console.log(`Company ${companyId} safely deleted with audit trail`);

      return {
        success: true,
        entityId: companyId,
        entityType: 'company',
        relatedRecords: deletionResult.relatedRecords || {},
        auditRecordCreated: deletionResult.auditRecordCreated || false,
      };
    } catch (error) {
      console.error('Error in safe company deletion:', error);

      return {
        success: false,
        entityId: companyId,
        entityType: 'company',
        relatedRecords: {},
        auditRecordCreated: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Soft delete a job with proper validation
   */
  static async softDeleteJob(
    jobId: string,
    deletedBy?: string,
    reason?: string
  ): Promise<DeletionResult> {
    try {
      console.log(`Starting soft deletion of job: ${jobId}`);

      // Check if job exists and is not already deleted
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          deletedAt: null,
        },
        include: {
          jobApplications: {
            where: { deletedAt: null },
            select: { id: true, userId: true },
          },
        },
      });

      if (!job) {
        throw new Error('Job not found or already deleted');
      }

      // Count related records
      const relatedRecords = {
        jobApplications: job.jobApplications.length,
      };

      // Soft delete the job and related applications
      await prisma.$transaction(async tx => {
        // Soft delete job applications first
        await tx.jobApplication.updateMany({
          where: { jobId, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        // Soft delete the job
        await tx.job.update({
          where: { id: jobId },
          data: { deletedAt: new Date() },
        });
      });

      // Invalidate related caches
      await this.invalidateJobCaches(jobId);

      console.log(`Job ${jobId} soft deleted successfully`);

      return {
        success: true,
        entityId: jobId,
        entityType: 'job',
        relatedRecords,
        auditRecordCreated: false, // No audit table for jobs yet
      };
    } catch (error) {
      console.error('Error in soft job deletion:', error);

      return {
        success: false,
        entityId: jobId,
        entityType: 'job',
        relatedRecords: {},
        auditRecordCreated: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Validate data integrity across the database
   * Uses the validate_data_integrity database function
   */
  static async validateDataIntegrity(): Promise<IntegrityIssues> {
    const cacheKey = `${this.CACHE_PREFIX}:integrity_check`;

    try {
      // Check cache first (short TTL for integrity checks)
      const cached = await getCache<IntegrityIssues>(cacheKey);
      if (cached) return cached;

      console.log('Running data integrity validation...');

      // Call the database function for integrity validation
      const result = await prisma.$queryRaw<any[]>`
        SELECT validate_data_integrity() as result
      `;

      const integrityResult = result[0]?.result;

      if (!integrityResult) {
        throw new Error('Failed to validate data integrity');
      }

      const issues: IntegrityIssues = {
        timestamp: new Date(integrityResult.timestamp),
        totalIssues: Object.values(integrityResult.issues).reduce(
          (sum: number, count: any) => sum + Number(count),
          0
        ),
        issues: {
          orphanedJobs: Number(integrityResult.issues.orphanedJobs),
          orphanedJobApplications: Number(
            integrityResult.issues.orphanedJobApplications
          ),
          orphanedUserAddOns: Number(integrityResult.issues.orphanedUserAddOns),
          invalidSubscriptionDates: Number(
            integrityResult.issues.invalidSubscriptionDates
          ),
        },
        status:
          integrityResult.issues.orphanedJobs > 0 ||
          integrityResult.issues.orphanedJobApplications > 0 ||
          integrityResult.issues.orphanedUserAddOns > 0 ||
          integrityResult.issues.invalidSubscriptionDates > 0
            ? 'ISSUES_FOUND'
            : 'HEALTHY',
      };

      // Cache the result for a short time
      await setCache(cacheKey, issues, { ttl: this.CACHE_TTL });

      console.log(
        `Data integrity check completed. Status: ${issues.status}, Issues: ${issues.totalIssues}`
      );

      return issues;
    } catch (error) {
      console.error('Error validating data integrity:', error);

      return {
        timestamp: new Date(),
        totalIssues: -1,
        issues: {
          orphanedJobs: 0,
          orphanedJobApplications: 0,
          orphanedUserAddOns: 0,
          invalidSubscriptionDates: 0,
        },
        status: 'ISSUES_FOUND',
      };
    }
  }

  /**
   * Monitor data integrity and alert if issues found
   * Uses the monitor_data_integrity database function
   */
  static async monitorDataIntegrity(): Promise<
    IntegrityIssues & { alertTriggered: boolean }
  > {
    try {
      console.log('Running data integrity monitoring...');

      // Call the database function for integrity monitoring
      const result = await prisma.$queryRaw<any[]>`
        SELECT monitor_data_integrity() as result
      `;

      const monitorResult = result[0]?.result;

      if (!monitorResult) {
        throw new Error('Failed to monitor data integrity');
      }

      const issues: IntegrityIssues & { alertTriggered: boolean } = {
        timestamp: new Date(monitorResult.timestamp),
        totalIssues: Number(monitorResult.totalIssues),
        issues: {
          orphanedJobs: Number(monitorResult.details.issues.orphanedJobs),
          orphanedJobApplications: Number(
            monitorResult.details.issues.orphanedJobApplications
          ),
          orphanedUserAddOns: Number(
            monitorResult.details.issues.orphanedUserAddOns
          ),
          invalidSubscriptionDates: Number(
            monitorResult.details.issues.invalidSubscriptionDates
          ),
        },
        status: monitorResult.status,
        alertTriggered: monitorResult.totalIssues > 0,
      };

      // If issues found, invalidate integrity cache
      if (issues.totalIssues > 0) {
        await invalidateCache(`${this.CACHE_PREFIX}:integrity_check`);
      }

      console.log(
        `Data integrity monitoring completed. Status: ${issues.status}, Issues: ${issues.totalIssues}`
      );

      return issues;
    } catch (error) {
      console.error('Error monitoring data integrity:', error);

      return {
        timestamp: new Date(),
        totalIssues: -1,
        issues: {
          orphanedJobs: 0,
          orphanedJobApplications: 0,
          orphanedUserAddOns: 0,
          invalidSubscriptionDates: 0,
        },
        status: 'ISSUES_FOUND',
        alertTriggered: true,
      };
    }
  }

  /**
   * Clean up soft-deleted records older than specified days
   * Uses the cleanup_soft_deleted_records database function
   */
  static async cleanupSoftDeletedRecords(
    daysOld: number = 90
  ): Promise<CleanupResult> {
    try {
      console.log(
        `Starting cleanup of soft-deleted records older than ${daysOld} days...`
      );

      // Call the database function for cleanup
      const result = await prisma.$queryRaw<any[]>`
        SELECT cleanup_soft_deleted_records(${daysOld}) as result
      `;

      const cleanupResult = result[0]?.result;

      if (!cleanupResult?.success) {
        throw new Error('Cleanup of soft-deleted records failed');
      }

      const totalDeleted = Object.values(cleanupResult.deletedCounts).reduce(
        (sum: number, count: any) => sum + Number(count),
        0
      );

      console.log(
        `Cleanup completed. Total records permanently deleted: ${totalDeleted}`
      );

      return {
        success: true,
        cutoffDate: new Date(cleanupResult.cutoffDate),
        deletedCounts: cleanupResult.deletedCounts,
        totalDeleted,
      };
    } catch (error) {
      console.error('Error cleaning up soft-deleted records:', error);

      return {
        success: false,
        cutoffDate: new Date(),
        deletedCounts: {},
        totalDeleted: 0,
      };
    }
  }

  /**
   * Get deletion audit records for a user
   */
  static async getUserDeletionAudit(userId: string): Promise<any[]> {
    try {
      const auditRecords = await prisma.$queryRaw<any[]>`
        SELECT * FROM "UserDeletionAudit" 
        WHERE "userId" = ${userId}::UUID 
        ORDER BY "deletedAt" DESC
      `;

      return auditRecords;
    } catch (error) {
      console.error('Error fetching user deletion audit:', error);
      return [];
    }
  }

  /**
   * Get deletion audit records for a company
   */
  static async getCompanyDeletionAudit(companyId: string): Promise<any[]> {
    try {
      const auditRecords = await prisma.$queryRaw<any[]>`
        SELECT * FROM "CompanyDeletionAudit" 
        WHERE "companyId" = ${companyId}::UUID 
        ORDER BY "deletedAt" DESC
      `;

      return auditRecords;
    } catch (error) {
      console.error('Error fetching company deletion audit:', error);
      return [];
    }
  }

  /**
   * Get billing audit records for a user
   */
  static async getBillingAudit(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const auditRecords = await prisma.$queryRaw<any[]>`
        SELECT * FROM "BillingAudit" 
        WHERE "userId" = ${userId}::UUID 
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;

      return auditRecords;
    } catch (error) {
      console.error('Error fetching billing audit:', error);
      return [];
    }
  }

  /**
   * Restore a soft-deleted user (if within restoration window)
   */
  static async restoreSoftDeletedUser(
    userId: string,
    restoredBy?: string
  ): Promise<DeletionResult> {
    try {
      console.log(`Attempting to restore soft-deleted user: ${userId}`);

      // Check if user is soft-deleted and within restoration window (e.g., 30 days)
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: {
            not: null,
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      });

      if (!user) {
        throw new Error('User not found or outside restoration window');
      }

      // Restore user and related records
      await prisma.$transaction(async tx => {
        // Restore user
        await tx.user.update({
          where: { id: userId },
          data: { deletedAt: null },
        });

        // Restore related records
        await tx.userAddOn.updateMany({
          where: { userId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });

        await tx.alert.updateMany({
          where: { userId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });

        await tx.jobApplication.updateMany({
          where: { userId, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
      });

      // Invalidate caches
      await this.invalidateUserCaches(userId);

      console.log(`User ${userId} restored successfully`);

      return {
        success: true,
        entityId: userId,
        entityType: 'user',
        relatedRecords: {},
        auditRecordCreated: false,
      };
    } catch (error) {
      console.error('Error restoring soft-deleted user:', error);

      return {
        success: false,
        entityId: userId,
        entityType: 'user',
        relatedRecords: {},
        auditRecordCreated: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Invalidate user-related caches
   */
  private static async invalidateUserCaches(userId: string): Promise<void> {
    try {
      await Promise.all([
        invalidateCache(`users:profile:${userId}`),
        invalidateCache(`users:applications:${userId}`),
        invalidateCache(`jobs:employer:${userId}`),
        invalidateCache(`${this.CACHE_PREFIX}:integrity_check`),
      ]);
    } catch (error) {
      console.error('Error invalidating user caches:', error);
    }
  }

  /**
   * Invalidate company-related caches
   */
  private static async invalidateCompanyCaches(
    companyId: string
  ): Promise<void> {
    try {
      await Promise.all([
        invalidateCache(`companies:${companyId}`),
        invalidateCache(`jobs:company:${companyId}`),
        invalidateCache(`${this.CACHE_PREFIX}:integrity_check`),
      ]);
    } catch (error) {
      console.error('Error invalidating company caches:', error);
    }
  }

  /**
   * Invalidate job-related caches
   */
  private static async invalidateJobCaches(jobId: string): Promise<void> {
    try {
      await Promise.all([
        invalidateCache(`jobs:single:${jobId}`),
        invalidateCache(`jobs:paginated:*`),
        invalidateCache(`search:jobs:*`),
        invalidateCache(`${this.CACHE_PREFIX}:integrity_check`),
      ]);
    } catch (error) {
      console.error('Error invalidating job caches:', error);
    }
  }

  /**
   * Get soft-deleted records for recovery
   */
  static async getSoftDeletedRecords(
    entityType:
      | 'user'
      | 'company'
      | 'job'
      | 'jobApplication'
      | 'alert'
      | 'userAddOn',
    limit: number = 50
  ): Promise<any[]> {
    try {
      const tableName = this.getTableName(entityType);

      const records = await prisma.$queryRawUnsafe(`
        SELECT * FROM "${tableName}" 
        WHERE "deletedAt" IS NOT NULL 
        ORDER BY "deletedAt" DESC 
        LIMIT ${limit}
      `);

      return records as any[];
    } catch (error) {
      console.error('Error fetching soft-deleted records:', error);
      return [];
    }
  }

  /**
   * Get table name for entity type
   */
  private static getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      user: 'User',
      company: 'Company',
      job: 'Job',
      jobApplication: 'JobApplication',
      alert: 'Alert',
      userAddOn: 'UserAddOn',
    };

    return tableMap[entityType] || entityType;
  }
}

export default DataIntegrityService;
