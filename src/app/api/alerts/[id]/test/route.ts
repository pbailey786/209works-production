import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { requireRole } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Schema for test alert
const testAlertSchema = z.object({
  dryRun: z.boolean().optional()
});

// POST /api/alerts/:id/test - Test alert to see matching jobs
export const POST = withValidation(
  async (req, { params, body }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    const alertId = params.id;
    const dryRun = body?.dryRun || false;

    // Verify alert exists and belongs to user
    const alert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        frequency: true
      }
    });

    if (!alert) {
      return NextResponse.json({
        success: false,
        error: 'Alert not found'
      }, { status: 404 });
    }

    // Use simplified job matching algorithm (mock data)
    const alertCriteria = {
      keywords: alert.keywords,
      location: alert.location || undefined,
      salaryMin: alert.salaryMin || undefined,
      salaryMax: alert.salaryMax || undefined
    };

    // Generate mock matching jobs
    const matchingJobs = Array.from(
      { length: Math.floor(Math.random() * 10) + 1 },
      (_, i) => ({
        id: `job-${i + 1}`,
        title: `Sample Job ${i + 1}`,
        company: `Company ${i + 1}`,
        location: alert.location || 'San Francisco, CA',
        salaryMin: alert.salaryMin || 50000,
        salaryMax: alert.salaryMax || 80000,
        snippet: `Job description for ${alert.keywords}`,
        matchScore: Math.random() * 100
      })
    );

    // Calculate match quality metrics (simplified)
    const matchQuality = {
      averageScore: matchingJobs.reduce((sum, job) => sum + job.matchScore, 0) / matchingJobs.length,
      highQualityMatches: matchingJobs.filter(job => job.matchScore > 80).length,
      relevanceScore: Math.random() * 100
    };

    // Simulate sending notification if not dry run
    let notificationPreview = null;
    if (!dryRun && matchingJobs.length > 0) {
      notificationPreview = generateNotificationPreview(
        {
          ...alert,
          name: alert.title || 'Unnamed Alert'
        },
        matchingJobs
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        alert: {
          id: alert.id,
          name: alert.title || 'Unnamed Alert',
          frequency: alert.frequency
        },
        testResults: {
          totalMatches: matchingJobs.length,
          matchingJobs,
          matchQuality,
          recommendations: generateOptimizationRecommendations(
            alertCriteria,
            matchingJobs
          )
        },
        notificationPreview,
        dryRun: body?.dryRun || false
      }
    });
  },
  {
    bodySchema: testAlertSchema
  }
);

// Generate optimization recommendations
function generateOptimizationRecommendations(criteria: any, jobs: any[]): string[] {
  const recommendations: string[] = [];

  if (jobs.length === 0) {
    recommendations.push('No jobs found. Try broadening your search criteria.');
  } else if (jobs.length < 5) {
    recommendations.push('Few matches found. Consider expanding your keywords or location.');
  } else if (jobs.length > 50) {
    recommendations.push('Many matches found. Consider narrowing your criteria for more relevant results.');
  }

  return recommendations;
}

// Generate notification preview
function generateNotificationPreview(alert: any, jobs: any[]): any {
  const topJobs = jobs.slice(0, 3); // Show top 3 jobs in preview

  return {
    subject: `${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching "${alert.name}"`,
    preview: `Found ${jobs.length} new opportunities including ${topJobs.map(job => job.title).join(', ')}`,
    emailBody: {
      heading: `New Job Matches for "${alert.name}"`,
      summary: `We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} that match your alert criteria.`,
      jobs: topJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        salary:
          job.salaryMin && job.salaryMax
            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
            : 'Salary not specified',
        snippet: job.snippet || 'No description available',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`
      })),
      footerText:
        jobs.length > 3
          ? `View all ${jobs.length} matches on 209jobs`
          : undefined
    },
    estimatedDelivery: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
  };
}
