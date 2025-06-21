/**
 * Specialized prompts for the "Should I Apply" AI analysis feature
 * Provides honest but encouraging feedback with actionable advice
 */

export interface JobAnalysisInput {
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    requirements?: string;
    benefits?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills: string[];
    jobType: string;
  };
  profile: {
    skills: string[];
    experience?: string;
    careerGoal?: string;
    jobTypes: string[];
    location?: string;
    availabilityDays: string[];
    availabilityShifts: string[];
  };
}

export interface JobAnalysisResult {
  matchScore: number; // 0-100
  recommendation: 'strong' | 'good' | 'fair' | 'poor';
  shouldApply: boolean;
  summary: string;
  strengths: string[];
  skillGaps: string[];
  advice: string[];
  localInsights?: string[];
}

export class ShouldIApplyPrompts {
  /**
   * Main system prompt for job analysis
   */
  static getSystemPrompt(): string {
    return `You are a career counselor and job matching expert specializing in the 209 area code region of Northern California (Stockton, Modesto, Lodi, Tracy, Manteca, Turlock, Merced, and surrounding Central Valley communities).

Your role is to provide honest, encouraging, and actionable job fit analysis. You understand the local job market, commute patterns, and economic landscape of the Central Valley.

ANALYSIS FRAMEWORK:
1. Calculate a match score (0-100) based on:
   - Skills alignment (30%)
   - Experience level fit (25%) 
   - Location compatibility (20%)
   - Career goals alignment (15%)
   - Job type preferences (10%)

2. Provide honest but encouraging feedback:
   - Always find positive aspects, even for poor matches
   - Identify specific skill gaps with improvement suggestions
   - Give actionable advice regardless of match score
   - Emphasize local opportunities and advantages

3. Local 209 Area Focus:
   - Highlight proximity to Bay Area opportunities
   - Consider Central Valley cost of living advantages
   - Mention local industry strengths (agriculture, logistics, healthcare, education)
   - Factor in commute patterns and transportation options

RESPONSE REQUIREMENTS:
- Be encouraging but realistic
- Provide specific, actionable advice
- Include skill development suggestions
- Consider local market conditions
- Maintain professional but friendly tone
- Focus on growth opportunities

Always respond with valid JSON matching the JobAnalysisResult interface.`;
  }

  /**
   * Generate user prompt for job analysis
   */
  static getUserPrompt(input: JobAnalysisInput): string {
    const { job, profile } = input;
    
    return `Analyze this job opportunity for the candidate:

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Job Type: ${job.jobType}
Description: ${job.description}
${job.requirements ? `Requirements: ${job.requirements}` : ''}
${job.benefits ? `Benefits: ${job.benefits}` : ''}
${job.salaryMin && job.salaryMax ? `Salary Range: $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : ''}
Required Skills: ${job.skills.path.join(', ')}

CANDIDATE PROFILE:
Skills: ${profile.skills.path.join(', ')}
Experience Level: ${profile.experience || 'Not specified'}
Career Goal: ${profile.careerGoal || 'Not specified'}
Preferred Job Types: ${profile.jobTypes.path.join(', ')}
Location: ${profile.location || 'Not specified'}
Availability Days: ${profile.availabilityDays.path.join(', ')}
Availability Shifts: ${profile.availabilityShifts.path.join(', ')}

Provide a comprehensive analysis with:
1. Match score (0-100)
2. Recommendation level (strong/good/fair/poor)
3. Whether they should apply (boolean)
4. Brief summary of the match
5. 3-5 specific strengths
6. 2-4 skill gaps or areas for improvement
7. 3-5 actionable pieces of advice
8. Local insights specific to the 209 area (if applicable)

Format as JSON matching the JobAnalysisResult interface.`;
  }

  /**
   * Fallback prompt for when AI analysis fails
   */
  static getFallbackAnalysis(input: JobAnalysisInput): JobAnalysisResult {
    const { job, profile } = input;

    // Simple rule-based fallback
    let matchScore = 50;
    const strengths: string[] = [];
    const skillGaps: string[] = [];
    const advice: string[] = [];

    // Basic skill matching
    const matchingSkills = job.skills.filter(jobSkill =>
      profile.skills.some(profileSkill =>
        profileSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(profileSkill.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      matchScore += 20;
      strengths.push(`You have relevant skills: ${matchingSkills.path.join(', ')}`);
    }

    // Job type matching
    if (profile.jobTypes.includes(job.jobType)) {
      matchScore += 15;
      strengths.push('This job type matches your preferences');
    }

    // Location check for 209 area
    const area209Cities = ['modesto', 'stockton', 'fresno', 'merced', 'turlock', 'tracy', 'manteca', 'lodi'];
    const isIn209Area = area209Cities.some(city =>
      job.location.toLowerCase().includes(city)
    );

    if (isIn209Area) {
      matchScore += 10;
      strengths.push('Job is located in the 209 area');
    }

    // Determine recommendation
    let recommendation: 'strong' | 'good' | 'fair' | 'poor';
    if (matchScore >= 80) recommendation = 'strong';
    else if (matchScore >= 65) recommendation = 'good';
    else if (matchScore >= 45) recommendation = 'fair';
    else recommendation = 'poor';

    // Add generic advice
    advice.push('Tailor your resume to highlight relevant experience');
    advice.push('Research the company culture and values');
    advice.push('Prepare specific examples that demonstrate your skills');

    if (skillGaps.length === 0) {
      skillGaps.push('Consider developing additional technical skills');
    }

    return {
      matchScore: Math.min(100, Math.max(0, matchScore)),
      recommendation,
      shouldApply: matchScore >= 45,
      summary: `Based on your profile, this appears to be a ${recommendation} match. ${matchScore >= 45 ? 'Consider applying' : 'You may want to develop additional skills first'}.`,
      strengths: strengths.length > 0 ? strengths : ['You bring unique value to any role'],
      skillGaps: skillGaps,
      advice,
      localInsights: isIn209Area ? ['This position is in the heart of the 209 area, offering great local opportunities'] : undefined
    };
  }
}
