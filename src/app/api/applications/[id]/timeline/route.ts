import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import path from "path";

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'employer_view' | 'message' | 'interview_scheduled' | 'note_added';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  actor?: {
    name: string;
    role: 'system' | 'employer' | 'jobseeker';
  };
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    message?: string;
    interviewDate?: string;
    interviewType?: string;
  };
}

// GET /api/applications/[id]/timeline - Get application timeline
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applicationId = params.id;

    // Verify the application belongs to the user
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: user.id,
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get audit logs for this application to build timeline
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          {
            resourceId: applicationId,
            resource: 'job_application',
          },
          {
            details: {
              path: ['applicationId'],
              equals: applicationId,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 events
    });

    // Build timeline events from audit logs and application data
    const timeline: TimelineEvent[] = [];

    // Add application submitted event
    timeline.push({
      id: `application-${application.id}`,
      type: 'status_change',
      title: 'Application Submitted',
      description: `You applied for ${application.job.title} at ${application.job.company}`,
      timestamp: application.appliedAt.toISOString(),
      status: 'pending',
      actor: {
        name: user.name || 'You',
        role: 'jobseeker',
      },
      metadata: {
        newStatus: 'pending',
      },
    });

    // Process audit logs to create timeline events
    auditLogs.forEach((log) => {
      const details = log.details as any;
      
      switch (log.action) {
        case 'application_status_updated':
          timeline.push({
            id: log.id,
            type: 'status_change',
            title: getStatusChangeTitle(details.newStatus),
            description: getStatusChangeDescription(details.oldStatus, details.newStatus),
            timestamp: log.createdAt.toISOString(),
            status: details.newStatus,
            actor: {
              name: 'System',
              role: 'system',
            },
            metadata: {
              oldStatus: details.oldStatus,
              newStatus: details.newStatus,
            },
          });
          break;

        case 'application_status_updated_by_employer':
          timeline.push({
            id: log.id,
            type: 'status_change',
            title: getStatusChangeTitle(details.newStatus),
            description: `Employer updated your application status to ${details.newStatus}`,
            timestamp: log.createdAt.toISOString(),
            status: details.newStatus,
            actor: {
              name: 'Employer',
              role: 'employer',
            },
            metadata: {
              oldStatus: details.oldStatus,
              newStatus: details.newStatus,
              message: details.notes,
            },
          });
          break;

        case 'application_viewed_by_employer':
          timeline.push({
            id: log.id,
            type: 'employer_view',
            title: 'Application Viewed',
            description: 'An employer viewed your application',
            timestamp: log.createdAt.toISOString(),
            actor: {
              name: 'Employer',
              role: 'employer',
            },
          });
          break;

        case 'interview_scheduled':
          timeline.push({
            id: log.id,
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            description: `Interview scheduled for ${details.interviewType || 'position'}`,
            timestamp: log.createdAt.toISOString(),
            actor: {
              name: 'Employer',
              role: 'employer',
            },
            metadata: {
              interviewDate: details.interviewDate,
              interviewType: details.interviewType,
              message: details.message,
            },
          });
          break;

        default:
          // Handle other actions as generic events
          if (log.action.includes('application')) {
            timeline.push({
              id: log.id,
              type: 'note_added',
              title: formatActionTitle(log.action),
              description: details.message || 'Application updated',
              timestamp: log.createdAt.toISOString(),
              actor: {
                name: log.userId === user.id ? 'You' : 'System',
                role: log.userId === user.id ? 'jobseeker' : 'system',
              },
            });
          }
          break;
      }
    });

    // Sort timeline by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      timeline,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt.toISOString(),
        job: application.job,
      },
    });
  } catch (error) {
    console.error('Error fetching application timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

function getStatusChangeTitle(status: string): string {
  const titles: Record<string, string> = {
    pending: 'Application Submitted',
    reviewing: 'Under Review',
    interview: 'Interview Stage',
    offer: 'Offer Extended',
    rejected: 'Application Declined',
    withdrawn: 'Application Withdrawn',
    hired: 'Congratulations! You\'re Hired',
  };
  return titles[status] || 'Status Updated';
}

function getStatusChangeDescription(oldStatus: string, newStatus: string): string {
  const descriptions: Record<string, string> = {
    pending: 'Your application has been submitted and is pending review',
    reviewing: 'Your application is now being reviewed by the hiring team',
    interview: 'You\'ve been selected for an interview',
    offer: 'Congratulations! You\'ve received a job offer',
    rejected: 'Unfortunately, you were not selected for this position',
    withdrawn: 'Your application has been withdrawn',
    hired: 'Congratulations! You\'ve been hired for this position',
  };
  return descriptions[newStatus] || `Status changed from ${oldStatus} to ${newStatus}`;
}

function formatActionTitle(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .path.join(' ');
}
