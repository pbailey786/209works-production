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
            deletedAt: null
          }
        }
      },
      include: {
        company: true,
        _count: {
          select: {
            employerJobs: {
              where: {
                status: 'active',
                deletedAt: null
              }
            }
          }
        }
      },
      take: 6,
      orderBy: {
        employerJobs: {
          _count: 'desc'
        }
      }
    });

    // Transform real employers to match our interface
    const transformedEmployers = realEmployers.map(employer => ({
      id: employer.company?.id || employer.id,
      name: employer.company?.name || employer.name || 'Unknown Company',
      industry: employer.company?.industry || 'Various',
      location: employer.company?.headquarters || 'Central Valley, CA',
      activeJobs: employer._count.employerJobs,
      description: employer.company?.description || 'Local business hiring in the 209 area.',
      logo: getIndustryEmoji(employer.company?.industry || 'Various'),
      website: employer.company?.website
    }));

    // If we have real employers, return them
    if (transformedEmployers.length > 0) {
      return NextResponse.json({
        employers: transformedEmployers,
        source: 'database'
      });
    }

    // Fallback to mock data if no real employers found
    const mockEmployers = [
      {
        id: "central-valley-health",
        name: "Central Valley Health",
        industry: "Healthcare",
        location: "Stockton, CA",
        activeJobs: 12,
        description: "Leading healthcare provider serving the Central Valley with opportunities in nursing, administration, and medical support.",
        logo: "🏥"
      },
      {
        id: "manteca-unified",
        name: "Manteca Unified School District",
        industry: "Education",
        location: "Manteca, CA",
        activeJobs: 8,
        description: "Growing school district seeking teachers, administrators, and support staff to serve our diverse student community.",
        logo: "🎓"
      },
      {
        id: "tracy-logistics",
        name: "Tracy Logistics Solutions",
        industry: "Transportation & Warehousing",
        location: "Tracy, CA",
        activeJobs: 15,
        description: "Premier logistics company offering warehouse, transportation, and supply chain careers with competitive benefits.",
        logo: "🚛"
      },
      {
        id: "lodi-wine-group",
        name: "Lodi Wine Group",
        industry: "Agriculture & Food",
        location: "Lodi, CA",
        activeJobs: 6,
        description: "Family-owned winery and agricultural business with seasonal and full-time opportunities in wine production and farming.",
        logo: "🍇"
      },
      {
        id: "modesto-tech",
        name: "Modesto Tech Solutions",
        industry: "Technology",
        location: "Modesto, CA",
        activeJobs: 9,
        description: "Innovative tech company providing IT services to local businesses, seeking developers, support staff, and project managers.",
        logo: "💻"
      },
      {
        id: "delta-construction",
        name: "Delta Construction",
        industry: "Construction",
        location: "Stockton, CA",
        activeJobs: 11,
        description: "Established construction company building homes and commercial properties throughout the Central Valley region.",
        logo: "🏗️"
      }
    ];

    return NextResponse.json({
      employers: mockEmployers,
      source: 'mock'
    });

  } catch (error) {
    console.error('Error fetching featured employers:', error);
    
    // Return empty array on error
    return NextResponse.json({
      employers: [],
      error: 'Failed to fetch employers'
    }, { status: 500 });
  }
}

// Helper function to get emoji based on industry
function getIndustryEmoji(industry: string): string {
  const industryMap: { [key: string]: string } = {
    'Healthcare': '🏥',
    'Education': '🎓',
    'Technology': '💻',
    'Construction': '🏗️',
    'Transportation': '🚛',
    'Warehousing': '📦',
    'Agriculture': '🌾',
    'Food': '🍽️',
    'Retail': '🛍️',
    'Manufacturing': '🏭',
    'Finance': '💰',
    'Real Estate': '🏠',
    'Hospitality': '🏨',
    'Government': '🏛️',
    'Non-Profit': '❤️'
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
