import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { requireRole } from '@/lib/auth/middleware';
import { adQuerySchema, createAdSchema } from '@/lib/validations/ads';
import { prisma } from '@/lib/database/prisma';

// GET /api/ads - List advertisements (admins see all, employers see their own)
export const GET = withValidation(
  async (req, { query }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;

    // Extract query parameters
    const url = new URL(req.url);
    const advertiserId = url.searchParams.get('advertiserId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const isActive = url.searchParams.get('isActive');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Build where condition based on user role
    const whereCondition: any = {};

    // Role-based access control
    if (user.role === 'admin') {
      // Admins can see all ads, optionally filtered by employer
      if (advertiserId) {
        whereCondition.employerId = advertiserId;
      }
    } else if (user.role === 'employer') {
      // Employers can only see their own ads
      whereCondition.employerId = user.id;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Only employers and admins can access ads'
      }, { status: 403 });
    }

    // Apply filters
    if (status) {
      whereCondition.status = status;
    }

    if (type) {
      whereCondition.type = type;
    }

    if (isActive !== undefined) {
      const now = new Date();
      if (isActive === 'true') {
        whereCondition.status = 'active';
      } else {
        whereCondition.status = { not: 'active' };
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereCondition.createdAt = {};
      if (dateFrom) {
        whereCondition.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereCondition.createdAt.lte = new Date(dateTo);
      }
    }

    // Count total ads
    const totalCount = await prisma.advertisement.count({
      where: whereCondition
    });

    // Get paginated ads
    const ads = await prisma.advertisement.findMany({
      where: whereCondition,
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        content: true,
        status: true,
        bidding: true,
        schedule: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        employerId: true,
        // Use direct fields instead of _count
        impressions: true,
        clicks: true,
        conversions: true
      }
    });

    // Add performance metrics for each ad
    const adsWithMetrics = ads.map(ad => {
      // Calculate basic metrics
      const impressions = ad.impressions || 0;
      const clicks = ad.clicks || 0;
      const conversions = ad.conversions || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      // Estimate spend based on bidding type (simplified)
      let estimatedSpend = 0;
      const bidding = ad.bidding as any;
      if (bidding?.type === 'cpc') {
        estimatedSpend = clicks * (bidding.bidAmount || 0);
      } else if (bidding?.type === 'cpm') {
        estimatedSpend = (impressions / 1000) * (bidding.bidAmount || 0);
      }

      return {
        ...ad,
        metrics: {
          impressions,
          clicks,
          conversions,
          ctr: Math.round(ctr * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          estimatedSpend: Math.round(estimatedSpend * 100) / 100,
          costPerClick: clicks > 0 ? estimatedSpend / clicks : 0
        },
        isCurrentlyActive: isAdCurrentlyActive(ad.status, ad.schedule)
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: adsWithMetrics,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  },
  {
    querySchema: adQuerySchema
  }
);

// POST /api/ads - Create new advertisement
export const POST = withValidation(
  async (req, { body }) => {
    // Check authorization
    const session = await requireRole(req, ['employer']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;

    // Only employers can create ads (admins can help via other means)
    if (user.role !== 'employer') {
      return NextResponse.json({
        success: false,
        error: 'Only employers can create advertisements'
      }, { status: 403 });
    }

    // Check if user has reached their ad limit
    const existingAdsCount = await prisma.advertisement.count({
      where: { employerId: user.id }
    });

    const maxAdsPerEmployer = 50; // Configurable limit
    if (existingAdsCount >= maxAdsPerEmployer) {
      return NextResponse.json({
        success: false,
        error: `Maximum ${maxAdsPerEmployer} advertisements allowed per account`
      }, { status: 400 });
    }

    // Validate schedule dates
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Request body is required'
      }, { status: 400 });
    }

    const startDate = new Date(body.schedule?.startDate || Date.now());
    const endDate = body.schedule?.endDate
      ? new Date(body.schedule.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date'
      }, { status: 400 });
    }

    // Set initial status based on validation needs
    const initialStatus = determineInitialStatus(body, user);

    // Create the advertisement
    const ad = await prisma.advertisement.create({
      data: {
        ...body,
        employerId: user.id,
        status: initialStatus,
        title: body.name || 'Untitled Ad',
        businessName: body.content?.companyLogo || 'Unknown Business',
        imageUrl: body.content?.imageUrl || '',
        targetUrl: body.content?.ctaUrl || '',
        zipCodes: (body.targeting?.cities || []).join(','),
        startDate: startDate,
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        type: true,
        content: true,
        bidding: true,
        schedule: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Estimate potential reach (simplified calculation)
    const estimatedReach = calculateEstimatedReach({});

    return NextResponse.json({
      success: true,
      data: {
        ...ad,
        estimatedReach,
        message: `Advertisement created successfully. Status: ${initialStatus}`,
        nextSteps: getNextSteps(initialStatus)
      }
    }, { status: 201 });
  },
  {
    bodySchema: createAdSchema
  }
);

// Helper function to check if ad is currently active
function isAdCurrentlyActive(status: string, schedule: any): boolean {
  if (status !== 'active') return false;

  if (!schedule?.startDate) return true; // If no schedule, consider active if status is active

  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;

  if (now < startDate) return false;
  if (endDate && now > endDate) return false;

  return true;
}

// Determine initial status for new ads
function determineInitialStatus(adData: any, user: any): string {
  // Simple approval logic - in production this would be more sophisticated
  const needsReview =
    adData.bidding.bidAmount > 10 || // High bid amounts need review
    adData.content.description.length < 50 || // Short descriptions need review
    !adData.content.imageUrl; // Ads without images need review

  return needsReview ? 'pending' : 'active';
}

// Calculate estimated reach based on targeting
function calculateEstimatedReach(targeting: any): number {
  // Simplified reach calculation
  let baseReach = 100000; // Base potential audience

  // Apply targeting multipliers
  if (targeting?.countries && targeting.countries.length > 0) {
    baseReach *= Math.min(targeting.countries.length / 10, 1);
  }

  if (targeting?.jobTitles && targeting.jobTitles.length > 0) {
    baseReach *= Math.min(targeting.jobTitles.length / 20, 0.5);
  }

  if (targeting?.experienceLevels && targeting.experienceLevels.length > 0) {
    baseReach *= Math.min(targeting.experienceLevels.length / 4, 0.7);
  }

  return Math.floor(baseReach);
}

// Get next steps based on ad status
function getNextSteps(status: string): string[] {
  switch (status) {
    case 'pending':
      return [
        'Your ad is pending review',
        "You will be notified once it's approved",
        'Review typically takes 1-2 business days',
      ];
    case 'active':
      return [
        'Your ad is now live!',
        'Monitor performance in the dashboard',
        'Adjust targeting or bidding as needed',
      ];
    case 'draft':
      return [
        'Complete all required fields',
        'Set up targeting and scheduling',
        'Submit for review',
      ];
    default:
      return ['Contact support for assistance'];
  }
}
