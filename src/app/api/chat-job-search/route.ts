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
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../auth/authOptions';
import { generateJobSearchResponse } from '@/lib/ai';
import Anthropic from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';

// Type definitions for conversation messages
interface ConversationMessage {
  role?: string;
  type?: string;
  content: string;
  timestamp?: Date;
}

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

  // Extract remote preference and local preference
  const isRemote = message.includes('remote') || message.includes('work from home');
  const isLocalPreferred = message.includes('local') || message.includes('nearby') || 
    message.includes('in-person') || message.includes('on-site') || 
    message.includes('commute') || message.includes('drive to work');

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
    isLocalPreferred,
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

// Build job query with enhanced sorting and local prioritization
function buildJobQueryFromFilters(filters: any) {
  const query: any = {
    status: 'active',
    AND: [], // Use AND array instead of mixing OR directly
  };

  // Add basic filters to ensure we only get active, non-expired jobs
  query.AND.push({
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  });

  // HYPERLOCAL FILTERING: Prioritize local/hybrid over remote
  const userRequestsRemote = filters.isRemote === true || 
    (filters.other && filters.other.toLowerCase().includes('remote'));
  const userPreferencesLocal = filters.isLocalPreferred === true;
  
  if (!userRequestsRemote) {
    if (userPreferencesLocal) {
      // User explicitly wants local jobs - exclude all remote
      query.AND.push({ isRemote: false });
    } else {
      // Default hyperlocal filtering - exclude purely remote, allow hybrid with local presence
      query.AND.push({
        OR: [
          { isRemote: false }, // Local jobs
          { 
            AND: [
              { isRemote: true }, // Hybrid/remote jobs that also have local presence
              {
                OR: [
                  { areaCodes: { hasSome: ['209', '916', '510'] } }, // Central Valley area codes
                  { city: { in: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi', 'Turlock', 'Merced', 'Sacramento', 'Oakland', 'San Jose'] } },
                  { location: { contains: 'Central Valley', mode: 'insensitive' } },
                  { location: { contains: '209', mode: 'insensitive' } },
                  { targetCities: { hasSome: ['Stockton', 'Modesto', 'Tracy', 'Manteca'] } }
                ]
              }
            ]
          }
        ]
      });
    }
  }

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

// Get sort order for Prisma with local prioritization
function getSortOrder(sortBy: string, userRequestsRemote: boolean = false) {
  const localPrioritySort = [
    { isRemote: 'asc' as const }, // Local jobs first (false < true)
  ];

  switch (sortBy) {
    case 'salary_desc':
      // Sort by local priority, then max salary, then min salary
      return userRequestsRemote ? [
        { salaryMax: 'desc' as const },
        { salaryMin: 'desc' as const },
        { postedAt: 'desc' as const },
      ] : [
        ...localPrioritySort,
        { salaryMax: 'desc' as const },
        { salaryMin: 'desc' as const },
        { postedAt: 'desc' as const },
      ];
    case 'salary_asc':
      // Sort by local priority, then min salary, then max salary
      return userRequestsRemote ? [
        { salaryMin: 'asc' as const },
        { salaryMax: 'asc' as const },
        { postedAt: 'desc' as const },
      ] : [
        ...localPrioritySort,
        { salaryMin: 'asc' as const },
        { salaryMax: 'asc' as const },
        { postedAt: 'desc' as const },
      ];
    case 'date_desc':
      return userRequestsRemote ? [
        { postedAt: 'desc' as const }
      ] : [
        ...localPrioritySort,
        { postedAt: 'desc' as const }
      ];
    case 'date_asc':
      return userRequestsRemote ? [
        { postedAt: 'asc' as const }
      ] : [
        ...localPrioritySort,
        { postedAt: 'asc' as const }
      ];
    default:
      // Default relevance sort: local first, then most recent
      return userRequestsRemote ? [
        { postedAt: 'desc' as const }
      ] : [
        ...localPrioritySort,
        { postedAt: 'desc' as const }
      ];
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
        isOnboarding = false,
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

      // Handle onboarding mode - focus on gathering information, not searching
      if (isOnboarding) {
        try {
          // Generate a conversational onboarding response without job search
          const onboardingPrompt = `You are a friendly career advisor helping someone during onboarding. 
          The user said: "${userMessage}"
          
          Previous conversation:
          ${conversationHistory.map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`).join('\n')}
          
          Your goal is to:
          1. Acknowledge what they said
          2. Ask ONE specific follow-up question to learn more about their job preferences
          3. Keep it conversational and friendly
          4. Focus on gathering info about: work environment preferences, schedule flexibility, career goals, or specific industries
          5. Do NOT search for jobs or mention specific job listings
          6. Keep your response under 100 words
          
          Respond naturally as if having a conversation.`;

          let response;
          if (hasValidOpenAIKey) {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'You are a friendly career advisor helping during job seeker onboarding.' },
                { role: 'user', content: onboardingPrompt }
              ],
              max_tokens: 150,
              temperature: 0.7,
            });
            response = completion.choices[0].message.content || 'Tell me more about what kind of work environment you prefer.';
          } else {
            // Fallback responses for onboarding without AI
            const fallbacks = [
              "That's helpful to know! What kind of schedule works best for you - traditional hours, flexible, or shift work?",
              "I understand. Do you prefer working independently or as part of a team?",
              "Good to know! What's most important to you in your next job - growth opportunities, work-life balance, or something else?",
              "Thanks for sharing! Are there any specific companies or industries you're particularly interested in?",
            ];
            response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
          }

          return NextResponse.json({
            response,
            jobs: [], // No jobs during onboarding
            followUpQuestions: [],
            filters: {},
            metadata: {
              totalResults: 0,
              isOnboarding: true,
              conversationLength: conversationHistory.length,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error('Onboarding response error:', error);
          // Fallback response
          return NextResponse.json({
            response: "Thanks for sharing that! What else is important to you in your next job?",
            jobs: [],
            followUpQuestions: [],
            filters: {},
            metadata: {
              totalResults: 0,
              isOnboarding: true,
              error: true,
            },
          });
        }
      }

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

      // Build and execute job query with local prioritization
      const jobQuery = buildJobQueryFromFilters(filters);
      const userRequestsRemote = filters.isRemote === true || 
        (filters.other && filters.other.toLowerCase().includes('remote'));
      const sortOrder = getSortOrder(filters.sortBy || 'relevance', userRequestsRemote);

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
          // Use the new AI utility with OpenAI + Anthropic fallback
          conversationalResponse = await generateJobSearchResponse(
            userMessage,
            conversationHistory,
            jobs,
            filters
          );
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

          // Build updated conversation history - ensure proper format
          const updatedConversationHistory = [
            ...conversationHistory.map((msg: ConversationMessage) => ({
              role: msg.role || msg.type || 'user',
              content: msg.content,
              timestamp: msg.timestamp || new Date()
            })),
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

// Generate basic response when OpenAI is not available - More conversational
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
        ? 'highest paid first'
        : filters.sortBy === 'salary_asc'
          ? 'lowest paid first'
          : filters.sortBy === 'date_desc'
            ? 'newest first'
            : 'oldest first';

    return `Got it! Sorted by ${sortType} 👍`;
  }

  if (jobs.length === 0) {
    return generateNoJobsFoundResponse(userMessage, filters, conversationHistory);
  }

  let response = '';
  const localJobCount = jobs.filter(job => !job.isRemote).length;
  const hybridJobCount = jobs.filter(job => job.isRemote).length;

  if (isCitySearch && !isFollowUp && filters.location) {
    // More casual city search response with local emphasis
    if (jobs.length > 10) {
      response = `Nice! Found ${jobs.length} local jobs in ${filters.location} 🎯 Lots of options!`;
    } else if (jobs.length > 5) {
      response = `Found ${jobs.length} local jobs in ${filters.location}! Some good options here.`;
    } else {
      response = `Found ${jobs.length} local jobs in ${filters.location}. Here's what's available!`;
    }
  } else {
    // Shorter, friendlier responses with local context
    if (filters.isLocalPreferred) {
      response = `Found ${jobs.length} local jobs for you! 🏢`;
    } else if (jobs.length > 10) {
      response = localJobCount > 0 ? 
        `Found ${jobs.length} jobs! 🔥 ${localJobCount} are right here locally.` :
        `Found ${jobs.length} jobs! 🔥`;
    } else if (jobs.length > 5) {
      response = localJobCount > 0 ? 
        `Found ${jobs.length} jobs (${localJobCount} local, ${hybridJobCount} hybrid/remote).` :
        `Found ${jobs.length} jobs matching that.`;
    } else {
      response = localJobCount > 0 ? 
        `Found ${jobs.length} jobs - ${localJobCount} local, ${hybridJobCount} with remote options.` :
        `Found ${jobs.length} jobs for you!`;
    }

    if (filters.location && !filters.isLocalPreferred) {
      response += ` All in ${filters.location} area.`;
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

// Generate general conversational response using the new AI utility
async function generateGeneralConversationalResponse(
  userMessage: string,
  conversationHistory: any[],
  userProfile: any
): Promise<string> {
  try {
    return await generateJobSearchResponse(
      userMessage,
      conversationHistory,
      [], // No job results for general conversation
      {} // No filters for general conversation
    );
  } catch (error) {
    console.error('AI response generation failed:', error);
    return generateBasicConversationalResponse(userMessage, conversationHistory);
  }
}

// Generate basic conversational response without OpenAI - More text-message style
function generateBasicConversationalResponse(
  userMessage: string,
  conversationHistory: any[]
): string {
  const message = userMessage.toLowerCase();

  // Greeting responses - shorter and friendlier
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hey! 👋 I'm here to help you find work in the 209. What kind of job are you looking for?";
  }

  // About 209 area - more casual
  if (message.includes('209') || message.includes('central valley') || message.includes('area')) {
    return "The 209 is awesome for work! Stockton, Modesto, Tracy - lots of opportunities in warehouses, healthcare, and local businesses. Way more affordable than the Bay Area too. What type of work interests you?";
  }

  // Career advice - friendly and brief
  if (message.includes('advice') || message.includes('tips') || message.includes('help')) {
    return "Sure thing! Quick tips: 1) Local companies love hiring locally 2) Healthcare is always hiring 3) Warehouses pay well here 4) Network in your city - people know people. What specific help do you need?";
  }

  // Industries - conversational
  if (message.includes('industry') || message.includes('industries') || message.includes('sectors')) {
    return "Big industries here: warehouses/logistics, healthcare, agriculture, manufacturing, retail. Growing tech scene too. Which one sounds interesting?";
  }

  // Broken/error response
  if (message.includes('broken') || message.includes('error') || message.includes('not working')) {
    return "Oh no! 😅 Looks like something's not working right. I'm still here to help though! What job stuff can I help you with?";
  }

  // General response - much shorter
  return "I'm here to help with jobs in the 209! What would you like to know?";
}

// Generate response when no jobs are found - Much shorter and friendlier with local suggestions
function generateNoJobsFoundResponse(
  userMessage: string,
  filters: any,
  conversationHistory: any[]
): string {
  const location = filters.location;
  const isLocalRequest = filters.isLocalPreferred;
  const isRemoteRequest = filters.isRemote;

  if (isRemoteRequest) {
    return `No remote matches for "${userMessage}" right now 🤔 But there are lots of local opportunities in the 209 area! Want me to show you local jobs instead? Most pay just as well and you save on gas! 💰`;
  }

  if (location) {
    return `Hmm, no local matches for "${userMessage}" in ${location} right now 🤔 Try "warehouse jobs" or "healthcare" - those are huge locally! Or I can check nearby cities like Stockton, Modesto, or Tracy?`;
  }

  if (isLocalRequest) {
    return `No local matches for "${userMessage}" yet 😅 Try "warehouse jobs", "healthcare", or "customer service" - those are big in the 209 area! What type of local work interests you most?`;
  }

  return `No matches for "${userMessage}" yet 😅 We focus on local Central Valley jobs. Try "warehouse jobs" or "customer service" - those are popular locally! What type of work are you most interested in?`;
}
