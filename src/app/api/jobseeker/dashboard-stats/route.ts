import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get job seeker profile
    const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        savedJobs: true,
        applications: true,
      }
    });

    if (!jobSeekerProfile) {
      // Return default stats for new users
      return NextResponse.json({
        savedJobs: 0,
        appliedJobs: 0,
        matchesSuggested: 0,
        profileViews: 0,
        interviewRequests: 0,
      });
    }

    // Calculate stats
    const savedJobsCount = jobSeekerProfile.savedJobs?.length || 0;
    const appliedJobsCount = jobSeekerProfile.applications?.length || 0;

    // Get profile views (mock data for now)
    const profileViews = Math.floor(Math.random() * 50) + 10;

    // Get interview requests (mock data for now)
    const interviewRequests = Math.floor(Math.random() * 5);

    // Get suggested matches based on profile completeness
    const profileCompleteness = calculateProfileCompleteness(jobSeekerProfile);
    const matchesSuggested = Math.floor(profileCompleteness * 0.1) + Math.floor(Math.random() * 5);

    return NextResponse.json({
      savedJobs: savedJobsCount,
      appliedJobs: appliedJobsCount,
      matchesSuggested,
      profileViews,
      interviewRequests,
    });

  } catch (error) {
    console.error('Error fetching job seeker dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateProfileCompleteness(profile: any): number {
  let completeness = 0;
  const fields = [
    'zipCode',
    'careerGoal',
    'skills',
    'resumeData',
    'availabilityDays',
    'jobTypes'
  ];

  fields.forEach(field => {
    if (profile[field]) {
      completeness += 1;
    }
  });

  return Math.round((completeness / fields.length) * 100);
}
