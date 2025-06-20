import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/dashboard/job-recommendations - Get personalized job recommendations
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's job seeker profile for preferences
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    // Get user's applied jobs to exclude them
    const appliedJobs = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      select: { jobId: true },
    });

    const appliedJobIds = appliedJobs.map(app => app.jobId);

    // Build query based on user preferences
    const whereClause: any = {
      status: 'active',
      id: { notIn: appliedJobIds },
      expiresAt: { gt: new Date() },
    };

    // Add location filtering if user has zipCode
    if (profile?.zipCode) {
      // For now, we'll do a simple location match
      // In a real app, you'd use geolocation services
      whereClause.location = {
        contains: profile.zipCode.substring(0, 3), // Match first 3 digits of zip
        mode: 'insensitive',
      };
    }

    // Add job type filtering
    if (profile?.jobTypes && profile.jobTypes.length > 0) {
      whereClause.jobType = {
        in: profile.jobTypes.map(type => type.toLowerCase().replace(' ', '_')),
      };
    }

    // Get recommended jobs
    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        postedAt: true,
        isRemote: true,
        jobType: true,
        categories: true,
        description: true,
      },
      orderBy: [
        { postedAt: 'desc' },
        { id: 'desc' },
      ],
      take: 10,
    });

    // Calculate match scores based on user profile
    const recommendations = jobs.map(job => {
      let matchScore = 50; // Base score

      // Increase score for job type match
      if (profile?.jobTypes?.some(type => 
        job.jobType === type.toLowerCase().replace(' ', '_')
      )) {
        matchScore += 20;
      }

      // Increase score for skills match
      if (profile?.skills && job.description) {
        const skillMatches = profile.skills.filter(skill =>
          job.description.toLowerCase().includes(skill.toLowerCase())
        );
        matchScore += Math.min(skillMatches.length * 5, 20);
      }

      // Increase score for remote preference
      if (profile?.jobTypes?.includes('Remote') && job.isRemote) {
        matchScore += 10;
      }

      // Decrease score for older posts
      const daysOld = Math.floor(
        (Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOld > 7) {
        matchScore -= Math.min(daysOld - 7, 20);
      }

      // Ensure score is between 0 and 100
      matchScore = Math.max(0, Math.min(100, matchScore));

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salaryMin && job.salaryMax 
          ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
          : job.salaryMin 
          ? `$${job.salaryMin.toLocaleString()}+`
          : undefined,
        matchScore,
        postedAt: job.postedAt.toISOString(),
        isRemote: job.isRemote,
      };
    });

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job recommendations' },
      { status: 500 }
    );
  }
}
