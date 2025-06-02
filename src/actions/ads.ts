"use server"

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { ActionResult } from './auth';

// Import validation schemas from existing files
import { 
  createAdSchema, 
  updateAdSchema, 
  adImpressionSchema,
  adClickSchema,
  adConversionSchema,
  AdTargeting 
} from '@/lib/validations/ads';

// Create advertisement action
export async function createAdAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Verify user is an employer or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return {
        success: false,
        message: 'Only employers can create advertisements',
      };
    }

    // Check user's current ad count (limit: 50 per employer)
    const adCount = await prisma.advertisement.count({
      where: { employerId: userId },
    });

    if (adCount >= 50) {
      return {
        success: false,
        message: 'You have reached the maximum limit of 50 advertisements',
      };
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('title') as string,
      type: formData.get('type') as any,
      content: JSON.parse(formData.get('content') as string),
      targeting: formData.get('targeting') ? JSON.parse(formData.get('targeting') as string) : undefined,
      bidding: {
        type: formData.get('biddingModel') as any,
        bidAmount: Number(formData.get('bidAmount')),
        dailyBudget: formData.get('dailyBudget') ? Number(formData.get('dailyBudget')) : undefined,
        totalBudget: formData.get('totalBudget') ? Number(formData.get('totalBudget')) : undefined,
      },
      schedule: {
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string || undefined,
      },
      priority: formData.get('priority') ? Number(formData.get('priority')) : undefined,
      notes: formData.get('notes') as string || undefined,
    };

    const validatedData = createAdSchema.parse(rawData);

    // Validate date range
    const startDate = new Date(validatedData.schedule.startDate);
    const endDate = validatedData.schedule.endDate ? new Date(validatedData.schedule.endDate) : null;

    if (endDate && startDate >= endDate) {
      return {
        success: false,
        message: 'End date must be after start date',
      };
    }

    // Determine initial status
    const now = new Date();
    let status: string;
    
    if (startDate > now) {
      status = 'scheduled';
    } else if (!endDate || endDate > now) {
      status = 'active';
    } else {
      status = 'completed';
    }

    // Create advertisement
    const ad = await prisma.advertisement.create({
      data: {
        title: validatedData.name,
        name: validatedData.name,
        businessName: validatedData.content.companyLogo ? 'Company' : 'Business',
        imageUrl: validatedData.content.imageUrl || '',
        targetUrl: validatedData.content.ctaUrl,
        zipCodes: '',
        type: validatedData.type,
        content: validatedData.content,
        bidding: validatedData.bidding,
        placement: [],
        employerId: userId,
        startDate,
        endDate: endDate || startDate,
        status,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        currentSpend: 0,
        priority: validatedData.priority || 5,
      },
    });

    revalidatePath('/employers/ads');
    revalidatePath('/ads');

    return {
      success: true,
      message: 'Advertisement created successfully!',
      data: { adId: ad.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    console.error('Create ad error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Update advertisement action
export async function updateAdAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const adId = formData.get('id') as string;
    if (!adId) {
      return {
        success: false,
        message: 'Advertisement ID is required',
      };
    }

    // Verify ad ownership
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        employerId: userId,
      },
    });

    if (!existingAd) {
      return {
        success: false,
        message: 'Advertisement not found or access denied',
      };
    }

    // Extract and validate form data
    const rawData = {
      id: adId,
      title: formData.get('title') as string || undefined,
      description: formData.get('description') as string || undefined,
      content: formData.get('content') ? JSON.parse(formData.get('content') as string) : undefined,
      targeting: formData.get('targeting') ? JSON.parse(formData.get('targeting') as string) : undefined,
      biddingModel: formData.get('biddingModel') as any || undefined,
      bidAmount: formData.get('bidAmount') ? Number(formData.get('bidAmount')) : undefined,
      dailyBudget: formData.get('dailyBudget') ? Number(formData.get('dailyBudget')) : undefined,
      totalBudget: formData.get('totalBudget') ? Number(formData.get('totalBudget')) : undefined,
      startDate: formData.get('startDate') as string || undefined,
      endDate: formData.get('endDate') as string || undefined,
    };

    const validatedData = updateAdSchema.parse(rawData);

    // Remove undefined values and id
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key, value]) => 
        value !== undefined && key !== 'id'
      )
    );

    // Handle date conversions
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate as string).toISOString();
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate as string).toISOString();
    }

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      'draft': ['scheduled', 'active'],
      'scheduled': ['active', 'paused'],
      'active': ['paused', 'completed'],
      'paused': ['active', 'completed'],
      'completed': [], // Cannot transition from completed
    };

    const newStatus = formData.get('status') as string;
    if (newStatus && !allowedTransitions[existingAd.status]?.includes(newStatus)) {
      return {
        success: false,
        message: `Cannot change status from ${existingAd.status} to ${newStatus}`,
      };
    }

    if (newStatus) {
      updateData.status = newStatus;
    }

    // Update advertisement
    const updatedAd = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/employers/ads');
    revalidatePath(`/ads/${adId}`);

    return {
      success: true,
      message: 'Advertisement updated successfully!',
      data: { adId: updatedAd.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    console.error('Update ad error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Delete advertisement action
export async function deleteAdAction(
  adId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Verify ad ownership
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        employerId: userId,
      },
      select: { id: true, status: true, currentSpend: true },
    });

    if (!existingAd) {
      return {
        success: false,
        message: 'Advertisement not found or access denied',
      };
    }

    // Prevent deletion if ad has significant spend (> $10)
    if (Number(existingAd.currentSpend) > 10) {
      return {
        success: false,
        message: 'Cannot delete advertisement with significant spend. Archive it instead.',
      };
    }

    // Only allow deletion of draft, scheduled, or completed ads
    if (!['draft', 'scheduled', 'completed'].includes(existingAd.status)) {
      return {
        success: false,
        message: 'Cannot delete active or paused advertisements. Please complete or archive them first.',
      };
    }

    // Delete advertisement (this will cascade delete tracking data)
    await prisma.advertisement.delete({
      where: { id: adId },
    });

    revalidatePath('/employers/ads');

    return {
      success: true,
      message: 'Advertisement deleted successfully',
    };
  } catch (error) {
    console.error('Delete ad error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Track advertisement impression action
export async function trackImpressionAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      adId: formData.get('adId') as string,
      userId: formData.get('userId') as string || undefined,
      sessionId: formData.get('sessionId') as string || 'anonymous',
      userAgent: formData.get('userAgent') as string || undefined,
      ipAddress: formData.get('ipAddress') as string || undefined,
      position: formData.get('placement') as string || undefined,
      timestamp: new Date().toISOString(),
    };

    const validatedData = adImpressionSchema.parse(rawData);

    // Check if ad exists and is active
    const ad = await prisma.advertisement.findUnique({
      where: { id: validatedData.adId },
      select: { 
        id: true, 
        status: true, 
        currentSpend: true,
        bidding: true,
        clicks: true,
        impressions: true,
      },
    });

    if (!ad || ad.status !== 'active') {
      return {
        success: false,
        message: 'Advertisement not found or not active',
      };
    }

    // Extract bidding info from JSON
    const biddingInfo = ad.bidding as any;
    const biddingModel = biddingInfo?.type || 'cpc';
    const bidAmount = biddingInfo?.bidAmount || 0;
    const totalBudget = biddingInfo?.totalBudget;
    const dailyBudget = biddingInfo?.dailyBudget;

    // Check for duplicate impression (within 30 seconds)
    const recentImpression = await prisma.adImpression.findFirst({
      where: {
        adId: validatedData.adId,
        sessionId: validatedData.sessionId,
        createdAt: {
          gte: new Date(Date.now() - 30000), // 30 seconds ago
        },
      },
    });

    if (recentImpression) {
      return {
        success: false,
        message: 'Duplicate impression ignored',
      };
    }

    // Check budget constraints for CPM ads
    if (biddingModel === 'cpm') {
      const cost = bidAmount / 1000; // CPM cost per impression
      if (totalBudget && (Number(ad.currentSpend) + cost) > totalBudget) {
        // Auto-pause ad if total budget exceeded
        await prisma.advertisement.update({
          where: { id: ad.id },
          data: { status: 'paused' },
        });
        
        return {
          success: false,
          message: 'Advertisement paused due to budget limit',
        };
      }
    }

    // Record impression
    await prisma.adImpression.create({
      data: {
        adId: validatedData.adId,
        userId: validatedData.userId || null,
        sessionId: validatedData.sessionId || 'anonymous',
        userAgent: validatedData.userAgent || null,
        ipAddress: validatedData.ipAddress || null,
        placement: validatedData.position || null,
      },
    });

    // Update ad statistics
    const updateData: any = {
      impressions: { increment: 1 },
    };

    // Add cost for CPM ads
    if (biddingModel === 'cpm') {
      updateData.currentSpend = { increment: bidAmount / 1000 };
    }

    await prisma.advertisement.update({
      where: { id: ad.id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Impression tracked successfully',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Invalid tracking data',
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    console.error('Track impression error:', error);
    return {
      success: false,
      message: 'Failed to track impression',
    };
  }
}

// Track advertisement click action
export async function trackClickAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      adId: formData.get('adId') as string,
      userId: formData.get('userId') as string || undefined,
      sessionId: formData.get('sessionId') as string || 'anonymous',
      targetUrl: formData.get('targetUrl') as string,
      userAgent: formData.get('userAgent') as string || undefined,
      ipAddress: formData.get('ipAddress') as string || undefined,
      timestamp: new Date().toISOString(),
    };

    const validatedData = adClickSchema.parse(rawData);

    // Get ad details
    const ad = await prisma.advertisement.findUnique({
      where: { id: validatedData.adId },
      select: { 
        id: true, 
        status: true, 
        currentSpend: true,
        bidding: true,
        clicks: true,
        impressions: true,
      },
    });

    if (!ad || ad.status !== 'active') {
      return {
        success: false,
        message: 'Advertisement not found or not active',
      };
    }

    // Extract bidding info from JSON
    const biddingInfo = ad.bidding as any;
    const biddingModel = biddingInfo?.type || 'cpc';
    const bidAmount = biddingInfo?.bidAmount || 0;
    const totalBudget = biddingInfo?.totalBudget;
    const dailyBudget = biddingInfo?.dailyBudget;

    // Validate target URL
    if (validatedData.targetUrl && !isValidUrl(validatedData.targetUrl)) {
      return {
        success: false,
        message: 'Invalid target URL',
      };
    }

    // Calculate cost for CPC ads
    let cost = 0;
    if (biddingModel === 'cpc') {
      cost = bidAmount;
      
      // Check budget constraints
      if (totalBudget && (Number(ad.currentSpend) + cost) > totalBudget) {
        await prisma.advertisement.update({
          where: { id: ad.id },
          data: { status: 'paused' },
        });
        
        return {
          success: false,
          message: 'Advertisement paused due to budget limit',
        };
      }
    }

    // Record click
    await prisma.adClick.create({
      data: {
        adId: validatedData.adId,
        userId: validatedData.userId || null,
        sessionId: validatedData.sessionId || 'anonymous',
        targetUrl: validatedData.targetUrl || null,
        userAgent: validatedData.userAgent || null,
        ipAddress: validatedData.ipAddress || null,
        cost,
      },
    });

    // Update ad statistics
    const updateData: any = {
      clicks: { increment: 1 },
    };

    if (cost > 0) {
      updateData.currentSpend = { increment: cost };
    }

    const updatedAd = await prisma.advertisement.update({
      where: { id: ad.id },
      data: updateData,
    });

    // Calculate CTR
    const ctr = updatedAd.impressions > 0 
      ? (updatedAd.clicks / updatedAd.impressions) * 100 
      : 0;

    return {
      success: true,
      message: 'Click tracked successfully',
      data: {
        cost,
        ctr: ctr.toFixed(2),
        totalSpend: updatedAd.currentSpend,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Invalid tracking data',
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    console.error('Track click error:', error);
    return {
      success: false,
      message: 'Failed to track click',
    };
  }
}

// Track advertisement conversion action
export async function trackConversionAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      adId: formData.get('adId') as string,
      userId: formData.get('userId') as string || undefined,
      type: formData.get('conversionType') as any,
      value: formData.get('conversionValue') ? Number(formData.get('conversionValue')) : undefined,
      customEvent: formData.get('customEvent') as string || undefined,
      timestamp: new Date().toISOString(),
    };

    const validatedData = adConversionSchema.parse(rawData);

    // Check if conversion already exists (within 24 hours)
    const existingConversion = await prisma.adConversion.findFirst({
      where: {
        adId: validatedData.adId,
        userId: validatedData.userId,
        conversionType: validatedData.type,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
    });

    if (existingConversion) {
      return {
        success: false,
        message: 'Conversion already tracked',
      };
    }

    // Record conversion
    await prisma.adConversion.create({
      data: {
        adId: validatedData.adId,
        userId: validatedData.userId || null,
        sessionId: formData.get('sessionId') as string || 'unknown',
        conversionType: validatedData.type,
        conversionValue: validatedData.value || 0,
      },
    });

    // Update ad statistics
    await prisma.advertisement.update({
      where: { id: validatedData.adId },
      data: {
        conversions: { increment: 1 },
      },
    });

    // Calculate ROI if conversion has value
    let roi = null;
    if (validatedData.value) {
      const ad = await prisma.advertisement.findUnique({
        where: { id: validatedData.adId },
        select: { currentSpend: true },
      });
      
      if (ad && Number(ad.currentSpend) > 0) {
        roi = ((validatedData.value - Number(ad.currentSpend)) / Number(ad.currentSpend)) * 100;
      }
    }

    return {
      success: true,
      message: 'Conversion tracked successfully',
      data: {
        conversionType: validatedData.type,
        conversionValue: validatedData.value,
        roi: roi ? roi.toFixed(2) : null,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Invalid conversion data',
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    console.error('Track conversion error:', error);
    return {
      success: false,
      message: 'Failed to track conversion',
    };
  }
}

// Get advertisement analytics action
export async function getAdAnalyticsAction(
  adId: string,
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    // Verify ad ownership
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        employerId: userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        impressions: true,
        clicks: true,
        conversions: true,
        currentSpend: true,
        bidding: true,
        createdAt: true,
      },
    });

    if (!ad) {
      return {
        success: false,
        message: 'Advertisement not found or access denied',
      };
    }

    // Extract bidding info from JSON
    const biddingInfo = ad.bidding as any;
    const biddingModel = biddingInfo?.type || 'cpc';
    const bidAmount = biddingInfo?.bidAmount || 0;
    const totalBudget = biddingInfo?.totalBudget;
    const dailyBudget = biddingInfo?.dailyBudget;

    // Calculate performance metrics
    const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
    const conversionRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0;
    const avgCost = ad.clicks > 0 ? Number(ad.currentSpend) / ad.clicks : 0;
    const budgetUtilization = totalBudget 
      ? (Number(ad.currentSpend) / totalBudget) * 100 
      : 0;

    // Get detailed analytics for date range
    const whereClause = dateRange 
      ? {
          adId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }
      : { adId };

    const [impressionsByDay, clicksByDay, conversionsByDay] = await Promise.all([
      prisma.adImpression.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { _all: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.adClick.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { _all: true },
        _sum: { cost: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.adConversion.groupBy({
        by: ['conversionType', 'createdAt'],
        where: whereClause,
        _count: { _all: true },
        _sum: { conversionValue: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        overview: {
          id: ad.id,
          title: ad.title,
          type: ad.type,
          status: ad.status,
          createdAt: ad.createdAt,
        },
        performance: {
          impressions: ad.impressions,
          clicks: ad.clicks,
          conversions: ad.conversions,
          ctr: Number(ctr.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          currentSpend: ad.currentSpend,
          avgCostPerClick: Number(avgCost.toFixed(2)),
          budgetUtilization: Number(budgetUtilization.toFixed(2)),
        },
        budget: {
          daily: dailyBudget,
          total: totalBudget,
          spent: ad.currentSpend,
          remaining: totalBudget ? totalBudget - Number(ad.currentSpend) : null,
        },
        bidding: {
          model: biddingModel,
          amount: bidAmount,
        },
        timeline: {
          impressions: impressionsByDay,
          clicks: clicksByDay,
          conversions: conversionsByDay,
        },
      },
    };
  } catch (error) {
    console.error('Get ad analytics error:', error);
    return {
      success: false,
      message: 'Failed to fetch analytics data',
    };
  }
}

// Bulk operation on advertisements
export async function bulkAdOperationAction(
  operation: 'activate' | 'pause' | 'archive',
  adIds: string[],
  userId: string
): Promise<ActionResult> {
  try {
    if (adIds.length === 0) {
      return {
        success: false,
        message: 'No advertisements selected',
      };
    }

    if (adIds.length > 25) {
      return {
        success: false,
        message: 'Cannot process more than 25 advertisements at once',
      };
    }

    // Verify all ads belong to the user
    const userAds = await prisma.advertisement.findMany({
      where: {
        id: { in: adIds },
        employerId: userId,
      },
      select: { id: true, status: true },
    });

    if (userAds.length !== adIds.length) {
      return {
        success: false,
        message: 'Some advertisements not found or access denied',
      };
    }

    let updateData: any = {};
    let statusFilter: string[] = [];

    switch (operation) {
      case 'activate':
        updateData = { status: 'active' };
        statusFilter = ['draft', 'scheduled', 'paused'];
        break;
      case 'pause':
        updateData = { status: 'paused' };
        statusFilter = ['active'];
        break;
      case 'archive':
        updateData = { status: 'archived' };
        statusFilter = ['completed', 'paused'];
        break;
    }

    // Filter ads that can undergo the operation
    const eligibleAdIds = userAds
      .filter(ad => statusFilter.includes(ad.status))
      .map(ad => ad.id);

    if (eligibleAdIds.length === 0) {
      return {
        success: false,
        message: `No advertisements eligible for ${operation}`,
      };
    }

    // Perform bulk update
    const result = await prisma.advertisement.updateMany({
      where: { id: { in: eligibleAdIds } },
      data: updateData,
    });

    revalidatePath('/employers/ads');

    return {
      success: true,
      message: `Successfully ${operation}d ${result.count} advertisement${result.count !== 1 ? 's' : ''}`,
      data: { 
        affectedCount: result.count,
        skippedCount: adIds.length - result.count,
      },
    };
  } catch (error) {
    console.error('Bulk ad operation error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Helper functions

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
} 