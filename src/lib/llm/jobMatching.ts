import { getChatCompletion } from '@/lib/openai';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  matchReason: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

interface UserProfile {
  experience?: string;
  skills?: string[];
  location?: string;
  preferences?: {
    jobTypes?: string[];
    salaryRange?: { min?: number; max?: number };
    remoteWork?: boolean;
    industries?: string[];
  };
  careerGoals?: string[];
}

export async function analyzeJobMatches(
  jobs: any[],
  userProfile: UserProfile
): Promise<JobMatch[]> {
  if (!jobs.length || !userProfile) {
    return [];
  }

  // Analyze jobs in batches to avoid token limits
  const batchSize = 5;
  const matches: JobMatch[] = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    try {
      const batchMatches = await analyzeJobBatch(batch, userProfile);
      matches.push(...batchMatches);
    } catch (error) {
      console.error('Error analyzing job batch:', error);
      // Continue with next batch
    }
  }

  // Sort by match score
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

async function analyzeJobBatch(
  jobs: any[],
  userProfile: UserProfile
): Promise<JobMatch[]> {
  const profileSummary = `
User Profile:
- Experience: ${userProfile.experience || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Preferred Job Types: ${userProfile.preferences?.jobTypes?.join(', ') || 'Any'}
- Salary Range: ${
    userProfile.preferences?.salaryRange
      ? `$${userProfile.preferences.salaryRange.min || 0} - $${userProfile.preferences.salaryRange.max || 'unlimited'}`
      : 'Not specified'
  }
- Remote Work Preference: ${userProfile.preferences?.remoteWork ? 'Yes' : 'No preference'}
- Preferred Industries: ${userProfile.preferences?.industries?.join(', ') || 'Any'}
- Career Goals: ${userProfile.careerGoals?.join(', ') || 'Not specified'}
`;

  const jobsData = jobs
    .map(
      (job, index) => `
Job ${index + 1}:
- ID: ${job.id}
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Type: ${job.jobType || 'Not specified'}
- Salary: ${
        job.salaryMin && job.salaryMax
          ? `$${job.salaryMin} - $${job.salaryMax}`
          : job.salaryMin
            ? `From $${job.salaryMin}`
            : job.salaryMax
              ? `Up to $${job.salaryMax}`
              : 'Not specified'
      }
- Description: ${job.description?.substring(0, 300) || 'No description'}
- Requirements: ${job.requirements?.substring(0, 200) || 'Not specified'}
- Benefits: ${job.benefits?.substring(0, 200) || 'Not specified'}
`
    )
    .join('\n');

  const systemPrompt = `You are an expert career counselor and job matching specialist. Analyze how well each job matches the user's profile and provide detailed insights.

For each job, provide:
1. Match Score (0-100): Overall compatibility
2. Match Reason: Brief explanation of the score
3. Strengths: What makes this a good match (2-3 points)
4. Concerns: Potential issues or gaps (1-2 points)
5. Recommendations: Specific advice for this application (1-2 points)

Consider these factors:
- Skills alignment
- Experience level match
- Location compatibility
- Salary expectations
- Career progression potential
- Company culture fit
- Job type preferences

Return as a JSON array with this structure:
[
  {
    "id": "job_id",
    "title": "job_title",
    "company": "company_name",
    "location": "job_location",
    "matchScore": 85,
    "matchReason": "Strong skills match with good growth potential",
    "strengths": ["Skill X aligns perfectly", "Great career progression"],
    "concerns": ["Salary slightly below expectations"],
    "recommendations": ["Highlight your Y experience", "Ask about growth opportunities"]
  }
]`;

  const userPrompt = `
${profileSummary}

Jobs to analyze:
${jobsData}

Analyze each job and return the JSON array with match analysis.`;

  try {
    const response = await getChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500,
        rateLimitId: 'job-matching-analysis',
        timeout: 30000,
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const matches = JSON.parse(jsonMatch[0]);
      return matches.map((match: any) => ({
        ...match,
        matchScore: Math.min(100, Math.max(0, match.matchScore)), // Ensure score is 0-100
      }));
    }

    return [];
  } catch (error) {
    console.error('Error in job matching analysis:', error);
    return [];
  }
}

// Quick match scoring for real-time feedback
export function calculateQuickMatchScore(
  job: any,
  userProfile: UserProfile
): number {
  let score = 0;
  let factors = 0;

  // Location match (25 points)
  if (userProfile.location && job.location) {
    const userLocation = userProfile.location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    if (
      jobLocation.includes(userLocation) ||
      userLocation.includes(jobLocation)
    ) {
      score += 25;
    } else if (isNearbyLocation(userLocation, jobLocation)) {
      score += 15;
    } else if (userProfile.preferences?.remoteWork && job.isRemote) {
      score += 20;
    }
    factors++;
  }

  // Skills match (30 points)
  if (userProfile.skills && userProfile.skills.length > 0) {
    const userSkills = userProfile.skills.map(s => s.toLowerCase());
    const jobText =
      `${job.title} ${job.description || ''} ${job.requirements || ''}`.toLowerCase();

    const matchingSkills = userSkills.filter(
      skill =>
        jobText.includes(skill) ||
        jobText.includes(skill.replace(/[^a-z0-9]/g, ''))
    );

    const skillMatchRatio = matchingSkills.length / userSkills.length;
    score += Math.round(skillMatchRatio * 30);
    factors++;
  }

  // Job type match (15 points)
  if (userProfile.preferences?.jobTypes && job.jobType) {
    const preferredTypes = userProfile.preferences.jobTypes.map(t =>
      t.toLowerCase()
    );
    if (preferredTypes.includes(job.jobType.toLowerCase())) {
      score += 15;
    }
    factors++;
  }

  // Salary match (20 points)
  if (
    userProfile.preferences?.salaryRange &&
    (job.salaryMin || job.salaryMax)
  ) {
    const userMin = userProfile.preferences.salaryRange.min || 0;
    const userMax = userProfile.preferences.salaryRange.max || Infinity;
    const jobMin = job.salaryMin || 0;
    const jobMax = job.salaryMax || Infinity;

    if (jobMin >= userMin && jobMax <= userMax) {
      score += 20; // Perfect salary match
    } else if (jobMax >= userMin && jobMin <= userMax) {
      score += 10; // Partial overlap
    }
    factors++;
  }

  // Experience level match (10 points)
  if (userProfile.experience && job.requirements) {
    const experienceYears = extractExperienceYears(userProfile.experience);
    const requiredYears = extractRequiredExperience(job.requirements);

    if (experienceYears >= requiredYears) {
      score += 10;
    } else if (experienceYears >= requiredYears * 0.7) {
      score += 5; // Close enough
    }
    factors++;
  }

  // Normalize score based on available factors
  if (factors === 0) return 50; // Default score when no profile data

  return Math.min(100, Math.round(score));
}

// Helper functions
function isNearbyLocation(userLocation: string, jobLocation: string): boolean {
  const centralValleyCities = [
    'stockton',
    'modesto',
    'fresno',
    'visalia',
    'bakersfield',
    'tracy',
    'manteca',
    'lodi',
    'turlock',
    'merced',
    'ceres',
    'patterson',
    'newman',
    'gustine',
    'los banos',
  ];

  return (
    centralValleyCities.some(
      city =>
        userLocation.includes(city) && jobLocation.includes('central valley')
    ) ||
    centralValleyCities.some(
      city =>
        jobLocation.includes(city) && userLocation.includes('central valley')
    )
  );
}

function extractExperienceYears(experienceText: string): number {
  const match = experienceText.match(/(\d+)\s*(?:years?|yrs?)/i);
  return match ? parseInt(match[1]) : 0;
}

function extractRequiredExperience(requirementsText: string): number {
  const match = requirementsText.match(
    /(\d+)\s*(?:\+\s*)?(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i
  );
  return match ? parseInt(match[1]) : 0;
}

// Generate personalized application tips
export async function generateApplicationTips(
  job: any,
  userProfile: UserProfile,
  matchAnalysis: JobMatch
): Promise<string[]> {
  const systemPrompt = `You are a career coach providing specific, actionable application tips for a job seeker. 
  
  Based on the job details, user profile, and match analysis, provide 3-5 specific tips for applying to this position.
  
  Focus on:
  - How to highlight relevant experience
  - Which skills to emphasize
  - How to address any gaps or concerns
  - Specific talking points for cover letter/interview
  - Company research suggestions
  
  Return as a JSON array of strings.`;

  const userPrompt = `
Job: ${job.title} at ${job.company}
Location: ${job.location}
Description: ${job.description?.substring(0, 500)}

User Profile: ${JSON.stringify(userProfile, null, 2)}

Match Analysis:
- Score: ${matchAnalysis.matchScore}%
- Strengths: ${matchAnalysis.strengths.join(', ')}
- Concerns: ${matchAnalysis.concerns.join(', ')}

Provide specific application tips as a JSON array.`;

  try {
    const response = await getChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 400,
        rateLimitId: 'application-tips',
        timeout: 15000,
      }
    );

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      'Tailor your resume to highlight relevant experience',
      "Research the company's recent news and achievements",
      'Prepare specific examples that demonstrate your skills',
    ];
  } catch (error) {
    console.error('Error generating application tips:', error);
    return [
      'Customize your application to match the job requirements',
      'Highlight your most relevant experience and skills',
      'Show enthusiasm for the company and role',
    ];
  }
}
