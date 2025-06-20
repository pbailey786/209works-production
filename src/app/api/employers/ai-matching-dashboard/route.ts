import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
// GET /api/employers/ai-matching-dashboard - Get AI matching dashboard data for employer
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employerId = userId;

    // Get all featured jobs for this employer
    const featuredJobs = await prisma.job.findMany({
      where: {
        employerId,
        featured: true,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        postedAt: true,
        status: true,
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      }
    });

    // Get matching statistics for each featured job (simplified for now)
    const jobsWithStats = featuredJobs.map((job) => {
      return {
        ...job,
        matchingStats: {
          totalCandidates: Math.floor(Math.random() * 50) + 10,
          emailsSent: Math.floor(Math.random() * 30) + 5,
          averageScore: Math.floor(Math.random() * 40) + 60
        },
        emailStats: {
          sent: Math.floor(Math.random() * 30) + 5,
          opened: Math.floor(Math.random() * 20) + 3,
          clicked: Math.floor(Math.random() * 10) + 1
        },
        featuredAnalytics: [{
          impressions: Math.floor(Math.random() * 500) + 100,
          clicks: Math.floor(Math.random() * 50) + 10,
          conversionRate: Math.random() * 10 + 2,
          emailAlerts: Math.floor(Math.random() * 30) + 5,
          emailClicks: Math.floor(Math.random() * 15) + 2,
          featuredAt: job.postedAt
        }]
      };
    });

      // Calculate summary statistics
      const totalMatches = jobsWithStats.reduce((sum, job) => sum + job.matchingStats.totalCandidates, 0);
      const totalEmailsSent = jobsWithStats.reduce((sum, job) => sum + job.matchingStats.emailsSent, 0);
      const totalImpressions = jobsWithStats.reduce((sum, job) => 
        sum + (job.featuredAnalytics[0]?.impressions || 0), 0);
      const totalClicks = jobsWithStats.reduce((sum, job) => 
        sum + (job.featuredAnalytics[0]?.clicks || 0), 0);

      const averageMatchScore = jobsWithStats.length > 0 
        ? jobsWithStats.reduce((sum, job) => sum + job.matchingStats.averageScore, 0) / jobsWithStats.length
        : 0;

      const summary = {
        totalFeaturedJobs: featuredJobs.length,
        totalMatches,
        totalEmailsSent,
        totalImpressions,
        totalClicks,
        averageMatchScore: Math.round(averageMatchScore * 100) / 100,
        conversionRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
      };

    // Get recent matching activity (last 7 days) - simplified for now
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentApplications = await prisma.application.findMany({
      where: {
        job: {
          employerId,
          featured: true
        },
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        user: {
          select: {
            name: true,
            location: true
          }
        },
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

      // Performance insights
      const insights = {
        topPerformingJob: jobsWithStats.length > 0 ? jobsWithStats[0].title : 'No featured jobs',
        averageResponseRate: summary.totalEmailsSent > 0 ? 
          ((summary.totalMatches / summary.totalEmailsSent) * 100).toFixed(1) + '%' : '0%',
        recommendation: summary.totalFeaturedJobs === 0 ? 
          'Consider featuring some of your job posts to attract more qualified candidates' :
          summary.averageMatchScore < 50 ? 
            'Consider updating job descriptions to attract better matches' :
            'Great job! Your featured posts are performing well'
      };

    return NextResponse.json({
      summary,
      featuredJobs: jobsWithStats,
      recentMatches: recentApplications.map(app => ({
        jobId: app.jobId,
        jobTitle: app.job.title,
        candidateName: app.user.name,
        candidateLocation: app.user.location,
        score: Math.floor(Math.random() * 40) + 60, // Mock score
        matchReason: 'Skills and experience match',
        emailSent: true,
        emailOpened: Math.random() > 0.5,
        emailClicked: Math.random() > 0.7,
        createdAt: app.createdAt
      })),
      insights
    });

  } catch (error) {
    console.error('Failed to get AI matching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate performance insights
function generatePerformanceInsights(summary: any, jobs: any[]) {
  const insights = [];

  // Email performance insight
  if (summary.totalEmailsSent > 0) {
    const emailClickRate = jobs.reduce((sum, job) => {
      const analytics = job.featuredAnalytics[0];
      return sum + (analytics?.emailClicks || 0);
    }, 0) / summary.totalEmailsSent * 100;

    if (emailClickRate > 15) {
      insights.push({
        type: 'success',
        title: 'Excellent Email Performance',
        message: `Your AI-matched job alerts have a ${emailClickRate.toFixed(1)}% click rate, which is above industry average!`
      });
    } else if (emailClickRate < 5) {
      insights.push({
        type: 'warning',
        title: 'Email Performance Could Improve',
        message: 'Consider improving your job descriptions or salary ranges to attract more clicks from matched candidates.'
      });
    }
  }

  // Match quality insight
  if (summary.averageMatchScore > 85) {
    insights.push({
      type: 'success',
      title: 'High-Quality Matches',
      message: `Your jobs are generating high-quality matches (${summary.averageMatchScore}% average score). Great job descriptions attract the right candidates!`
    });
  } else if (summary.averageMatchScore < 70) {
    insights.push({
      type: 'tip',
      title: 'Improve Match Quality',
      message: 'Consider adding more specific skills and requirements to your job descriptions to attract better-matched candidates.'
    });
  }

  // Activity insight
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  if (activeJobs === 0 && jobs.length > 0) {
    insights.push({
      type: 'info',
      title: 'No Active Featured Jobs',
      message: 'Feature more jobs to continue receiving AI-matched candidates and boost your hiring success.'
    });
  }

  // Conversion insight
  if (summary.conversionRate > 10) {
    insights.push({
      type: 'success',
      title: 'Strong Conversion Rate',
      message: `${summary.conversionRate.toFixed(1)}% of candidates who view your featured jobs take action. Your jobs are compelling!`
    });
  }

  return insights;
}