import { NextRequest, NextResponse } from 'next/server';
import { extractJobSearchFilters } from '@/lib/llm/extractJobSearchFilters';
import { prisma } from '../auth/prisma';
import { generateConversationalResponse, extractJobSearchFiltersWithContext } from '@/lib/llm/conversationalResponse';
import {
  withAISecurity,
  aiSecurityConfigs,
  type AISecurityContext,
  sanitizeUserData
} from '@/lib/middleware/ai-security';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/authOptions';

// Map job type variations to database enum values
function normalizeJobType(jobType: string | null): string | null {
  if (!jobType) return null;

  const normalized = jobType.toLowerCase().trim();

  // Map common variations to database enum values
  const jobTypeMap: { [key: string]: string } = {
    'full-time': 'full_time',
    'full time': 'full_time',
    'fulltime': 'full_time',
    'part-time': 'part_time',
    'part time': 'part_time',
    'parttime': 'part_time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'contract',
    'internship': 'internship',
    'intern': 'internship',
    'temporary': 'temporary',
    'temp': 'temporary',
    'volunteer': 'volunteer',
    'other': 'other'
  };

  return jobTypeMap[normalized] || normalized;
}

// Enhanced filter extraction that considers conversation context
function extractBasicFilters(userMessage: string, conversationHistory: any[] = []): any {
  const message = userMessage.toLowerCase();
  
  // Get context from previous messages
  const previousJobs = conversationHistory
    .filter(msg => msg.type === 'assistant' && msg.jobs)
    .flatMap(msg => msg.jobs)
    .slice(-20); // Last 20 jobs for context
  
  // Look for conversation context clues
  const isFollowUp = conversationHistory.length > 0;
  const lastUserMessage = conversationHistory
    .filter(msg => msg.type === 'user')
    .slice(-1)[0]?.content?.toLowerCase() || '';
  
  // Extract location keywords
  const locationKeywords = ['stockton', 'modesto', 'tracy', 'manteca', 'lodi', 'turlock', 'merced', 'fresno', 'visalia', 'bakersfield'];
  let location = locationKeywords.find(loc => message.includes(loc));
  
  // If no location in current message but is follow-up, check previous context
  if (!location && isFollowUp) {
    location = locationKeywords.find(loc => lastUserMessage.includes(loc));
  }
  
  // Extract job type keywords and normalize them
  let jobType = null;
  if (message.includes('part-time') || message.includes('part time')) jobType = normalizeJobType('part-time');
  if (message.includes('full-time') || message.includes('full time')) jobType = normalizeJobType('full-time');
  if (message.includes('contract')) jobType = normalizeJobType('contract');
  if (message.includes('temporary') || message.includes('temp')) jobType = normalizeJobType('temporary');
  
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
  if (message.includes('tech') || message.includes('software') || message.includes('developer')) {
    industry = 'technology';
  }
  if (message.includes('healthcare') || message.includes('medical')) {
    industry = 'healthcare';
  }
  if (message.includes('retail') || message.includes('sales')) {
    industry = 'retail';
  }
  
  // Extract remote preference
  const isRemote = message.includes('remote') || message.includes('work from home');
  
  // Handle sorting/ranking requests with more variety
  let sortBy = 'relevance';
  if (message.includes('highest paid') || message.includes('highest salary') || message.includes('best paid')) {
    sortBy = 'salary_desc';
  }
  if (message.includes('lowest paid') || message.includes('lowest salary')) {
    sortBy = 'salary_asc';
  }
  if (message.includes('newest') || message.includes('most recent') || message.includes('latest')) {
    sortBy = 'date_desc';
  }
  if (message.includes('oldest')) {
    sortBy = 'date_asc';
  }
  
  // Handle filtering refinements
  if (message.includes('only') || message.includes('just') || message.includes('filter')) {
    // Keep previous context but apply new filters
  }
  
  return {
    location,
    job_type: jobType,
    role,
    industry,
    isRemote,
    sortBy,
    other: userMessage,
    previousJobs, // Include previous jobs for context
    conversationContext: {
      isFollowUp,
      previousLocation: lastUserMessage ? locationKeywords.find(loc => lastUserMessage.includes(loc)) : null,
      messageCount: conversationHistory.length
    },
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

// Build job query with enhanced sorting
function buildJobQueryFromFilters(filters: any) {
  const query: any = {
    status: 'active',
    AND: [], // Use AND array instead of mixing OR directly
  };

  // Add basic filters to ensure we only get active, non-expired jobs
  query.AND.push({
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ]
  });

  // If we have previous jobs and this is a sorting request, filter to those jobs
  if (filters.previousJobs && filters.previousJobs.length > 0 && filters.sortBy !== 'relevance') {
    const jobIds = filters.previousJobs.map((job: any) => job.id).filter(Boolean);
    if (jobIds.length > 0) {
      query.AND.push({ id: { in: jobIds } });
    }
  }

  // Location filter
  if (filters.location) {
    query.AND.push({ 
      location: { 
        contains: filters.location, 
        mode: 'insensitive' 
      } 
    });
  }

  // Job type filter (note: field is jobType in schema)
  if (filters.job_type) {
    query.AND.push({ jobType: filters.job_type });
  }

  // Company filter
  if (filters.company) {
    query.AND.push({ 
      company: { 
        contains: filters.company, 
        mode: 'insensitive' 
      } 
    });
  }

  // Industry filter (using categories array field)
  if (filters.industry) {
    query.AND.push({ 
      categories: { 
        has: filters.industry 
      } 
    });
  }

  // Role/title filter
  if (filters.role) {
    query.AND.push({ 
      title: { 
        contains: filters.role, 
        mode: 'insensitive' 
      } 
    });
  }

  // Remote filter
  if (typeof filters.isRemote === 'boolean') {
    query.AND.push({ isRemote: filters.isRemote });
  }

  // General search terms (only if no previous jobs to work with)
  if (filters.other && !filters.previousJobs) {
    query.AND.push({
      OR: [
        { title: { contains: filters.other, mode: 'insensitive' } },
        { description: { contains: filters.other, mode: 'insensitive' } },
        { company: { contains: filters.other, mode: 'insensitive' } }
      ]
    });
  }

  // Clean up empty AND array
  if (query.AND.length === 0) {
    delete query.AND;
  }

  return query;
}

// Get sort order for Prisma - fixed to use proper Prisma orderBy format
function getSortOrder(sortBy: string) {
  switch (sortBy) {
    case 'salary_desc':
      // Sort by max salary first, then min salary, both descending
      return [
        { salaryMax: 'desc' as const },
        { salaryMin: 'desc' as const },
        { postedAt: 'desc' as const } // Fallback sort
      ];
    case 'salary_asc':
      // Sort by min salary first, then max salary, both ascending
      return [
        { salaryMin: 'asc' as const },
        { salaryMax: 'asc' as const },
        { postedAt: 'desc' as const } // Fallback sort
      ];
    case 'date_desc':
      return [{ postedAt: 'desc' as const }];
    case 'date_asc':
      return [{ postedAt: 'asc' as const }];
    default:
      return [{ postedAt: 'desc' as const }];
  }
}

// Secure the POST endpoint with AI security
export const POST = withAISecurity(
  async (req: NextRequest, context: AISecurityContext) => {
    try {
      // Use body from security context (already parsed)
      const body = context.body;

      if (!body) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      const {
        userMessage,
        conversationHistory = [],
        userProfile = null,
        sessionId = null
      } = body;

      if (!userMessage || typeof userMessage !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid userMessage' }, { status: 400 });
      }

      // Use authenticated user from security context
      const authenticatedUserId = context.user?.id || null;

      // Fetch comprehensive user profile if authenticated
      let enhancedUserProfile = userProfile;
      if (authenticatedUserId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: authenticatedUserId },
            select: {
              id: true,
              name: true,
              location: true,
              currentJobTitle: true,
              skills: true,
              experienceLevel: true,
              preferredJobTypes: true,
              resumeUrl: true,
              workAuthorization: true,
              educationExperience: true,
              // Include job application history for context
              jobApplications: {
                select: {
                  status: true,
                  appliedAt: true,
                  job: {
                    select: {
                      title: true,
                      company: true,
                      location: true,
                      jobType: true,
                      categories: true,
                    }
                  }
                },
                orderBy: { appliedAt: 'desc' },
                take: 10, // Last 10 applications for context
              }
            }
          });

          if (user) {
            enhancedUserProfile = {
              userId: user.id,
              name: user.name,
              location: user.location,
              currentJobTitle: user.currentJobTitle,
              skills: user.skills || [],
              experienceLevel: user.experienceLevel,
              preferredJobTypes: user.preferredJobTypes || [],
              resumeUrl: user.resumeUrl,
              workAuthorization: user.workAuthorization,
              educationExperience: user.educationExperience,
              applicationHistory: user.jobApplications.map(app => ({
                status: app.status,
                appliedAt: app.appliedAt,
                jobTitle: app.job.title,
                company: app.job.company,
                location: app.job.location,
                jobType: app.job.jobType,
                categories: app.job.categories,
              })),
            };
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }

      // Sanitize user profile data before processing
      const sanitizedUserProfile = sanitizeUserData(enhancedUserProfile);

    // Check if OpenAI API key is available
    const hasValidApiKey = process.env.OPENAI_API_KEY && 
      process.env.OPENAI_API_KEY !== 'your-openai-key' && 
      process.env.OPENAI_API_KEY !== 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

    let filters;
    if (hasValidApiKey) {
      try {
        // Try enhanced filter extraction with conversation context first
        filters = await extractJobSearchFiltersWithContext(userMessage, conversationHistory);
        
        if (!filters) {
          // Fallback to standard AI filter extraction
          filters = await extractJobSearchFilters(userMessage, conversationHistory);
        }
        
        if (!filters) {
          // Final fallback to basic search
          filters = extractBasicFilters(userMessage, conversationHistory);
        }
      } catch (error) {
        console.error('AI filter extraction failed:', error);
        filters = extractBasicFilters(userMessage, conversationHistory);
      }
    } else {
      console.warn('No valid OpenAI API key found. Using basic keyword extraction.');
      // Use basic keyword extraction when OpenAI is not available
      filters = extractBasicFilters(userMessage, conversationHistory);
    }

    // Normalize job type in filters before building query
    if (filters.job_type) {
      filters.job_type = normalizeJobType(filters.job_type);
    }

    // Build and execute job query
    const jobQuery = buildJobQueryFromFilters(filters);
    const sortOrder = getSortOrder(filters.sortBy || 'relevance');
    
    // Debug logging
    console.log('Job query:', JSON.stringify(jobQuery, null, 2));
    console.log('Sort order:', JSON.stringify(sortOrder, null, 2));
    
    let jobs = [];
    try {
      jobs = await prisma.job.findMany({
        where: jobQuery,
        orderBy: sortOrder,
        take: 20,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          postedAt: true,
          isRemote: true,
          url: true,
          categories: true,
          requirements: true,
          benefits: true
        }
      });
      console.log(`Successfully found ${jobs.length} jobs`);
    } catch (queryError) {
      console.error('Job query error details:', {
        error: queryError,
        query: jobQuery,
        sortOrder: sortOrder,
        message: queryError instanceof Error ? queryError.message : 'Unknown error'
      });
      return NextResponse.json({ 
        error: 'Failed to query jobs', 
        details: queryError instanceof Error ? queryError.message : String(queryError),
        query: jobQuery,
        sortOrder: sortOrder
      }, { status: 500 });
    }

    // Generate response based on context
    let conversationalResponse: string;
    
    if (hasValidApiKey) {
      try {
        conversationalResponse = await generateConversationalResponse({
          userMessage,
          filters,
          jobs: jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            description: job.description,
          })),
          conversationHistory,
          userProfile: sanitizedUserProfile,
          jobMatches: []
        });
      } catch (error) {
        console.error('AI response generation failed:', error);
        conversationalResponse = generateBasicResponse(userMessage, filters, jobs, conversationHistory);
      }
    } else {
      conversationalResponse = generateBasicResponse(userMessage, filters, jobs, conversationHistory);
    }

    // Generate enhanced follow-up questions
    const followUpQuestions = generateContextualFollowUpQuestions(userMessage, filters, jobs, conversationHistory);

    // Save analytics data if user is authenticated
    if (authenticatedUserId && sessionId) {
      try {
        const endTime = Date.now();
        const startTime = context.startTime || endTime;
        const responseTime = (endTime - startTime) / 1000; // Convert to seconds

        await prisma.chatAnalytics.create({
          data: {
            userId: authenticatedUserId,
            sessionId: sessionId,
            question: userMessage,
            response: conversationalResponse,
            jobsFound: jobs.length,
            responseTime: responseTime,
            metadata: {
              filters,
              hasValidApiKey,
              conversationLength: conversationHistory.length,
              userSkills: sanitizedUserProfile?.skills?.length || 0,
              sortBy: filters.sortBy || 'relevance'
            }
          }
        });
      } catch (analyticsError) {
        console.error('Failed to save chat analytics:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }

      return NextResponse.json({
        response: conversationalResponse,
        jobs,
        followUpQuestions,
        filters,
        metadata: {
          totalResults: jobs.length,
          hasUserProfile: !!sanitizedUserProfile,
          hasEnhancedProfile: !!enhancedUserProfile && !!authenticatedUserId,
          sessionId,
          timestamp: new Date().toISOString(),
          sortBy: filters.sortBy || 'relevance',
          hasValidApiKey,
          conversationLength: conversationHistory.length,
          authenticatedUserId,
          userSkills: sanitizedUserProfile?.skills?.length || 0,
          userApplicationHistory: sanitizedUserProfile?.applicationHistory?.length || 0
        }
      });
    } catch (error) {
      console.error('Chat job search error:', error);
      return NextResponse.json({ error: 'Invalid request or server error' }, { status: 500 });
    }
  },
  aiSecurityConfigs.public // Use AI-specific security configuration
);

// Generate basic response when OpenAI is not available
function generateBasicResponse(userMessage: string, filters: any, jobs: any[], conversationHistory: any[]): string {
  const isFollowUp = conversationHistory.length > 0;
  const isSortingRequest = filters.sortBy && filters.sortBy !== 'relevance';
  const message = userMessage.toLowerCase();
  const isCitySearch = message.includes('all jobs in') || (message.includes('jobs') && filters.location);

  if (isSortingRequest && filters.previousJobs) {
    const sortType = filters.sortBy === 'salary_desc' ? 'highest to lowest paid' :
                    filters.sortBy === 'salary_asc' ? 'lowest to highest paid' :
                    filters.sortBy === 'date_desc' ? 'newest first' : 'oldest first';

    return `I've re-sorted the previous ${filters.previousJobs.length} jobs by ${sortType}. ${jobs.length > 0 ? `Here are the results ranked as requested.` : 'No jobs found with the specified criteria.'}`;
  }

  if (jobs.length === 0) {
    if (filters.location) {
      return `I searched for jobs in ${filters.location} but didn't find any matching "${userMessage}". Try searching for broader terms like "warehouse", "customer service", or "healthcare" in ${filters.location}.`;
    }
    return `I searched for "${userMessage}" but didn't find any matching jobs. Try searching for broader terms like "warehouse", "customer service", or "healthcare" in cities like Stockton, Modesto, or Tracy.`;
  }

  let response = '';

  if (isCitySearch && !isFollowUp && filters.location) {
    // More engaging response for city-based searches
    response = `Great! I found ${jobs.length} job opportunity${jobs.length !== 1 ? 'ies' : ''} in ${filters.location}. `;

    // Add some variety to the response
    if (jobs.length > 10) {
      response += `There's a good variety of positions available! `;
    } else if (jobs.length > 5) {
      response += `Here are some great options for you. `;
    } else {
      response += `Here are the current openings. `;
    }

    response += `What type of work interests you most?`;
  } else {
    // Standard response for other searches
    response = `I found ${jobs.length} job${jobs.length !== 1 ? 's' : ''} matching "${userMessage}".`;

    if (filters.location) {
      response += ` These positions are in the ${filters.location} area.`;
    }

    if (filters.job_type) {
      response += ` All results are ${filters.job_type.replace('_', '-')} positions.`;
    }

    if (isFollowUp) {
      response += ` I've updated the search based on your follow-up question.`;
    }
  }

  return response;
}

// Generate contextual follow-up questions
function generateContextualFollowUpQuestions(userMessage: string, filters: any, jobs: any[], conversationHistory: any[]): string[] {
  const questions: string[] = [];
  const message = userMessage.toLowerCase();
  const isFirstSearch = conversationHistory.length === 0;

  // Check if this is a city-based search (like "all jobs in Stockton")
  const isCitySearch = message.includes('all jobs in') || (message.includes('jobs') && filters.location);

  if (isCitySearch && isFirstSearch && jobs.length > 0) {
    // Engaging follow-up questions for city-based searches
    const city = filters.location || 'the area';
    questions.push(`What type of work are you looking for in ${city}?`);
    questions.push(`Show me healthcare jobs in ${city}`);
    questions.push(`Find warehouse and logistics jobs in ${city}`);
    questions.push(`What customer service jobs are available in ${city}?`);
  } else if (jobs.length > 1) {
    if (!message.includes('highest') && !message.includes('lowest') && !message.includes('salary')) {
      questions.push("Rank these by highest paid to lowest paid");
    }
    if (!message.includes('newest') && !message.includes('recent')) {
      questions.push("Show me the newest jobs first");
    }
    if (!filters.location) {
      questions.push("Filter these to Stockton only");
    }
  }

  if (jobs.length === 0) {
    if (filters.location) {
      const city = filters.location;
      questions.push(`Show me all warehouse jobs in ${city}`);
      questions.push(`Find customer service jobs in ${city}`);
      questions.push(`What about part-time positions in ${city}?`);
    } else {
      questions.push("Show me all warehouse jobs in the 209 area");
      questions.push("Find customer service jobs instead");
      questions.push("What about part-time positions?");
    }
  } else if (jobs.length < 5 && !isCitySearch) {
    questions.push("Show me similar jobs in nearby cities");
    questions.push("Include part-time positions too");
  }

  return questions.slice(0, 3);
}
