import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/authOptions';
import { prisma } from '../auth/prisma';
import { ShouldIApplyUsageService } from '@/lib/services/should-i-apply-usage';
import { getChatCompletion } from '@/lib/openai';
import type { Session } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      select: {
        id: true,
        name: true,
        skills: true,
        currentJobTitle: true,
        preferredJobTypes: true,
        location: true,
        workAuthorization: true,
        educationExperience: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits
    const usageCheck = await ShouldIApplyUsageService.canUserAnalyze(user.id);

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          reason: usageCheck.reason,
          usageInfo: {
            usageToday: usageCheck.usageToday,
            dailyLimit: usageCheck.dailyLimit,
            userTier: usageCheck.userTier,
          },
          upgradeRequired: true,
        },
        { status: 429 }
      );
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        categories: true,
        benefits: true,
        skills: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Determine analysis type based on user tier
    const hasPremium = await ShouldIApplyUsageService.hasPremiumFeatures(
      user.id
    );
    const analysisType = hasPremium ? 'premium' : 'basic';

    // Generate AI-powered analysis
    const analysis = await generateEnhancedAnalysis(job, user, analysisType);

    // Record usage
    await ShouldIApplyUsageService.recordUsage(user.id, jobId, analysisType);

    // Get upgrade suggestions if applicable
    const upgradeSuggestions =
      await ShouldIApplyUsageService.getUpgradeSuggestions(user.id);

    return NextResponse.json({
      ...analysis,
      usageInfo: {
        usageToday: usageCheck.usageToday + 1,
        dailyLimit: usageCheck.dailyLimit,
        userTier: usageCheck.userTier,
        analysisType,
      },
      upgradeSuggestions: upgradeSuggestions.shouldSuggestUpgrade
        ? upgradeSuggestions
        : null,
    });
  } catch (error) {
    console.error('Should I Apply API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/should-i-apply - Check usage status
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await ShouldIApplyUsageService.getUserUsageStats(
      user.id
    );
    const usageCheck = await ShouldIApplyUsageService.canUserAnalyze(user.id);
    const upgradeSuggestions =
      await ShouldIApplyUsageService.getUpgradeSuggestions(user.id);

    return NextResponse.json({
      usageStats,
      canUse: usageCheck.canUse,
      reason: usageCheck.reason,
      upgradeSuggestions: upgradeSuggestions.shouldSuggestUpgrade
        ? upgradeSuggestions
        : null,
    });
  } catch (error) {
    console.error('Should I Apply GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enhanced AI-powered analysis function
async function generateEnhancedAnalysis(
  job: any,
  user: any,
  analysisType: string
) {
  try {
    // Build user profile context
    const userContext = `
User Profile:
- Name: ${user.name || 'Not provided'}
- Current Job Title: ${user.currentJobTitle || 'Not provided'}
- Skills: ${user.skills?.join(', ') || 'Not provided'}
- Location: ${user.location || 'Not provided'}
- Preferred Job Types: ${user.preferredJobTypes?.join(', ') || 'Not provided'}
- Work Authorization: ${user.workAuthorization || 'Not provided'}
- Education/Experience: ${user.educationExperience || 'Not provided'}
- Bio: ${user.bio || 'Not provided'}
`;

    // Build job context
    const jobContext = `
Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Type: ${job.jobType}
- Salary Range: ${job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Not specified'}
- Categories: ${job.categories?.join(', ') || 'Not specified'}
- Required Skills: ${job.skills?.join(', ') || 'Not specified'}
- Description: ${job.description?.substring(0, 1000) || 'Not provided'}
- Requirements: ${job.requirements?.substring(0, 500) || 'Not provided'}
- Benefits: ${job.benefits?.substring(0, 300) || 'Not provided'}
`;

    const systemPrompt = `You are an expert career counselor and job matching specialist. Analyze whether a job seeker should apply for a specific job based on their profile and the job requirements.

Provide a comprehensive analysis that includes:
1. Overall recommendation (yes/maybe/no)
2. Confidence score (0-100)
3. Detailed explanation
4. Skill matching analysis
5. Positive factors
6. Areas of concern
7. Specific application tips (for premium users)

Consider factors like:
- Skills alignment
- Experience level match
- Location compatibility
- Career progression potential
- Salary expectations
- Job type preferences
- Growth opportunities

${analysisType === 'premium' ? 'Provide detailed, personalized insights and specific application strategies.' : 'Provide basic analysis focusing on key match factors.'}

Return your analysis as a JSON object with this structure:
{
  "recommendation": "yes|maybe|no",
  "confidence": 85,
  "explanation": "Detailed explanation of the recommendation",
  "skillMatch": {
    "matching": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"],
    "score": 75
  },
  "factors": {
    "positive": ["factor1", "factor2"],
    "negative": ["concern1", "concern2"],
    "neutral": ["consideration1", "consideration2"]
  },
  "applicationTips": ["tip1", "tip2"] // Only for premium users
}`;

    const userPrompt = `
${userContext}

${jobContext}

Analysis Type: ${analysisType}

Please analyze whether this job seeker should apply for this position and provide your recommendation in the specified JSON format.`;

    // Call OpenAI for analysis
    const response = await getChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: analysisType === 'premium' ? 1000 : 600,
        rateLimitId: 'should-i-apply-analysis',
        timeout: 30000,
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and clean the analysis
      return {
        recommendation: analysis.recommendation || 'maybe',
        confidence: Math.min(100, Math.max(0, analysis.confidence || 50)),
        explanation:
          analysis.explanation || 'Unable to generate detailed analysis.',
        skillMatch: {
          matching: (analysis.skillMatch?.matching || []).slice(0, 8),
          missing: (analysis.skillMatch?.missing || []).slice(0, 6),
          score: Math.min(100, Math.max(0, analysis.skillMatch?.score || 0)),
        },
        factors: {
          positive: (analysis.factors?.positive || []).slice(0, 5),
          negative: (analysis.factors?.negative || []).slice(0, 5),
          neutral: (analysis.factors?.neutral || []).slice(0, 3),
        },
        applicationTips:
          analysisType === 'premium'
            ? (analysis.applicationTips || []).slice(0, 5)
            : undefined,
      };
    }

    // Fallback to basic analysis if AI fails
    return generateBasicAnalysis(job, user);
  } catch (error) {
    console.error('Error generating enhanced analysis:', error);
    // Fallback to basic analysis
    return generateBasicAnalysis(job, user);
  }
}

// Fallback basic analysis function
function generateBasicAnalysis(job: any, user: any) {
  const userSkills = user.skills || [];
  const jobSkills = job.skills || [];
  const jobText = `${job.description} ${job.requirements}`.toLowerCase();

  // Calculate skill match
  const matchingSkills = userSkills.filter(
    (skill: string) =>
      jobSkills.some((jobSkill: string) =>
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      ) || jobText.includes(skill.toLowerCase())
  );

  const missingSkills = jobSkills
    .filter(
      (jobSkill: string) =>
        !userSkills.some((userSkill: string) =>
          userSkill.toLowerCase().includes(jobSkill.toLowerCase())
        )
    )
    .slice(0, 6);

  const skillMatchScore =
    jobSkills.length > 0
      ? Math.round((matchingSkills.length / jobSkills.length) * 100)
      : 50;

  // Determine recommendation
  let recommendation: 'yes' | 'maybe' | 'no' = 'maybe';
  let confidence = 60;

  if (skillMatchScore >= 70) {
    recommendation = 'yes';
    confidence = 80;
  } else if (skillMatchScore >= 40) {
    recommendation = 'maybe';
    confidence = 65;
  } else {
    recommendation = 'no';
    confidence = 40;
  }

  return {
    recommendation,
    confidence,
    explanation: generateExplanation(
      recommendation,
      skillMatchScore,
      matchingSkills.length,
      missingSkills.length
    ),
    skillMatch: {
      matching: matchingSkills.slice(0, 8),
      missing: missingSkills,
      score: skillMatchScore,
    },
    factors: {
      positive: [
        ...(matchingSkills.length > 0
          ? [`You have ${matchingSkills.length} relevant skills`]
          : []),
        ...(user.currentJobTitle
          ? ['Your current experience is relevant']
          : []),
        ...(job.location === user.location
          ? ['Job location matches your preference']
          : []),
      ],
      negative: [
        ...(missingSkills.length > 0
          ? [`Missing ${missingSkills.length} key skills`]
          : []),
        ...(skillMatchScore < 50
          ? ['Limited skill overlap with requirements']
          : []),
      ],
      neutral: [
        'Consider the company culture fit',
        'Review the full job requirements carefully',
      ],
    },
  };
}

function generateExplanation(
  recommendation: string,
  skillMatchScore: number,
  matchingSkillsCount: number,
  missingSkillsCount: number
): string {
  switch (recommendation) {
    case 'yes':
      return `Based on your profile analysis, this position appears to be an excellent match for your background. You have ${matchingSkillsCount} relevant skills that align well with the job requirements, giving you a ${skillMatchScore}% skill match. Your experience and qualifications make you a strong candidate for this role.`;

    case 'maybe':
      return `This position shows moderate alignment with your profile. While you have ${matchingSkillsCount} relevant skills, there are ${missingSkillsCount} key areas where additional experience would strengthen your application. Consider highlighting your transferable skills and willingness to learn when applying.`;

    case 'no':
      return `Based on the current analysis, this position may not be the best fit for your current skill set. You have ${matchingSkillsCount} matching skills, but there are significant gaps in the required qualifications. Consider developing the missing skills or looking for roles that better match your current expertise.`;

    default:
      return 'Unable to generate recommendation at this time.';
  }
}
