import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all applications for this employer's jobs
    const applications = await prisma.application.findMany({
      where: {
        job: {
          employerId: userId
        }
      },
      select: {
        status: true,
        createdAt: true,
        job: {
          select: {
            title: true
          }
        }
      }
    });

    // Count applications by status
    const statusCounts = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0
    };

    applications.forEach(app => {
      const status = app.status?.toLowerCase() || 'applied';
      
      // Map various status values to our pipeline stages
      if (status === 'pending' || status === 'submitted' || status === 'applied') {
        statusCounts.applied++;
      } else if (status === 'reviewing' || status === 'screening' || status === 'under_review') {
        statusCounts.screening++;
      } else if (status === 'interview' || status === 'interviewing' || status === 'interview_scheduled') {
        statusCounts.interview++;
      } else if (status === 'offer' || status === 'offer_extended' || status === 'offer_pending') {
        statusCounts.offer++;
      } else if (status === 'hired' || status === 'accepted' || status === 'onboarded') {
        statusCounts.hired++;
      } else if (status === 'rejected' || status === 'declined' || status === 'withdrawn') {
        statusCounts.rejected++;
      } else {
        // Default to applied for unknown statuses
        statusCounts.applied++;
      }
    });

    // Calculate conversion rates
    const totalApplications = applications.length;
    const conversionRates = {
      screeningRate: totalApplications > 0 ? (statusCounts.screening / totalApplications) * 100 : 0,
      interviewRate: totalApplications > 0 ? (statusCounts.interview / totalApplications) * 100 : 0,
      offerRate: totalApplications > 0 ? (statusCounts.offer / totalApplications) * 100 : 0,
      hireRate: totalApplications > 0 ? (statusCounts.hired / totalApplications) * 100 : 0,
    };

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApplications = applications.filter(app => 
      new Date(app.createdAt) >= thirtyDaysAgo
    );

    // Calculate trends
    const trends = {
      totalApplications: recentApplications.length,
      weekOverWeek: Math.floor(Math.random() * 20) - 10, // Mock trend data
      monthOverMonth: Math.floor(Math.random() * 30) - 15, // Mock trend data
    };

    return NextResponse.json({
      pipeline: statusCounts,
      conversionRates,
      trends,
      totalApplications,
      summary: {
        activeStages: Object.values(statusCounts).filter(count => count > 0).length,
        averageTimeToHire: Math.floor(Math.random() * 20) + 10, // Mock data in days
        topPerformingJob: applications.length > 0 ? 
          applications[0].job.title : 'No applications yet'
      }
    });

  } catch (error) {
    console.error('Error fetching hiring pipeline data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
