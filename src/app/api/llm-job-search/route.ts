import { NextRequest, NextResponse } from '@/lib/ai';
import { prisma } from '@/lib/middleware/ai-security';

// Basic keyword extraction fallback when OpenAI is not available
function extractBasicFilters(userMessage: string): any {
  const message = userMessage.toLowerCase();

  // Extract location keywords
  const locationKeywords = [
    'stockton',
    'modesto',
    'tracy',
    'manteca',
    'lodi',
    'turlock',
    'merced',
    'fresno',
  ];
  const location = locationKeywords.find(loc => message.includes(loc));

  // Extract job type keywords
  let jobType = null;
  if (message.includes('part-time') || message.includes('part time'))
    jobType = 'part_time';
  if (message.includes('full-time') || message.includes('full time'))
    jobType = 'full_time';
  if (message.includes('contract')) jobType = 'contract';
  if (message.includes('temporary') || message.includes('temp'))
    jobType = 'temporary';

  // Extract role/industry keywords
  let role = null;
  let industry = null;
  if (message.includes('nursing') || message.includes('nurse')) {
    role = 'nurse';
    industry = 'healthcare';
  }
  if (message.includes('warehouse') || message.includes('logistics')) {
    role = 'warehouse';
    industry = 'logistics';
  }
  if (message.includes('customer service') || message.includes('support')) {
    role = 'customer service';
  }
  if (
    message.includes('tech') ||
    message.includes('software') ||
    message.includes('developer')
  ) {
    industry = 'technology';
  }

  // Extract remote preference
  const isRemote =
    message.includes('remote') || message.includes('work from home');

  return {
    location,
    job_type: jobType,
    role,
    industry,
    isRemote,
    other: userMessage, // Keep original message for broader search
    age: null,
    region: null,
    schedule: null,
    salary: null,
    experience_level: null,
    company: null,
    requirements: null,
    benefits: null,
    application_type: null,
    skills: null,
    categories: null,
    postedAt: null
  };
}

function buildJobQueryFromFilters(filters: any) {
  const query: any = {
    status: 'active',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
  };

  if (filters.location) {
    query.location = { contains: filters.location, mode: 'insensitive' };
  }
  if (filters.job_type) {
    query.jobType = { equals: filters.job_type, mode: 'insensitive' };
  }
  if (filters.company) {
    query.company = { contains: filters.company, mode: 'insensitive' };
  }
  if (filters.industry) {
    query.categories = { has: filters.industry };
  }
  if (filters.role) {
    query.title = { contains: filters.role, mode: 'insensitive' };
  }
  if (filters.schedule) {
    query.description = { contains: filters.schedule, mode: 'insensitive' };
  }
  if (filters.salary) {
    // Try to parse salary as a number or range
    const salaryNum = parseInt(filters.salary.replace(/[^\d]/g, ''));
    if (!isNaN(salaryNum)) {
      query.OR.push(
        { salaryMin: { gte: salaryNum } },
        { salaryMax: { gte: salaryNum } }
      );
    }
  }
  if (filters.experience_level) {
    query.description = {
      contains: filters.experience_level,
      mode: 'insensitive'
    };
  }
  if (filters.requirements) {
    query.requirements = {
      contains: filters.requirements,
      mode: 'insensitive'
    };
  }
  if (filters.benefits) {
    query.benefits = { contains: filters.benefits, mode: 'insensitive' };
  }
  if (filters.application_type) {
    query.description = {
      contains: filters.application_type,
      mode: 'insensitive'
    };
  }
  if (filters.other) {
    query.description = { contains: filters.other, mode: 'insensitive' };
  }
  if (filters.region) {
    query.region = { equals: filters.region, mode: 'insensitive' };
  }
  if (
    filters.skills &&
    Array.isArray(filters.skills) &&
    filters.skills.length > 0
  ) {
    query.skills = { hasEvery: filters.skills };
  }
  if (typeof filters.isRemote === 'boolean') {
    query.isRemote = { equals: filters.isRemote };
  }
  if (
    filters.categories &&
    Array.isArray(filters.categories) &&
    filters.categories.length > 0
  ) {
    query.categories = { hasEvery: filters.categories };
  }
  if (filters.postedAt) {
    // Support values like 'last 7 days', 'last 30 days', etc.
    const match = filters.postedAt.match(/last (\d+) days?/i);
    if (match) {
      const days = parseInt(match[1], 10);
      if (!isNaN(days)) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        query.postedAt = { gte: sinceDate };
      }
    }
    // Optionally, add more parsing for other date formats
  }
  // Age is not directly filterable unless you have a minAge field, so skip for now
  return query;
}

export const POST = withAISecurity(
  async (req: NextRequest, context: AISecurityContext) => {
    try {
      // Use body from security context (already parsed)
      const body = context.body;

      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }

      const {
        userMessage,
        conversationHistory = [],
        userProfile = null,
        sessionId = null
      } = body;

      if (!userMessage || typeof userMessage !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid userMessage' },
          { status: 400 }
        );
      }

      // Sanitize user profile data before processing
      const sanitizedUserProfile = sanitizeUserData(userProfile);

      // Check if AI API keys are available
      const hasValidOpenAIKey =
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'your-openai-key' &&
        process.env.OPENAI_API_KEY !==
          'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

      const hasValidAnthropicKey =
        process.env.ANTHROPIC_API_KEY &&
        process.env.ANTHROPIC_API_KEY !== 'your-anthropic-key';

      const hasValidApiKey = hasValidOpenAIKey || hasValidAnthropicKey;

      let filters;
      if (hasValidApiKey) {
        // Extract filters with conversation context using AI
        filters = await extractJobSearchFilters(
          userMessage,
          conversationHistory
        );
        if (!filters) {
          // Fallback to basic search if AI extraction fails
          filters = extractBasicFilters(userMessage);
        }
      } else {
        // Use basic keyword extraction when OpenAI is not available
        filters = extractBasicFilters(userMessage);
      }

      // Build and execute job query
      const jobQuery = buildJobQueryFromFilters(filters);
      let jobs = [];
      try {
        jobs = await prisma.job.findMany({
          where: jobQuery,
          orderBy: { postedAt: 'desc' },
          take: 20
        });
      } catch (queryError) {
        console.error('Job query error:', queryError);
        return NextResponse.json(
          { error: 'Failed to query jobs', details: String(queryError) },
          { status: 500 }
        );
      }

      // Handle empty database gracefully
      if (jobs.length === 0) {
        return NextResponse.json({
          filters,
          jobs: [],
          summary:
            "I couldn't find any jobs matching your search. This might be because:\n\n1. **No jobs imported yet** - The job board may need to import jobs from external sources\n2. **Very specific criteria** - Try broadening your search terms\n3. **Location mismatch** - Make sure you're searching in the 209 area\n\nTry searching for general terms like 'warehouse', 'retail', or 'customer service' in cities like Stockton, Modesto, or Tracy.",
          jobMatches: [],
          followUpQuestions: [
            'Show me all available jobs',
            'What jobs are available in Stockton?',
            'Find warehouse jobs in the 209 area',
            'Show me customer service positions',
          ],
          searchMetadata: {
            totalResults: 0,
            hasUserProfile: !!userProfile,
            sessionId,
            timestamp: new Date().toISOString(),
            emptyDatabase: true
          }
        });
      }

      // Prepare jobs for analysis
      const jobSummaries = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits
      }));

      // Generate intelligent response
      let conversationalResponse: string | null = null;
      let jobMatches: any[] = [];
      let followUpQuestions: string[] = [];

      if (hasValidApiKey) {
        try {
          // Analyze job matches if user profile is available
          if (sanitizedUserProfile && jobs.length > 0) {
            jobMatches = await analyzeJobMatches(
              jobSummaries,
              sanitizedUserProfile
            );
          }

          // Generate conversational response
          conversationalResponse = await generateConversationalResponse({
            userMessage,
            filters,
            jobs: jobSummaries,
            conversationHistory,
            userProfile: sanitizedUserProfile,
            jobMatches
          });

          // Generate follow-up questions based on results
          followUpQuestions = generateFollowUpQuestions(
            filters,
            jobs.length,
            sanitizedUserProfile
          );
        } catch (analysisError) {
          console.error('Analysis error:', analysisError);
          // Fallback to basic summary
          conversationalResponse = generateBasicSummary(
            userMessage,
            filters,
            jobs.length
          );
          followUpQuestions = generateBasicFollowUpQuestions(
            filters,
            jobs.length
          );
        }
      } else {
        // Generate basic response when OpenAI is not available
        conversationalResponse = generateBasicSummary(
          userMessage,
          filters,
          jobs.length
        );
        followUpQuestions = generateBasicFollowUpQuestions(
          filters,
          jobs.length
        );
      }

      return NextResponse.json({
        filters,
        jobs,
        summary: conversationalResponse,
        jobMatches,
        followUpQuestions,
        searchMetadata: {
          totalResults: jobs.length,
          hasUserProfile: !!sanitizedUserProfile,
          sessionId,
          timestamp: new Date().toISOString(),
          authenticatedUserId: context.user?.id || null
        }
      });
    } catch (error) {
      console.error('LLM job search error:', error);
      return NextResponse.json(
        { error: 'Invalid request or server error' },
        { status: 500 }
      );
    }
  },
  aiSecurityConfigs.public // Use AI-specific security configuration
);

// Basic summary generation when OpenAI is not available
function generateBasicSummary(
  userMessage: string,
  filters: any,
  resultCount: number
): string {
  if (resultCount === 0) {
    return `I searched for jobs based on your request "${userMessage}" but didn't find any matches. This could be because:

• The job database is still being populated with local opportunities
• Your search criteria might be very specific
• Try searching for broader terms like "warehouse", "customer service", or "healthcare"

The 209Jobs platform focuses on local opportunities in Stockton, Modesto, Tracy, and surrounding Central Valley cities.`;
  }

  let summary = `I found ${resultCount} job${resultCount !== 1 ? 's' : ''} matching your search for "${userMessage}".`;

  if (filters.location) {
    summary += ` These positions are in the ${filters.location} area.`;
  } else {
    summary += ` These positions are located throughout the 209 area.`;
  }

  if (filters.job_type) {
    summary += ` All results are ${filters.job_type.replace('_', '-')} positions.`;
  }

  if (filters.industry) {
    summary += ` The jobs are in the ${filters.industry} industry.`;
  }

  summary += ` Browse through the results below to find opportunities that match your interests and qualifications.`;

  return summary;
}

// Basic follow-up questions when OpenAI is not available
function generateBasicFollowUpQuestions(
  filters: any,
  resultCount: number
): string[] {
  const questions: string[] = [];

  if (resultCount === 0) {
    questions.push('Show me all available jobs in the 209 area');
    questions.push('Find warehouse jobs in Stockton');
    questions.push('What customer service jobs are available?');
  } else if (resultCount > 10) {
    questions.push('Show me only full-time positions');
    questions.push('Filter by jobs in Stockton only');
    questions.push('Find jobs with higher pay');
  } else {
    questions.push('Show me similar jobs in other cities');
    questions.push('Find part-time opportunities');
    questions.push('What other jobs are available?');
  }

  return questions.slice(0, 3);
}

// Helper function to generate follow-up questions
function generateFollowUpQuestions(
  filters: any,
  resultCount: number,
  userProfile: any
): string[] {
  const questions: string[] = [];

  if (resultCount === 0) {
    questions.push('Would you like me to search in nearby cities?');
    questions.push('Are you open to remote work opportunities?');
    questions.push(
      'Would you consider a different job type (part-time, contract, etc.)?'
    );
  } else if (resultCount > 10) {
    questions.push('Would you like me to narrow down these results?');
    questions.push(
      'Are you looking for any specific company size or industry?'
    );
    questions.push("What's your preferred salary range?");
  } else {
    questions.push('Would you like more details about any of these positions?');
    questions.push('Are you interested in similar roles at other companies?');
    questions.push('Would you like me to help you prepare for applications?');
  }

  // Add profile-specific questions
  if (!userProfile) {
    questions.push(
      'Would you like to tell me about your experience to get better matches?'
    );
  }

  return questions.slice(0, 3); // Return max 3 questions
}
