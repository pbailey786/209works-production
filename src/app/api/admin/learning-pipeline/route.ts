import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { runJobLearningPipeline } from '@/lib/ai/job-learning-system';

// Admin-only endpoint to run the job learning pipeline
export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your auth system)
    // For now, checking if email contains 'admin' or specific admin emails
    const email = clerkUser.emailAddresses[0].emailAddress;
    const isAdmin = email.includes('admin') || email.endsWith('@209.works');
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run the learning pipeline
    console.log('Starting job learning pipeline via admin API...');
    await runJobLearningPipeline();
    
    return NextResponse.json({
      success: true,
      message: 'Job learning pipeline completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Learning pipeline API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run learning pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check learning system status
export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const isAdmin = email.includes('admin') || email.endsWith('@209.works');
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get learning system statistics
    const { prisma } = await import('@/lib/database/prisma');
    
    const [
      totalAnalyses,
      recentAnalyses,
      learnedTemplates,
      avgSuccessScore
    ] = await Promise.all([
      prisma.jobPostAnalysis.count(),
      prisma.jobPostAnalysis.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.learnedJobTemplate.count(),
      prisma.jobPostAnalysis.aggregate({
        _avg: {
          successScore: true
        }
      })
    ]);

    const topJobTypes = await prisma.jobPostAnalysis.groupBy({
      by: ['normalizedTitle'],
      _count: {
        normalizedTitle: true
      },
      orderBy: {
        _count: {
          normalizedTitle: 'desc'
        }
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      statistics: {
        totalAnalyses,
        recentAnalyses,
        learnedTemplates,
        averageSuccessScore: avgSuccessScore._avg.successScore || 0,
        topJobTypes: topJobTypes.map((jt: any) => ({
          jobType: jt.normalizedTitle,
          count: jt._count.normalizedTitle
        }))
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Learning system status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get learning system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}