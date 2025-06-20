import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { CompanyReviewsService } from '@/lib/social/company-reviews';
import { z } from 'zod';

// Validation schemas
const submitReviewSchema = z.object({
  companyId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().min(5).max(100),
  content: z.string().min(50).max(2000),
  pros: z.array(z.string()).max(10),
  cons: z.array(z.string()).max(10),
  workLifeBalance: z.number().min(1).max(5),
  compensation: z.number().min(1).max(5),
  culture: z.number().min(1).max(5),
  management: z.number().min(1).max(5),
  careerGrowth: z.number().min(1).max(5),
  jobTitle: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  employmentType: z.enum(['current', 'former']),
  employmentDuration: z.string().min(1).max(50),
  location: z.string().min(1).max(100),
  wouldRecommend: z.boolean(),
  isAnonymous: z.boolean().default(false),
});

const voteReviewSchema = z.object({
  reviewId: z.string().uuid(),
  isHelpful: z.boolean(),
});

// POST /api/social/company-reviews - Submit a new company review
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'submit_review') {
      const reviewData = submitReviewSchema.parse(data);
      
      const review = await CompanyReviewsService.submitReview(
        user.id,
        reviewData.companyId,
        reviewData
      );

      return NextResponse.json({
        success: true,
        review,
        message: 'Review submitted successfully',
      });
    }

    if (action === 'vote_review') {
      const voteData = voteReviewSchema.parse(data);
      
      await CompanyReviewsService.voteOnReview(
        voteData.reviewId,
        user.id,
        voteData.isHelpful
      );

      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in company reviews API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// GET /api/social/company-reviews - Get company reviews and ratings
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');
    const action = url.searchParams.get('action') || 'get_reviews';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (action === 'get_summary') {
      const summary = await CompanyReviewsService.getCompanyRatingSummary(companyId);
      
      return NextResponse.json({
        success: true,
        summary,
      });
    }

    if (action === 'get_reviews') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const sortBy = url.searchParams.get('sortBy') as any || 'newest';
      const rating = url.searchParams.get('rating');
      const employmentType = url.searchParams.get('employmentType') as any;
      const verified = url.searchParams.get('verified');
      const department = url.searchParams.get('department');

      const filterBy: any = {};
      if (rating) filterBy.rating = parseInt(rating);
      if (employmentType) filterBy.employmentType = employmentType;
      if (verified !== null) filterBy.verified = verified === 'true';
      if (department) filterBy.department = department;

      const result = await CompanyReviewsService.getCompanyReviews(companyId, {
        page,
        limit,
        sortBy,
        filterBy,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === 'get_analytics') {
      const analytics = await CompanyReviewsService.analyzeReviewContent(companyId);
      
      return NextResponse.json({
        success: true,
        analytics,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching company reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
