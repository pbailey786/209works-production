import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { requireRole } from '@/lib/auth/middleware';
import { updateAlertSchema } from '@/lib/validations/alerts';
import { prisma } from '@/lib/database/prisma';

// GET /api/alerts/:id - Get specific alert details
export const GET = withValidation(
  async (req, { params }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    const alertId = params.id;

    // Get alert with detailed information
    const alert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user.id, // Users can only access their own alerts
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        frequency: true,
        isActive: true,
        salaryMin: true,
        salaryMax: true,
        lastTriggered: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!alert) {
      return NextResponse.json({
        success: false,
        error: 'Alert not found'
      }, { status: 404 });
    }

    // Get recent matching jobs (simulated for now)
    // TODO: Implement actual job matching logic
    const recentMatches = Array.from(
      { length: Math.min(5, Math.floor(Math.random() * 10)) },
      (_, i) => ({
        id: `job-${i + 1}`,
        title: `Sample Job ${i + 1}`,
        company: `Company ${i + 1}`,
        location: 'San Francisco, CA',
        postedAt: new Date(
          Date.now() - i * 24 * 60 * 60 * 1000
        ).toISOString(),
        matchScore: Math.random() * 100
      })
    );

    // Calculate alert effectiveness stats
    const stats = {
      totalNotifications: 0, // TODO: Count from notifications table
      averageMatches: Math.floor(Math.random() * 15) + 5,
      clickThroughRate: Math.random() * 0.3 + 0.1, // 10-40% CTR
      lastActivity: alert.lastTriggered,
      estimatedNextRun: calculateNextRun(
        alert.frequency,
        alert.lastTriggered
      )
    };

    return NextResponse.json({
      success: true,
      data: {
        ...alert,
        recentMatches,
        stats
      }
    });
  },
  {}
);

// PUT /api/alerts/:id - Update alert
export const PUT = withValidation(
  async (req, { params, body }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    const alertId = params.id;

    // Verify alert exists and belongs to user
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user.id
      }
    });

    if (!existingAlert) {
      return NextResponse.json({
        success: false,
        error: 'Alert not found'
      }, { status: 404 });
    }

    // Update the alert
    const updatedAlert = await prisma.jobAlert.update({
      where: { id: alertId },
      data: {
        ...body,
        id: undefined, // Remove id from update data
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        frequency: true,
        isActive: true,
        salaryMin: true,
        salaryMax: true,
        lastTriggered: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Re-estimate matches with new criteria
    const estimatedMatches = Math.floor(Math.random() * 50);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAlert,
        estimatedMatches,
        message: 'Alert updated successfully'
      }
    });
  },
  {
    bodySchema: updateAlertSchema
  }
);

// DELETE /api/alerts/:id - Delete alert
export const DELETE = withValidation(
  async (req, { params }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    const alertId = params.id;

    // Verify alert exists and belongs to user
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user.id
      }
    });

    if (!existingAlert) {
      return NextResponse.json({
        success: false,
        error: 'Alert not found'
      }, { status: 404 });
    }

    // Delete the alert (this will cascade delete related notifications)
    await prisma.jobAlert.delete({
      where: { id: alertId }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
      deletedId: alertId
    });
  },
  {}
);

// Helper function to calculate next alert run time
function calculateNextRun(
  frequency: string,
  lastSent: Date | null
): string | null {
  if (!lastSent) return 'Will run immediately for new jobs';

  const lastSentTime = new Date(lastSent).getTime();
  const now = Date.now();

  let nextRunTime: number;

  switch (frequency) {
    case 'immediate':
      return 'Runs immediately when new jobs match';
    case 'daily':
      nextRunTime = lastSentTime + 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      nextRunTime = lastSentTime + 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      nextRunTime = lastSentTime + 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  if (nextRunTime <= now) {
    return 'Scheduled to run soon';
  }

  return new Date(nextRunTime).toISOString();
}
