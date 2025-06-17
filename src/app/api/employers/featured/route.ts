import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch real employers from the database
    // For now, we'll return the mock data with proper structure

    // Try to fetch real employers from database
    const realEmployers = await prisma.user.findMany({
      where: {
        role: 'employer',
        // Only include employers with active jobs
        employerJobs: {
          some: {
            status: 'active',
            deletedAt: null,
          },
        },
      },
      include: {
        company: true,
        _count: {
          select: {
            employerJobs: {
              where: {
                status: 'active',
                deletedAt: null,
              },
            },
          },
        },
      },
      take: 6,
      orderBy: {
        employerJobs: {
          _count: 'desc',
        },
      },
    });

    // Transform real employers to match our interface
    const transformedEmployers = realEmployers.map(employer => ({
      id: employer.company?.id || employer.id,
      name: employer.company?.name || employer.name || 'Unknown Company',
      industry: employer.company?.industry || 'Various',
      location: employer.company?.headquarters || 'Central Valley, CA',
      activeJobs: employer._count.employerJobs,
      description:
        employer.company?.description ||
        'Local business hiring in the 209 area.',
      logo: getIndustryEmoji(employer.company?.industry || 'Various'),
      website: employer.company?.website,
    }));

    // Return the transformed employers (empty array if none found)
    return NextResponse.json({
      employers: transformedEmployers,
      source: 'database',
      message: transformedEmployers.length === 0
        ? 'No featured employers found. Encourage local businesses to join!'
        : undefined,
    });
  } catch (error) {
    console.error('Error fetching featured employers:', error);

    // Return empty array on error
    return NextResponse.json(
      {
        employers: [],
        error: 'Failed to fetch employers',
      },
      { status: 500 }
    );
  }
}

// Helper function to get emoji based on industry
function getIndustryEmoji(industry: string): string {
  const industryMap: { [key: string]: string } = {
    Healthcare: '🏥',
    Education: '🎓',
    Technology: '💻',
    Construction: '🏗️',
    Transportation: '🚛',
    Warehousing: '📦',
    Agriculture: '🌾',
    Food: '🍽️',
    Retail: '🛍️',
    Manufacturing: '🏭',
    Finance: '💰',
    'Real Estate': '🏠',
    Hospitality: '🏨',
    Government: '🏛️',
    'Non-Profit': '❤️',
  };

  // Try to find a match
  for (const [key, emoji] of Object.entries(industryMap)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return emoji;
    }
  }

  // Default emoji
  return '🏢';
}
