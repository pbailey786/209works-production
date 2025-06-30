import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { runSmartMatch, DEFAULT_SMARTMATCH_CONFIG } from '@/lib/services/smart-match';

export const maxDuration = 60; // May take longer for AI analysis

/**
 * SmartMatch API Endpoint
 * 
 * POST /api/employers/smart-match
 * Body: { jobId: string, config?: SmartMatchConfig }
 * 
 * Returns: SmartMatchResult with top candidate matches
 */
export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, config = DEFAULT_SMARTMATCH_CONFIG } = await req.json();
    
    if (!jobId) {
      return NextResponse.json({ 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    // Verify user owns this job
    const userEmail = clerkUser.emailAddresses[0].emailAddress;
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await prisma.job.findFirst({
      where: { 
        id: jobId,
        employerId: user.id 
      }
    });

    if (!job) {
      return NextResponse.json({ 
        error: 'Job not found or not owned by user' 
      }, { status: 404 });
    }

    // TODO: Check if user has available credits for SmartMatch
    // const hasCredits = await checkEmployerCredits(user.id, 'smart_match');
    // if (!hasCredits) {
    //   return NextResponse.json({
    //     error: 'Insufficient credits for SmartMatch'
    //   }, { status: 402 });
    // }

    // Run SmartMatch analysis
    console.log(`🎯 Running SmartMatch for job: ${job.title}`);
    const result = await runSmartMatch(jobId, config);

    // TODO: Deduct credit for SmartMatch usage
    // await deductEmployerCredit(user.id, 'smart_match');

    // TODO: Log analytics for SmartMatch usage
    // await prisma.smartMatchAnalytics.create({
    //   data: {
    //     jobId,
    //     employerId: user.id,
    //     candidatesScanned: result.totalCandidates,
    //     candidatesMatched: result.topMatches.length,
    //     cost: result.cost,
    //     configUsed: JSON.stringify(config)
    //   }
    // });

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('SmartMatch API error:', error);
    return NextResponse.json(
      { error: 'Failed to run SmartMatch analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/employers/smart-match?jobId=xxx
 * 
 * Returns previous SmartMatch results for a job
 */
export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    // TODO: Fetch previous SmartMatch results from database
    // const previousResults = await prisma.smartMatchAnalytics.findMany({
    //   where: { jobId },
    //   orderBy: { createdAt: 'desc' },
    //   take: 1
    // });

    return NextResponse.json({
      success: true,
      results: [] // TODO: Return actual results
    });

  } catch (error) {
    console.error('SmartMatch GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SmartMatch results' },
      { status: 500 }
    );
  }
}