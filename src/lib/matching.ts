import { prisma } from '@/lib/database/prisma';
import path from "path";

interface JobSeekerProfile {
  id: string;
  userId: string;
  zipCode: string | null;
  distanceWillingToTravel: number | null;
  availabilityDays: string[];
  availabilityShifts: string[];
  jobTypes: string[];
  skills: string[];
  careerGoal: string | null;
  optInEmailAlerts: boolean;
  optInSmsAlerts: boolean;
  allowEmployerMessages: boolean;
}

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  skills: string[];
  jobType: string;
  requirements?: string | null;
  benefits?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

interface MatchResult {
  score: number;
  reasons: string[];
  jobId: string;
  profileId: string;
}

/**
 * Calculate match score between a job posting and job seeker profile
 * Returns a score from 0-5 based on various matching criteria
 */
export function calculateMatchScore(job: Job, profile: JobSeekerProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skills match (+1 point)
  const jobSkills = job.skills || [];
  const profileSkills = profile.skills || [];
  const skillMatches = jobSkills.filter(skill => 
    profileSkills.some(profileSkill => 
      profileSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(profileSkill.toLowerCase())
    )
  );
  
  if (skillMatches.length > 0) {
    score += 1;
    reasons.push(`Skills match: ${skillMatches.path.join(', ')}`);
  }

  // 2. Job type match (+1 point)
  const jobTypeMapping: Record<string, string[]> = {
    'warehouse': ['warehouse', 'logistics', 'distribution'],
    'retail': ['retail', 'sales', 'customer service'],
    'food_service': ['food', 'restaurant', 'hospitality'],
    'customer_service': ['customer service', 'support', 'call center'],
    'healthcare': ['healthcare', 'medical', 'nursing'],
    'manufacturing': ['manufacturing', 'production', 'factory'],
    'construction': ['construction', 'trades', 'building'],
    'transportation': ['transportation', 'delivery', 'driving'],
    'office_admin': ['office', 'administrative', 'clerical'],
    'security': ['security', 'guard', 'safety'],
  };

  const jobTypeMatch = profile.jobTypes.some(profileJobType => {
    const keywords = jobTypeMapping[profileJobType] || [profileJobType];
    return keywords.some(keyword => 
      job.title.toLowerCase().includes(keyword) ||
      job.description.toLowerCase().includes(keyword)
    );
  });

  if (jobTypeMatch) {
    score += 1;
    reasons.push('Job type matches your interests');
  }

  // 3. Location/Distance match (+1 point)
  // For now, we'll do a simple check if both have location info
  // In a real implementation, you'd calculate actual distance
  if (profile.zipCode && job.location) {
    // Simple heuristic: if job location contains common CA cities in 209 area
    const area209Cities = ['modesto', 'stockton', 'fresno', 'merced', 'turlock', 'tracy', 'manteca'];
    const jobLocationLower = job.location.toLowerCase();
    const isIn209Area = area209Cities.some(city => jobLocationLower.includes(city));
    
    if (isIn209Area) {
      score += 1;
      reasons.push('Job is in your preferred area');
    }
  }

  // 4. Spanish language bonus (+1 point)
  const requiresSpanish = job.description.toLowerCase().includes('spanish') || 
                         job.requirements?.toLowerCase().includes('spanish') ||
                         job.title.toLowerCase().includes('bilingual');
  const speaksSpanish = profileSkills.some(skill => 
    skill.toLowerCase().includes('spanish') || 
    skill.toLowerCase().includes('bilingual')
  );

  if (requiresSpanish && speaksSpanish) {
    score += 1;
    reasons.push('Spanish language skills match');
  }

  // 5. Experience level match (+1 point)
  const isEntryLevel = job.title.toLowerCase().includes('entry') ||
                      job.description.toLowerCase().includes('entry level') ||
                      job.description.toLowerCase().includes('no experience');
  
  const needsJobASAP = profile.careerGoal === 'need_job_asap';
  
  if (isEntryLevel && needsJobASAP) {
    score += 1;
    reasons.push('Entry-level position matches your immediate job needs');
  }

  // Career goal specific bonuses
  if (profile.careerGoal === 'build_career') {
    const hasGrowthOpportunity = job.description.toLowerCase().includes('growth') ||
                                job.description.toLowerCase().includes('advancement') ||
                                job.description.toLowerCase().includes('career') ||
                                job.benefits?.toLowerCase().includes('training');
    if (hasGrowthOpportunity) {
      score += 0.5;
      reasons.push('Offers career growth opportunities');
    }
  }

  if (profile.careerGoal === 'exploring_fields') {
    const offersTraining = job.description.toLowerCase().includes('training') ||
                          job.description.toLowerCase().includes('learn') ||
                          job.benefits?.toLowerCase().includes('training');
    if (offersTraining) {
      score += 0.5;
      reasons.push('Provides training and learning opportunities');
    }
  }

  return {
    score: Math.min(5, score), // Cap at 5
    reasons,
    jobId: job.id,
    profileId: profile.id,
  };
}

/**
 * Find job seekers who match a specific job posting
 */
export async function findMatchingJobSeekers(jobId: string): Promise<MatchResult[]> {
  try {
    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        skills: true,
        jobType: true,
        requirements: true,
        benefits: true,
        salaryMin: true,
        salaryMax: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Get all job seeker profiles with email alerts enabled
    const profiles = await prisma.jobSeekerProfile.findMany({
      where: {
        optInEmailAlerts: true,
      },
    });

    // Calculate match scores
    const matches: MatchResult[] = [];
    for (const profile of profiles) {
      const matchResult = calculateMatchScore(job, profile);
      if (matchResult.score >= 3) { // Only include good matches (3+ out of 5)
        matches.push(matchResult);
      }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error finding matching job seekers:', error);
    return [];
  }
}

/**
 * Find jobs that match a specific job seeker profile
 */
export async function findMatchingJobs(userId: string): Promise<MatchResult[]> {
  try {
    // Get the job seeker profile
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Job seeker profile not found');
    }

    // Get recent active jobs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        postedAt: {
          gte: thirtyDaysAgo,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        skills: true,
        jobType: true,
        requirements: true,
        benefits: true,
        salaryMin: true,
        salaryMax: true,
      },
      take: 100, // Limit to prevent performance issues
    });

    // Calculate match scores
    const matches: MatchResult[] = [];
    for (const job of jobs) {
      const matchResult = calculateMatchScore(job, profile);
      if (matchResult.score >= 2) { // Include decent matches (2+ out of 5)
        matches.push(matchResult);
      }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error finding matching jobs:', error);
    return [];
  }
}

/**
 * Get match score for a specific job and user combination
 */
export async function getJobMatchScore(jobId: string, userId: string): Promise<MatchResult | null> {
  try {
    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        skills: true,
        jobType: true,
        requirements: true,
        benefits: true,
        salaryMin: true,
        salaryMax: true,
      },
    });

    if (!job) {
      return null;
    }

    // Get the job seeker profile
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return calculateMatchScore(job, profile);
  } catch (error) {
    console.error('Error getting job match score:', error);
    return null;
  }
}
