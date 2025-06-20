import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { DuplicateDetectionService } from '@/lib/services/duplicate-detection';
import type { Session } from 'next-auth';

// GET /api/admin/duplicate-monitoring - Get duplicate monitoring data
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth() as Session | null;
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'alerts';
    const limit = parseInt(searchParams.get('limit') || '50');

    let data;

    switch (type) {
      case 'alerts':
        data = await DuplicateDetectionService.getPendingDuplicateAlerts(limit);
        break;
      
      case 'patterns':
        data = await DuplicateDetectionService.getSuspiciousPostingPatterns();
        break;
      
      case 'statistics':
        data = await DuplicateDetectionService.getDuplicateStatistics();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: alerts, patterns, or statistics' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching duplicate monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate monitoring data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/duplicate-monitoring - Review duplicate alert
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth() as Session | null;
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { alertId, reviewStatus, actionTaken, notes } = body;

    if (!alertId || !reviewStatus) {
      return NextResponse.json(
        { error: 'alertId and reviewStatus are required' },
        { status: 400 }
      );
    }

    if (!['confirmed', 'false_positive', 'ignored'].includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'Invalid reviewStatus. Use: confirmed, false_positive, or ignored' },
        { status: 400 }
      );
    }

    const reviewedBy = (session.user as any).id || session.user.email;
    
    const result = await DuplicateDetectionService.reviewDuplicateAlert(
      alertId,
      reviewStatus,
      reviewedBy,
      actionTaken,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Duplicate alert reviewed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error reviewing duplicate alert:', error);
    return NextResponse.json(
      { error: 'Failed to review duplicate alert' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/duplicate-monitoring - Flag job as duplicate (for AI assistant)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth() as Session | null;
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, originalJobId, similarityScore, detectionMethod, notes } = body;

    if (!jobId || !originalJobId || !similarityScore) {
      return NextResponse.json(
        { error: 'jobId, originalJobId, and similarityScore are required' },
        { status: 400 }
      );
    }

    if (similarityScore < 0 || similarityScore > 1) {
      return NextResponse.json(
        { error: 'similarityScore must be between 0 and 1' },
        { status: 400 }
      );
    }

    const result = await DuplicateDetectionService.flagJobAsDuplicate(
      jobId,
      originalJobId,
      similarityScore,
      detectionMethod || 'manual_review',
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Job flagged as duplicate successfully',
      data: result
    });

  } catch (error) {
    console.error('Error flagging job as duplicate:', error);
    return NextResponse.json(
      { error: 'Failed to flag job as duplicate' },
      { status: 500 }
    );
  }
}
