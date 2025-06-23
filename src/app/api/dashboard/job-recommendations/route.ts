import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';

export async function GET(req: NextRequest) {
  try {
    // Ensure user exists in database (auto-sync with Clerk)
    const baseUser = await ensureUserExists();
    
    // Get user from database with profile info for recommendations
    const user = await prisma.user.findUnique({
      where: { email: baseUser.email },
      select: { 
        id: true, 
        location: true, 
        skills: true, 
        experienceLevel: true,
        preferredJobTypes: true,
        currentJobTitle: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found after sync' }, { status: 500 });
    }

    // Get URL params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50

    // Build recommendations query based on user profile
    const whereConditions: any[] = [
      { status: 'active' } // Only active jobs
    ];

    // Location-based filtering (if user has location)
    if (user.location) {
      whereConditions.push({
        location: {
          contains: user.location,
          mode: 'insensitive'
        }
      });
    }

    // Skills-based filtering (if user has skills)
    if (user.skills && user.skills.length > 0) {
      whereConditions.push({
        OR: [
          {
            description: {
              contains: user.skills.join(' OR '),
              mode: 'insensitive'
            }
          },
          {
            categories: {
              hasSome: user.skills
            }
          }
        ]
      });
    }

    // Job type preferences
    if (user.preferredJobTypes && user.preferredJobTypes.length > 0) {
      whereConditions.push({
        jobType: {
          in: user.preferredJobTypes
        }
      });
    }

    // Get recommended jobs
    const recommendations = await prisma.job.findMany({
      where: {
        AND: whereConditions
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        postedAt: true,
        createdAt: true,
        description: true,
        categories: true,
      },
      orderBy: [
        { postedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    // Format the response
    const formattedRecommendations = recommendations.map(job => {
      // Format salary display
      let salary = '';
      if (job.salaryMin && job.salaryMax) {
        salary = `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
      } else if (job.salaryMin) {
        salary = `From $${job.salaryMin.toLocaleString()}`;
      } else if (job.salaryMax) {
        salary = `Up to $${job.salaryMax.toLocaleString()}`;
      }

      // Format posted date
      const postedAt = new Date(job.postedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - postedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let postedAtFormatted = '';
      if (diffDays === 1) {
        postedAtFormatted = '1 day ago';
      } else if (diffDays < 30) {
        postedAtFormatted = `${diffDays} days ago`;
      } else {
        postedAtFormatted = postedAt.toLocaleDateString();
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary,
        type: job.jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        postedAt: postedAtFormatted,
        categories: job.categories,
      };
    });

    // Get user's application history to avoid recommending already applied jobs
    const appliedJobIds = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      select: { jobId: true }
    });

    const appliedJobIdsSet = new Set(appliedJobIds.map(app => app.jobId));

    // Filter out jobs user has already applied to
    const filteredRecommendations = formattedRecommendations.filter(
      job => !appliedJobIdsSet.has(job.id)
    );

    return NextResponse.json({
      recommendations: filteredRecommendations,
      total: filteredRecommendations.length,
      userProfile: {
        location: user.location,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
        preferredJobTypes: user.preferredJobTypes
      }
    });

  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}