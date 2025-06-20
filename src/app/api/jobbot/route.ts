import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/database/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  enhancedIdSchema,
  messageSchema,
  enhancedArraySchema,
  validateInput,
} from '@/lib/validations/input-validation';

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

// Simple cache for job context (in production, use Redis)
const jobContextCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Input validation constants
const VALIDATION_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000, // Maximum characters per message
  MAX_MESSAGES_COUNT: 50, // Maximum number of messages in conversation
  MAX_TOTAL_CONVERSATION_LENGTH: 20000, // Maximum total characters in conversation
  MIN_MESSAGE_LENGTH: 1, // Minimum characters per message
  MAX_JOB_ID_LENGTH: 100, // Maximum job ID length
} as const;

// Enhanced validation schema for JobBot requests
const jobBotRequestSchema = z.object({
  jobId: enhancedIdSchema,
  messages: enhancedArraySchema(messageSchema, 50).min(
    1,
    'At least one message is required'
  ),
});

type JobBotRequest = z.infer<typeof jobBotRequestSchema>;

interface JobContextData {
  job: any;
  company: any;
  companyKnowledge: any[];
}

// Enhanced rate limiting helper with headers
function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime,
      limit: RATE_LIMIT_MAX_REQUESTS,
    };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userLimit.resetTime,
      limit: RATE_LIMIT_MAX_REQUESTS,
    };
  }

  userLimit.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count,
    resetTime: userLimit.resetTime,
    limit: RATE_LIMIT_MAX_REQUESTS,
  };
}

// Input sanitization and validation functions
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Remove null bytes and control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function validateJobId(jobId: unknown): string {
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('Missing or invalid jobId parameter');
  }

  const sanitized = sanitizeString(jobId);

  if (sanitized.length === 0) {
    throw new Error('JobId cannot be empty');
  }

  if (sanitized.length > VALIDATION_LIMITS.MAX_JOB_ID_LENGTH) {
    throw new Error(
      `JobId too long (max ${VALIDATION_LIMITS.MAX_JOB_ID_LENGTH} characters)`
    );
  }

  // Basic format validation - should be alphanumeric with possible hyphens/underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new Error('JobId contains invalid characters');
  }

  return sanitized;
}

function validateMessages(
  messages: unknown
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  if (!messages || !Array.isArray(messages)) {
    throw new Error('Missing or invalid messages array');
  }

  if (messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  if (messages.length > VALIDATION_LIMITS.MAX_MESSAGES_COUNT) {
    throw new Error(
      `Too many messages (max ${VALIDATION_LIMITS.MAX_MESSAGES_COUNT})`
    );
  }

  let totalLength = 0;
  const validatedMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (!message || typeof message !== 'object') {
      throw new Error(`Message at index ${i} is invalid`);
    }

    const { role, content } = message;

    // Validate role
    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      throw new Error(
        `Invalid role at message ${i}. Must be 'user', 'assistant', or 'system'`
      );
    }

    // Validate and sanitize content
    if (!content || typeof content !== 'string') {
      throw new Error(`Missing or invalid content at message ${i}`);
    }

    const sanitizedContent = sanitizeString(content);

    if (sanitizedContent.length < VALIDATION_LIMITS.MIN_MESSAGE_LENGTH) {
      throw new Error(
        `Message ${i} is too short (min ${VALIDATION_LIMITS.MIN_MESSAGE_LENGTH} character)`
      );
    }

    if (sanitizedContent.length > VALIDATION_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message ${i} is too long (max ${VALIDATION_LIMITS.MAX_MESSAGE_LENGTH} characters)`
      );
    }

    totalLength += sanitizedContent.length;

    validatedMessages.push({
      role: role as 'user' | 'assistant' | 'system',
      content: sanitizedContent,
    });
  }

  if (totalLength > VALIDATION_LIMITS.MAX_TOTAL_CONVERSATION_LENGTH) {
    throw new Error(
      `Total conversation too long (max ${VALIDATION_LIMITS.MAX_TOTAL_CONVERSATION_LENGTH} characters)`
    );
  }

  return validatedMessages;
}

// Rate limit headers helper
function addRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: { remaining: number; resetTime: number; limit: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
  response.headers.set(
    'X-RateLimit-Remaining',
    rateLimitInfo.remaining.toString()
  );
  response.headers.set(
    'X-RateLimit-Reset',
    Math.ceil(rateLimitInfo.resetTime / 1000).toString()
  );
  response.headers.set(
    'X-RateLimit-Window',
    (RATE_LIMIT_WINDOW / 1000).toString()
  );
  return response;
}

// Cache helpers
function getCachedJobContext(jobId: string): JobContextData | null {
  const cached = jobContextCache.get(jobId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedJobContext(jobId: string, data: JobContextData): void {
  jobContextCache.set(jobId, { data, timestamp: Date.now() });
}

// Load comprehensive job context
async function loadJobContext(jobId: string): Promise<JobContextData | null> {
  // Check cache first
  const cached = getCachedJobContext(jobId);
  if (cached) {
    return cached;
  }

  try {
    // Load job with company relationship
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        companyRef: {
          include: {
            knowledgeBase: {
              where: { verified: true },
              orderBy: { priority: 'desc' },
            },
          },
        },
      },
    });

    if (!job) {
      return null;
    }

    // If no company relation, try to find company by name
    let company = job.companyRef;
    let companyKnowledge: any[] = [];

    if (!company && job.company) {
      company = await prisma.company.findFirst({
        where: {
          name: { contains: job.company, mode: 'insensitive' },
        },
        include: {
          knowledgeBase: {
            where: { verified: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (company) {
        companyKnowledge = company.knowledgeBase;
      }
    } else if (company) {
      companyKnowledge = company.knowledgeBase;
    }

    const contextData: JobContextData = {
      job,
      company,
      companyKnowledge,
    };

    // Cache the result
    setCachedJobContext(jobId, contextData);

    return contextData;
  } catch (error) {
    console.error('Error loading job context:', error);
    return null;
  }
}

// Build comprehensive system prompt
function buildSystemPrompt(context: JobContextData): string {
  const { job, company, companyKnowledge } = context;

  let prompt = `You are JobGenie 🧞‍♂️, a friendly and knowledgeable AI assistant that helps job seekers understand specific job opportunities. You have access to detailed information about this job posting and company.

**Current Job Posting:**
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Type: ${job.type}
- Posted: ${new Date(job.postedAt).toLocaleDateString()}
- Categories: ${job.categories?.join(', ') || 'Not specified'}

**Job Description:**
${job.description}

**Salary Information:**
${
  job.salaryMin && job.salaryMax
    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
    : job.salaryMin
      ? `Starting at $${job.salaryMin.toLocaleString()}`
      : job.salaryMax
        ? `Up to $${job.salaryMax.toLocaleString()}`
        : 'Salary not disclosed'
}`;

  // Add company information if available
  if (company) {
    prompt += `\n\n**Company Information:**
- Name: ${company.name}
- Industry: ${company.industry || 'Not specified'}
- Size: ${company.size || 'Not specified'}
- Founded: ${company.founded || 'Not specified'}
- Headquarters: ${company.headquarters || 'Not specified'}
- Website: ${company.website || 'Not specified'}

**Company Description:**
${company.description || 'No company description available.'}`;
  }

  // Add company knowledge base information with null checks
  if (Array.isArray(companyKnowledge) && companyKnowledge.length > 0) {
    prompt += '\n\n**Additional Company Information:**\n';

    // Group knowledge by category with validation
    const knowledgeByCategory = companyKnowledge
      .filter(
        knowledge =>
          knowledge &&
          typeof knowledge === 'object' &&
          knowledge.category &&
          typeof knowledge.category === 'string'
      )
      .reduce(
        (acc, knowledge) => {
          const category = knowledge.category.trim();
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(knowledge);
          return acc;
        },
        {} as Record<string, any[]>
      );

    for (const [category, items] of Object.entries(knowledgeByCategory)) {
      if (Array.isArray(items) && items.length > 0) {
        const categoryTitle = category
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        prompt += `\n**${categoryTitle}:**\n`;

        items.forEach(item => {
          if (
            item &&
            item.title &&
            item.content &&
            typeof item.title === 'string' &&
            typeof item.content === 'string'
          ) {
            prompt += `- ${item.title.trim()}: ${item.content.trim()}\n`;
          }
        });
      }
    }
  }

  prompt += `\n\n**Your Role & Guidelines:**
1. Answer questions specifically about this job posting and company
2. Be helpful, friendly, and enthusiastic while remaining professional
3. If asked about information not provided in the context, clearly state what information is not available
4. Help users understand job requirements, company culture, benefits, and application process
5. Encourage qualified candidates while being honest about requirements
6. If asked about salary and it's not disclosed, suggest they inquire during the application process
7. Don't make up information - only use what's provided in the context above
8. If asked about other jobs or companies, politely redirect to this specific opportunity
9. Keep responses concise but informative (aim for 2-3 paragraphs maximum unless more detail is requested)

Remember: You're here to help job seekers make informed decisions about this specific opportunity!`;

  return prompt;
}

export async function POST(req: NextRequest) {
  // Get client IP for rate limiting (outside try block for error handling)
  const clientIP =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  try {
    // Check rate limits
    const rateLimitInfo = checkRateLimit(clientIP);
    if (!rateLimitInfo.allowed) {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error:
              'Rate limit exceeded. Please wait before sending more messages.',
          },
          { status: 429 }
        ),
        rateLimitInfo
      );
    }

    // Parse and validate request body
    let requestData: JobBotRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
        rateLimitInfo
      );
    }

    const { jobId, messages } = requestData;

    // Validate required fields with enhanced validation
    let validatedJobId: string;
    let validatedMessages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>;

    try {
      validatedJobId = validateJobId(jobId);
      validatedMessages = validateMessages(messages);
    } catch (validationError) {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error:
              validationError instanceof Error
                ? validationError.message
                : 'Validation failed',
            type: 'validation_error',
          },
          { status: 400 }
        ),
        rateLimitInfo
      );
    }

    // Load job context
    const jobContext = await loadJobContext(validatedJobId);
    if (!jobContext) {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Job not found or no longer available' },
          { status: 404 }
        ),
        rateLimitInfo
      );
    }

    // Build system prompt with comprehensive context
    const systemPrompt = buildSystemPrompt(jobContext);

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...validatedMessages.filter(msg => msg.role !== 'system'), // Remove any existing system messages
    ];

    // Call OpenAI API with enhanced parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Use the latest model
      messages: openaiMessages,
      max_tokens: 500, // Increased for more detailed responses
      temperature: 0.7, // Slightly creative but consistent
      presence_penalty: 0.1, // Slight penalty to avoid repetition
      frequency_penalty: 0.1, // Slight penalty for repetitive phrases
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Failed to generate response from JobGenie' },
          { status: 500 }
        ),
        rateLimitInfo
      );
    }

    // Return successful response with metadata
    return addRateLimitHeaders(
      NextResponse.json({
        reply,
        jobTitle: jobContext.job.title,
        company: jobContext.job.company,
        contextLoaded: {
          hasCompanyInfo: !!jobContext.company,
          hasKnowledgeBase: jobContext.companyKnowledge.length > 0,
          knowledgeCategories: [
            ...new Set(jobContext.companyKnowledge.map(k => k.category)),
          ],
        },
      }),
      rateLimitInfo
    );
  } catch (error) {
    console.error('JobGenie API Error:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return addRateLimitHeaders(
          NextResponse.json(
            {
              error:
                'AI service temporarily unavailable. Please try again in a moment.',
            },
            { status: 429 }
          ),
          checkRateLimit(clientIP)
        );
      }

      if (error.message.includes('content policy')) {
        return addRateLimitHeaders(
          NextResponse.json(
            {
              error:
                'Message violates content policy. Please keep questions professional and job-related.',
            },
            { status: 400 }
          ),
          checkRateLimit(clientIP)
        );
      }
    }

    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: 'JobGenie is temporarily unavailable. Please try again later.',
        },
        { status: 500 }
      ),
      checkRateLimit(clientIP)
    );
  }
}
