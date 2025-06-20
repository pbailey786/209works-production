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
    });

    if (!jobSeekerProfile) {
      return NextResponse.json({
        matches: []
      });
    }

    // Get active jobs that might match the job seeker
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        // Add location filtering if zipCode is available
        ...(jobSeekerProfile.zipCode && {
          location: {
            contains: jobSeekerProfile.zipCode.substring(0, 3), // Match area code region
            mode: 'insensitive'
          }
        })
      },
      include: {
        employer: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent jobs
    });

    // Calculate match scores and transform jobs
    const jobMatches = jobs.map(job => {
      const matchScore = calculateMatchScore(job, jobSeekerProfile);
      
      return {
        id: job.id,
        title: job.title,
        company: job.employer?.companyName || 'Unknown Company',
        location: job.location,
        matchScore,
        postedDate: job.createdAt.toISOString(),
        salary: job.salaryRange || undefined,
      };
    })
    .filter(match => match.matchScore >= 60) // Only show good matches
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    return NextResponse.json({
      matches: jobMatches
    });

  } catch (error) {
    console.error('Error fetching job seeker matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateMatchScore(job: any, profile: any): number {
  let score = 60; // Base score

  // Location match
  if (profile.zipCode && job.location) {
    const profileArea = profile.zipCode.substring(0, 3);
    if (job.location.includes(profileArea)) {
      score += 15;
    }
  }

  // Skills match
  if (profile.skills && job.requirements) {
    const profileSkills = profile.skills.toLowerCase().split(',').map((s: string) => s.trim());
    const jobRequirements = job.requirements.toLowerCase();
    
    const matchingSkills = profileSkills.filter((skill: string) => 
      jobRequirements.includes(skill)
    );
    
    score += Math.min(matchingSkills.length * 5, 20);
  }

  // Job type match
  if (profile.jobTypes && job.type) {
    const profileJobTypes = Array.isArray(profile.jobTypes) 
      ? profile.jobTypes 
      : [profile.jobTypes];
    
    if (profileJobTypes.includes(job.type)) {
      score += 10;
    }
  }

  // Experience level (mock calculation)
  score += Math.floor(Math.random() * 10);

  return Math.min(score, 99); // Cap at 99%
}
