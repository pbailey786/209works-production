import { prisma } from '@/lib/database/prisma';
import { Job } from '@prisma/client';

export interface DuplicateAlert {
  id: string;
  originalJobId: string;
  duplicateJobId: string;
  similarityScore: number;
  detectionMethod: string;
  detectedAt: Date;
  reviewStatus: 'pending' | 'confirmed' | 'false_positive' | 'ignored';
  reviewedAt?: Date;
  reviewedBy?: string;
  actionTaken?: string;
  notes?: string;
}

export interface JobPostingPattern {
  id: string;
  employerId: string;
  companyName: string;
  titlePattern: string;
  postingFrequency: number;
  suspiciousScore: number;
  flaggedForReview: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export class DuplicateDetectionService {
  /**
   * Get all pending duplicate alerts for admin review
   */
  static async getPendingDuplicateAlerts(limit = 50) {
    return await prisma.$queryRaw`
      SELECT * FROM "DuplicateJobsView" 
      WHERE "reviewStatus" = 'pending'
      ORDER BY "similarityScore" DESC, "detectedAt" DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get duplicate alerts for a specific employer
   */
  static async getEmployerDuplicateAlerts(employerId: string) {
    return await prisma.$queryRaw`
      SELECT * FROM "DuplicateJobsView" 
      WHERE "original_employer_id" = ${employerId} 
         OR "duplicate_employer_id" = ${employerId}
      ORDER BY "detectedAt" DESC
    `;
  }

  /**
   * Review a duplicate alert (admin action)
   */
  static async reviewDuplicateAlert(
    alertId: string, 
    reviewStatus: 'confirmed' | 'false_positive' | 'ignored',
    reviewedBy: string,
    actionTaken?: string,
    notes?: string
  ) {
    const alert = await prisma.$queryRaw`
      UPDATE "DuplicateJobAlert" 
      SET 
        "reviewStatus" = ${reviewStatus},
        "reviewedAt" = NOW(),
        "reviewedBy" = ${reviewedBy},
        "actionTaken" = ${actionTaken || ''},
        "notes" = ${notes || ''}
      WHERE id = ${alertId}
      RETURNING *
    `;

    // If confirmed as duplicate, take action on the duplicate job
    if (reviewStatus === 'confirmed' && actionTaken) {
      const alertData = await prisma.duplicateJobAlert.findUnique({
        where: { id: alertId },
        select: { duplicateJobId: true }
      });

      if (alertData) {
        switch (actionTaken) {
          case 'removed':
            await prisma.job.update({
              where: { id: alertData.duplicateJobId },
              data: { 
                status: 'removed',
                deletedAt: new Date()
              }
            });
            break;
          case 'flagged':
            await prisma.job.update({
              where: { id: alertData.duplicateJobId },
              data: { flaggedAsDuplicate: true }
            });
            break;
        }
      }
    }

    return alert;
  }

  /**
   * Get posting patterns for suspicious activity monitoring
   */
  static async getSuspiciousPostingPatterns(threshold = 0.7) {
    return await prisma.$queryRaw`
      SELECT 
        jpp.*,
        u.email as employer_email,
        u.name as employer_name,
        COUNT(j.id) as total_jobs_posted
      FROM "JobPostingPattern" jpp
      JOIN "User" u ON jpp."employerId" = u.id
      LEFT JOIN "Job" j ON j."employerId" = jpp."employerId" 
        AND j."deletedAt" IS NULL
        AND j."createdAt" >= jpp."firstSeenAt"
      WHERE jpp."suspiciousScore" >= ${threshold}
         OR jpp."postingFrequency" > 10
         OR jpp."flaggedForReview" = true
      GROUP BY jpp.id, u.email, u.name
      ORDER BY jpp."suspiciousScore" DESC, jpp."postingFrequency" DESC
    `;
  }

  /**
   * Update posting pattern for an employer
   */
  static async updatePostingPattern(job: Job) {
    // Calculate pattern data
    const titlePattern = this.extractTitlePattern(job.title);
    const locationPattern = job.location;
    const salaryPattern = job.salaryMin && job.salaryMax 
      ? `${job.salaryMin}-${job.salaryMax}` 
      : job.salaryMin?.toString() || job.salaryMax?.toString() || 'unspecified';

    // Check if pattern exists
    const existingPattern = await prisma.$queryRaw`
      SELECT * FROM "JobPostingPattern" 
      WHERE "employerId" = ${job.employerId}
        AND "companyName" = ${job.company}
        AND "titlePattern" = ${titlePattern}
      LIMIT 1
    `;

    if (Array.isArray(existingPattern) && existingPattern.length > 0) {
      // Update existing pattern
      const pattern = existingPattern[0] as any;
      const newFrequency = pattern.postingFrequency + 1;
      const suspiciousScore = this.calculateSuspiciousScore(newFrequency, pattern.firstSeenAt);

      await prisma.$queryRaw`
        UPDATE "JobPostingPattern" 
        SET 
          "postingFrequency" = ${newFrequency},
          "lastSeenAt" = NOW(),
          "suspiciousScore" = ${suspiciousScore},
          "flaggedForReview" = ${suspiciousScore > 0.8},
          "updatedAt" = NOW()
        WHERE id = ${pattern.id}
      `;
    } else {
      // Create new pattern
      await prisma.$queryRaw`
        INSERT INTO "JobPostingPattern" (
          "employerId",
          "companyName", 
          "titlePattern",
          "locationPattern",
          "salaryPattern",
          "postingFrequency",
          "suspiciousScore"
        ) VALUES (
          ${job.employerId},
          ${job.company},
          ${titlePattern},
          ${locationPattern},
          ${salaryPattern},
          1,
          0.0
        )
      `;
    }
  }

  /**
   * Extract a pattern from job title for duplicate detection
   */
  private static extractTitlePattern(title: string): string {
    return title
      .toLowerCase()
      .replace(/\b(urgent|immediate|asap|now hiring|hiring now)\b/gi, '')
      .replace(/\b(full.?time|part.?time|contract|temporary|permanent)\b/gi, '')
      .replace(/\b(remote|onsite|hybrid|work from home)\b/gi, '')
      .replace(/\b(entry.?level|senior|junior|lead|manager|director)\b/gi, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate suspicious score based on posting frequency and timing
   */
  private static calculateSuspiciousScore(frequency: number, firstSeenAt: Date): number {
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)));
    const postsPerDay = frequency / daysSinceFirst;
    
    // Score based on posting frequency
    let score = 0;
    if (postsPerDay > 5) score += 0.9;
    else if (postsPerDay > 3) score += 0.7;
    else if (postsPerDay > 1) score += 0.5;
    else if (frequency > 10) score += 0.3;
    
    // Additional factors
    if (frequency > 20) score += 0.2;
    if (daysSinceFirst < 7 && frequency > 5) score += 0.3;
    
    return Math.min(1.0, score);
  }

  /**
   * Get duplicate statistics for admin dashboard
   */
  static async getDuplicateStatistics() {
    const [totalAlerts, pendingAlerts, confirmedDuplicates, suspiciousPatterns] = await Promise.all([
      prisma.duplicateJobAlert.count(),
      prisma.duplicateJobAlert.count({ where: { reviewStatus: 'pending' } }),
      prisma.duplicateJobAlert.count({ where: { reviewStatus: 'confirmed' } }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "JobPostingPattern" 
        WHERE "suspiciousScore" > 0.7 OR "flaggedForReview" = true
      `
    ]);

    return {
      totalAlerts,
      pendingAlerts,
      confirmedDuplicates,
      suspiciousPatterns: Array.isArray(suspiciousPatterns) ? (suspiciousPatterns[0] as any)?.count || 0 : 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Manual duplicate check for AI assistant
   */
  static async checkJobForDuplicates(jobId: string) {
    const duplicates = await prisma.$queryRaw`
      SELECT * FROM detect_job_duplicates(${jobId})
    `;

    return duplicates;
  }

  /**
   * Flag a job as potential duplicate (for AI assistant use)
   */
  static async flagJobAsDuplicate(
    jobId: string, 
    originalJobId: string, 
    similarityScore: number,
    detectionMethod: string = 'ai_analysis',
    notes?: string
  ) {
    // Create duplicate alert
    const alert = await prisma.duplicateJobAlert.create({
      data: {
        originalJobId,
        duplicateJobId: jobId,
        similarityScore,
        detectionMethod,
        notes
      }
    });

    // Flag the job if high similarity
    if (similarityScore >= 0.8) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          flaggedAsDuplicate: true,
          duplicateOfJobId: originalJobId,
          duplicateScore: similarityScore
        }
      });
    }

    return alert;
  }
}

export default DuplicateDetectionService;
