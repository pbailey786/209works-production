import { NextRequest, NextResponse } from 'next/server';
import { extractJobSearchFilters } from '@/lib/llm/extractJobSearchFilters';
import { prisma } from '../auth/prisma';
import {
  generateConversationalResponse,
  extractJobSearchFiltersWithContext,
} from '@/lib/llm/conversationalResponse';
import {
  withAISecurity,
  aiSecurityConfigs,
  type AISecurityContext,
  sanitizeUserData,
} from '@/lib/middleware/ai-security';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/authOptions';

// Map job type variations to database enum values
function normalizeJobType(jobType: string | null): string | null {
  if (!jobType) return null;

  const normalized = jobType.toLowerCase().trim();

  // Map common variations to database enum values
  const jobTypeMap: { [key: string]: string } = {
    'full-time': 'full_time',
    'full time': 'full_time',
    fulltime: 'full_time',
    'part-time': 'part_time',
    'part time': 'part_time',
    parttime: 'part_time',
    contract: 'contract',
    contractor: 'contract',
    freelance: 'contract',
    internship: 'internship',
    intern: 'internship',
    volunteer: 'volunteer',
    other: 'other',
  };

  return jobTypeMap[normalized] || normalized;
}

// Enhanced filter extraction that considers conversation context
function extractBasicFilters(
  userMessage: string,
  conversationHistory: any[] = []
): any {
  const message = userMessage.toLowerCase();

  // Get context from previous messages
  const previousJobs = conversationHistory
    .filter(msg => msg.type === 'assistant' && msg.jobs)
    .flatMap(msg => msg.jobs)
    .slice(-20); // Last 20 jobs for context

  // Look for conversation context clues
  const isFollowUp = conversationHistory.length > 0;
  const lastUserMessage =
    conversationHistory
      .filter(msg => msg.type === 'user')
      .slice(-1)[0]
      ?.content?.toLowerCase() || '';

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
    'visalia',
    'bakersfield',
  ];
  let location = locationKeywords.find(loc => message.includes(loc));

  // If no location in current message but is follow-up, check previous context
  if (!location && isFollowUp) {
    location = locationKeywords.find(loc => lastUserMessage.includes(loc));
  }

  // Extract job type keywords and normalize them
  let jobType = null;
  if (message.includes('part-time') || message.includes('part time'))
    jobType = normalizeJobType('part-time');
  if (message.includes('full-time') || message.includes('full time'))
    jobType = normalizeJobType('full-time');
  if (message.includes('contract')) jobType = normalizeJobType('contract');

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
  if (message.includes('healthcare') || message.includes('medical')) {
    industry = 'healthcare';
  }
  if (message.includes('retail') || message.includes('sales')) {
    industry = 'retail';
  }

  // Extract remote preference
  const isRemote =
    message.includes('remote') || message.includes('work from home');

  // Handle sorting/ranking requests with more variety
  let sortBy = 'relevance';
  if (
    message.includes('highest paid') ||
    message.includes('highest salary') ||
    message.includes('best paid')
  ) {
    sortBy = 'salary_desc';
  }
  if (message.includes('lowest paid') || message.includes('lowest salary')) {
    sortBy = 'salary_asc';
  }
  if (
    message.includes('newest') ||
    message.includes('most recent') ||
    message.includes('latest')
  ) {
    sortBy = 'date_desc';
  }
  if (message.includes('oldest')) {
    sortBy = 'date_asc';
  }

  // Handle filtering refinements
  if (
    message.includes('only') ||
    message.includes('just') ||
    message.includes('filter')
  ) {
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
      previousLocation: lastUserMessage
        ? locationKeywords.find(loc => lastUserMessage.includes(loc))
        : null,
      messageCount: conversationHistory.length,
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
    postedAt: null,
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
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  });

  // If we have previous jobs and this is a sorting request, filter to those jobs
  if (
    filters.previousJobs &&
    filters.previousJobs.length > 0 &&
    filters.sortBy !== 'relevance'
  ) {
    const jobIds = filters.previousJobs
      .map((job: any) => job.id)
      .filter(Boolean);
    if (jobIds.length > 0) {
      query.AND.push({ id: { in: jobIds } });
    }
  }

  // Location filter
  if (filters.location) {
    query.AND.push({
      location: {
        contains: filters.location,
        mode: 'insensitive',
      },
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
        mode: 'insensitive',
      },
    });
  }

  // Industry filter (using categories array field)
  if (filters.industry) {
    query.AND.push({
      categories: {
        has: filters.industry,
      },
    });
  }

  // Role/title filter
  if (filters.role) {
    query.AND.push({
      title: {
        contains: filters.role,
        mode: 'insensitive',
      },
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
        { company: { contains: filters.other, mode: 'insensitive' } },
      ],
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
        { postedAt: 'desc' as const }, // Fallback sort
      ];
    case 'salary_asc':
      // Sort by min salary first, then max salary, both ascending
      return [
        { salaryMin: 'asc' as const },
        { salaryMax: 'asc' as const },
        { postedAt: 'desc' as const }, // Fallback sort
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
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }

      const {
        userMessage,
        conversationHistory = [],
        userProfile = null,
        sessionId = null,
      } = body;

      if (!userMessage || typeof userMessage !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid userMessage' },
          { status: 400 }
        );
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
                    },
                  },
                },
                orderBy: { appliedAt: 'desc' },
                take: 10, // Last 10 applications for context
              },
            },
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
      const hasValidApiKey =
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'your-openai-key' &&
        process.env.OPENAI_API_KEY !==
          'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

      let filters;
      if (hasValidApiKey) {
        try {
          // Try enhanced filter extraction with conversation context first
          filters = await extractJobSearchFiltersWithContext(
            userMessage,
            conversationHistory
          );

          if (!filters) {
            // Fallback to standard AI filter extraction
            filters = await extractJobSearchFilters(
              userMessage,
              conversationHistory
            );
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
        console.warn(
          'No valid OpenAI API key found. Using basic keyword extraction.'
        );
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
            benefits: true,
          },
        });
        console.log(`Successfully found ${jobs.length} jobs`);
      } catch (queryError) {
        console.error('Job query error details:', {
          error: queryError,
          query: jobQuery,
          sortOrder: sortOrder,
          message:
            queryError instanceof Error ? queryError.message : 'Unknown error',
        });
        return NextResponse.json(
          {
            error: 'Failed to query jobs',
            details:
              queryError instanceof Error
                ? queryError.message
                : String(queryError),
            query: jobQuery,
            sortOrder: sortOrder,
          },
          { status: 500 }
        );
      }

      // Generate response based on context
      let conversationalResponse: string;

      if (hasValidApiKey) {
        try {
          // For general conversation or when no jobs found, use general AI response
          if (jobs.length === 0 || !isJobSearchQuery(userMessage)) {
            conversationalResponse = await generateGeneralConversationalResponse(
              userMessage,
              conversationHistory,
              sanitizedUserProfile
            );
          } else {
            // For job search with results, use job-specific response
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
              jobMatches: [],
            });
          }
        } catch (error) {
          console.error('AI response generation failed:', error);
          conversationalResponse = generateBasicResponse(
            userMessage,
            filters,
            jobs,
            conversationHistory
          );
        }
      } else {
        conversationalResponse = generateBasicResponse(
          userMessage,
          filters,
          jobs,
          conversationHistory
        );
      }

      // Generate enhanced follow-up questions
      const followUpQuestions = generateContextualFollowUpQuestions(
        userMessage,
        filters,
        jobs,
        conversationHistory
      );

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
                sortBy: filters.sortBy || 'relevance',
              },
            },
          });
        } catch (analyticsError) {
          console.error('Failed to save chat analytics:', analyticsError);
          // Don't fail the request if analytics fails
        }

        // Save chat history for authenticated users
        try {
          const MAX_CONVERSATIONS_PER_USER = 10;

          // Build updated conversation history
          const updatedConversationHistory = [
            ...conversationHistory,
            { role: 'user', content: userMessage, timestamp: new Date() },
            { role: 'assistant', content: conversationalResponse, timestamp: new Date() }
          ];

          // Check if conversation already exists (handle case where table doesn't exist yet)
          let existingConversation = null;
          let chatHistoryTableExists = true;
          try {
            existingConversation = await prisma.chatHistory.findFirst({
              where: {
                userId: authenticatedUserId,
                sessionId: sessionId,
              },
            });
          } catch (tableError) {
            // ChatHistory table doesn't exist yet, skip saving for now
            console.log('ChatHistory table not available yet, skipping chat history save');
            chatHistoryTableExists = false;
          }

          if (chatHistoryTableExists) {
            if (existingConversation) {
              // Update existing conversation
              await prisma.chatHistory.update({
                where: { id: existingConversation.id },
                data: {
                  messages: updatedConversationHistory,
                  lastActivity: new Date(),
                },
              });
            } else {
              // Check if user has reached the limit
              const userConversationCount = await prisma.chatHistory.count({
                where: { userId: authenticatedUserId },
              });

              if (userConversationCount >= MAX_CONVERSATIONS_PER_USER) {
                // Remove the oldest conversation
                const oldestConversation = await prisma.chatHistory.findFirst({
                  where: { userId: authenticatedUserId },
                  orderBy: { lastActivity: 'asc' },
                });

                if (oldestConversation) {
                  await prisma.chatHistory.delete({
                    where: { id: oldestConversation.id },
                  });
                }
              }

              // Create new conversation with a title based on first user message
              const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;

              await prisma.chatHistory.create({
                data: {
                  userId: authenticatedUserId,
                  sessionId: sessionId,
                  messages: updatedConversationHistory,
                  title: title,
                  lastActivity: new Date(),
                },
              });
            }
          }
        } catch (historyError) {
          console.error('Failed to save chat history:', historyError);
          // Don't fail the request if history saving fails
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
          userApplicationHistory:
            sanitizedUserProfile?.applicationHistory?.length || 0,
        },
      });
    } catch (error) {
      console.error('Chat job search error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
      });

      // Always return a helpful response instead of an error
      const fallbackUserMessage = context.body?.userMessage || 'hello';
      const fallbackConversationHistory = context.body?.conversationHistory || [];
      const fallbackResponse = generateBasicConversationalResponse(fallbackUserMessage, fallbackConversationHistory);
      const fallbackQuestions = ['What job opportunities are available in the 209 area?', 'Tell me about working in the Central Valley', 'What career advice do you have?'];

      return NextResponse.json({
        response: fallbackResponse,
        jobs: [],
        followUpQuestions: fallbackQuestions,
        filters: {},
        metadata: {
          totalResults: 0,
          hasUserProfile: false,
          hasEnhancedProfile: false,
          sessionId: null,
          timestamp: new Date().toISOString(),
          sortBy: 'relevance',
          hasValidApiKey: !!process.env.OPENAI_API_KEY,
          conversationLength: fallbackConversationHistory?.length || 0,
          authenticatedUserId: null,
          userSkills: 0,
          userApplicationHistory: 0,
          fallbackUsed: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        },
      });
    }
  },
  aiSecurityConfigs.public // Use AI-specific security configuration
);

// Generate basic response when OpenAI is not available
function generateBasicResponse(
  userMessage: string,
  filters: any,
  jobs: any[],
  conversationHistory: any[]
): string {
  const isFollowUp = conversationHistory.length > 0;
  const isSortingRequest = filters.sortBy && filters.sortBy !== 'relevance';
  const message = userMessage.toLowerCase();
  const isCitySearch =
    message.includes('all jobs in') ||
    (message.includes('jobs') && filters.location);

  // Handle general conversation when not a job search
  if (!isJobSearchQuery(userMessage)) {
    return generateBasicConversationalResponse(userMessage, conversationHistory);
  }

  if (isSortingRequest && filters.previousJobs) {
    const sortType =
      filters.sortBy === 'salary_desc'
        ? 'highest to lowest paid'
        : filters.sortBy === 'salary_asc'
          ? 'lowest to highest paid'
          : filters.sortBy === 'date_desc'
            ? 'newest first'
            : 'oldest first';

    return `I've re-sorted the previous ${filters.previousJobs.length} jobs by ${sortType}. ${jobs.length > 0 ? `Here are the results ranked as requested.` : 'No jobs found with the specified criteria.'}`;
  }

  if (jobs.length === 0) {
    return generateNoJobsFoundResponse(userMessage, filters, conversationHistory);
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
function generateContextualFollowUpQuestions(
  userMessage: string,
  filters: any,
  jobs: any[],
  conversationHistory: any[]
): string[] {
  const questions: string[] = [];
  const message = userMessage.toLowerCase();
  const isFirstSearch = conversationHistory.length === 0;

  // Check if this is a city-based search (like "all jobs in Stockton")
  const isCitySearch =
    message.includes('all jobs in') ||
    (message.includes('jobs') && filters.location);

  if (isCitySearch && isFirstSearch && jobs.length > 0) {
    // Engaging follow-up questions for city-based searches
    const city = filters.location || 'the area';
    questions.push(`What type of work are you looking for in ${city}?`);
    questions.push(`Show me healthcare jobs in ${city}`);
    questions.push(`Find warehouse and logistics jobs in ${city}`);
    questions.push(`What customer service jobs are available in ${city}?`);
  } else if (jobs.length > 1) {
    if (
      !message.includes('highest') &&
      !message.includes('lowest') &&
      !message.includes('salary')
    ) {
      questions.push('Rank these by highest paid to lowest paid');
    }
    if (!message.includes('newest') && !message.includes('recent')) {
      questions.push('Show me the newest jobs first');
    }
    if (!filters.location) {
      questions.push('Filter these to Stockton only');
    }
  }

  if (jobs.length === 0) {
    // More conversational follow-ups when no jobs found
    if (isJobSearchQuery(userMessage)) {
      if (filters.location) {
        const city = filters.location;
        questions.push(`What industries are strong in ${city}?`);
        questions.push(`Tell me about the job market in ${city}`);
        questions.push(`What career advice do you have for the 209 area?`);
      } else {
        questions.push('What are the best industries to work in the 209 area?');
        questions.push('Give me job search tips for Central Valley');
        questions.push('Tell me about Stockton job opportunities');
      }
    } else {
      // General conversation follow-ups
      questions.push('What job opportunities are available in the 209 area?');
      questions.push('Tell me about working in the Central Valley');
      questions.push('What career advice do you have?');
    }
  } else if (jobs.length < 5 && !isCitySearch) {
    questions.push('Show me similar jobs in nearby cities');
    questions.push('Include part-time positions too');
  }

  return questions.slice(0, 3);
}

// Check if the user message is a job search query
function isJobSearchQuery(message: string): boolean {
  const jobSearchKeywords = [
    'job', 'jobs', 'work', 'position', 'career', 'employment', 'hiring',
    'warehouse', 'nurse', 'customer service', 'retail', 'healthcare',
    'logistics', 'driver', 'cashier', 'manager', 'supervisor', 'clerk',
    'find', 'search', 'looking for', 'show me', 'available'
  ];

  const lowerMessage = message.toLowerCase();
  return jobSearchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Generate general conversational response using OpenAI
async function generateGeneralConversationalResponse(
  userMessage: string,
  conversationHistory: any[],
  userProfile: any
): Promise<string> {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

  // Build conversation context
  const messages = [
    {
      role: 'system',
      content: `You are an experienced work buddy and career advisor for the 209 Works job platform. You help people in the Central Valley (209 area code) with job searches, career advice, and local employment insights.

Key facts about the 209 area:
- Covers Central Valley cities like Stockton, Modesto, Tracy, Manteca, Lodi, Turlock, Merced
- Strong in agriculture, logistics, healthcare, manufacturing, and retail
- Growing tech and service sectors
- Family-friendly communities with affordable living
- Major transportation hub with access to Bay Area and Sacramento

Your personality:
- Friendly, knowledgeable, and supportive like an experienced work buddy
- Give practical, actionable advice from someone who knows the local scene
- Focus on local opportunities and insights
- Encourage and motivate job seekers
- Share relevant tips about the local job market
- Talk like someone who's worked in the 209 area and knows what it's like

Always be helpful and conversational. Don't introduce yourself by name - just be naturally helpful. If someone asks about jobs but there aren't any in the database yet, explain that 209 Works is building its local job database and encourage them to check back soon. Offer career advice, interview tips, or information about the local job market instead.`
    }
  ];

  // Add conversation history
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  // Add current message
  messages.push({
    role: 'user',
    content: userMessage
  });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content ||
      "I'm here to help with your job search and career questions in the 209 area! What would you like to know?";
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to basic response
    return generateBasicConversationalResponse(userMessage, conversationHistory);
  }
}

// Generate basic conversational response without OpenAI
function generateBasicConversationalResponse(
  userMessage: string,
  conversationHistory: any[]
): string {
  const message = userMessage.toLowerCase();

  // Greeting responses
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hey there! I'm here to help you find work in the 209 area - Stockton, Modesto, Tracy, and all around the Central Valley. Been helping folks find good jobs around here for a while. What kind of work are you looking for?";
  }

  // About 209 area
  if (message.includes('209') || message.includes('central valley') || message.includes('area')) {
    return "The 209 area covers the heart of California's Central Valley - cities like Stockton, Modesto, Tracy, Manteca, and Lodi. It's a great place to work with strong industries in agriculture, logistics, healthcare, and manufacturing. The cost of living is more affordable than the Bay Area, and you're still close to major cities. What type of work interests you here?";
  }

  // Career advice
  if (message.includes('advice') || message.includes('tips') || message.includes('help')) {
    return "I'd love to help! Here are some key tips for job searching in the 209 area: 1) Focus on local companies - many prefer hiring locally, 2) Highlight any logistics or agriculture experience, 3) Consider healthcare roles - they're always in demand, 4) Network within your city - the Central Valley has tight-knit communities. What specific area would you like advice on?";
  }

  // Industries
  if (message.includes('industry') || message.includes('industries') || message.includes('sectors')) {
    return "The 209 area has several strong industries: Agriculture (farming, food processing), Logistics & Transportation (warehouses, distribution, trucking), Healthcare (hospitals, clinics, senior care), Manufacturing, Retail, and growing Tech/Service sectors. Which industry interests you most?";
  }

  // General response
  return "I'm here to help with your job search and career questions in the 209 area! I can provide advice about local industries, job search tips, or help you explore opportunities in Stockton, Modesto, Tracy, and other Central Valley cities. What would you like to know?";
}

// Generate response when no jobs are found
function generateNoJobsFoundResponse(
  userMessage: string,
  filters: any,
  conversationHistory: any[]
): string {
  const location = filters.location;

  if (location) {
    return `I searched for jobs in ${location} but didn't find any matching "${userMessage}" right now. Don't worry though! 209 Works is actively building our local job database.

In the meantime, here's what I recommend:
• Check back in a few days - we're adding new opportunities regularly
• Consider broadening your search to nearby cities like Stockton, Modesto, or Tracy
• Look into major local employers in healthcare, logistics, and agriculture
• Network with local businesses - many 209 area jobs come through word of mouth

What other types of work would you be interested in exploring?`;
  }

  return `I searched for "${userMessage}" but didn't find any matching jobs in our database yet. The good news is that 209 Works is just getting started and we're actively building our local job listings!

Here's what I suggest:
• Try searching for broader terms like "warehouse," "customer service," or "healthcare"
• Check back soon - we're adding new 209 area opportunities daily
• Consider exploring different cities: Stockton, Modesto, Tracy, Manteca, Lodi
• The Central Valley has strong job markets in logistics, agriculture, and healthcare

What type of work environment interests you most? I can share insights about the local job market!`;
}
