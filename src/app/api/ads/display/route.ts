import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement') || 'banner';
    const limit = parseInt(searchParams.get('limit') || '1');
    const location = searchParams.get('location');

    // Build where clause for active ads
    const now = new Date();
    const whereClause: any = {
      status: 'active',
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
    };

    // Add placement filter if specified
    if (placement !== 'all') {
      whereClause.type = placement;
    }

    // Add geographic targeting if location is provided
    if (location) {
      whereClause.OR = [
        {
          zipCodes: {
            contains: location,
          },
        },
        {
          zipCodes: {
            equals: '',
          },
        },
      ];
    }

    // Fetch ads with weighted selection based on bidding
    const ads = await prisma.advertisement.findMany({
      where: whereClause,
      orderBy: [
        {
          priority: 'desc', // Use priority field instead of bidding path
        },
        {
          impressions: 'asc', // Favor ads with fewer impressions for rotation
        },
        {
          createdAt: 'desc',
        },
      ],
      take: limit * 3, // Get more ads for rotation
    });

    if (ads.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No active ads found',
      });
    }

    // Implement weighted selection based on bid amount and performance
    const selectedAds = selectAdsWithRotation(ads, limit);

    // Transform ads to match the expected format
    const transformedAds = selectedAds.map(ad => ({
      id: ad.id,
      name: ad.name,
      type: ad.type,
      status: ad.status,
      content: ad.content,
      targeting: ad.targeting,
      bidding: ad.bidding,
      schedule: ad.schedule,
    }));

    return NextResponse.json({
      success: true,
      data: transformedAds,
      count: transformedAds.length,
    });
  } catch (error) {
    console.error('Error fetching ads for display:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Ad rotation algorithm with weighted selection
function selectAdsWithRotation(ads: any[], limit: number): any[] {
  if (ads.length <= limit) {
    return ads;
  }

  // Calculate weights based on bid amount and inverse of impressions
  const adsWithWeights = ads.map(ad => {
    const bidAmount = ad.bidding?.bidAmount || 0;
    const impressions = ad.impressions || 0;
    const clicks = ad.clicks || 0;

    // Calculate CTR (click-through rate)
    const ctr = impressions > 0 ? clicks / impressions : 0;

    // Weight formula: bid amount * (1 + CTR) / (1 + impressions/1000)
    // This favors higher bids, better performing ads, and gives newer ads a chance
    const weight = (bidAmount * (1 + ctr)) / (1 + impressions / 1000);

    return {
      ...ad,
      weight: Math.max(weight, 0.1), // Minimum weight to ensure all ads have a chance
    };
  });

  // Sort by weight (descending) and take top ads
  adsWithWeights.sort((a, b) => b.weight - a.weight);

  // Add some randomization to prevent the same ads always showing
  const topAds = adsWithWeights.slice(
    0,
    Math.min(limit * 2, adsWithWeights.length)
  );

  // Randomly select from top performing ads
  const selectedAds = [];
  const availableAds = [...topAds];

  for (let i = 0; i < limit && availableAds.length > 0; i++) {
    // Weighted random selection
    const totalWeight = availableAds.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedIndex = 0;
    for (let j = 0; j < availableAds.length; j++) {
      random -= availableAds[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    selectedAds.push(availableAds[selectedIndex]);
    availableAds.splice(selectedIndex, 1);
  }

  return selectedAds;
}
