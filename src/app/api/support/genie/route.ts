import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute for support

// Validation schema for support genie request
const supportGenieSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    page: z.string().optional(),
    userAgent: z.string().optional(),
    errorDetails: z.string().optional(),
  }).optional(),
});

// Rate limiting helper
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

// Build system prompt for support Genie
function buildSupportSystemPrompt(): string {
  return `You are Support Genie 🧞‍♂️, a friendly and knowledgeable AI assistant that helps employers with technical support questions on the 209 Works platform, specifically for the bulk upload feature.

**Your Role & Expertise:**
You are a technical support specialist for the 209 Works bulk upload system. You help employers troubleshoot issues, understand features, and optimize their job posting workflow.

**Common Bulk Upload Issues & Solutions:**

**File Format Issues:**
- Supported formats: CSV, Excel (.xlsx), JSON
- Required columns: title, location, description (minimum)
- Optional columns: company, salary, jobType, requirements, benefits
- File size limit: 10MB maximum
- Encoding: UTF-8 recommended for CSV files

**Processing Errors:**
- "Job title is required" → Ensure title column has values for all rows
- "Location is required" → Check location column is populated
- "Description too short" → Job descriptions should be at least 50 characters
- "Invalid file type" → Use only CSV, XLSX, or JSON formats
- "File too large" → Split large files into smaller batches (under 100 jobs recommended)

**Credit System:**
- Each job post requires 1 credit minimum
- Enhanced optimization: +0.5 credits per job
- Premium optimization: +1 credit per job
- Social graphics: +1 credit per job
- Featured listings: +2 credits per job
- Credit purchases require active subscription

**Optimization Features:**
- Auto-enhance: Improves job descriptions using AI
- SEO keywords: Adds relevant search terms
- Target audience: Customizes content for specific job markets
- Quality levels: Standard (free), Enhanced (+0.5), Premium (+1)

**Troubleshooting Steps:**
1. Check file format and size
2. Verify required columns are present and populated
3. Ensure sufficient credits are available
4. Try smaller batch sizes if processing fails
5. Check internet connection for upload issues

**When to Escalate:**
- Payment/billing issues → Direct to human support
- Account access problems → Human support required
- Complex technical errors → Escalate with error details
- Feature requests → Forward to product team

**Your Communication Style:**
- Be friendly, helpful, and professional
- Provide specific, actionable solutions
- Ask clarifying questions when needed
- Offer step-by-step guidance
- Acknowledge when human support is needed
- Keep responses concise but thorough

**Contact Information for Escalation:**
- Email: support@209.works
- Response time: 24 hours
- Business hours: Mon-Fri 9AM-6PM PST

Remember: Your goal is to solve problems quickly and help employers succeed with their job posting goals!`;
}

// POST /api/support/genie - AI-powered support assistance
export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limits
    const rateLimitInfo = checkRateLimit(clientIP);
    if (!rateLimitInfo.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before asking more questions.' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = supportGenieSchema.parse(body);
    
    const { message, context } = validatedData;

    // Build context information
    let contextInfo = '';
    if (context) {
      contextInfo = `
**User Context:**
- Page: ${context.page || 'bulk-upload'}
- User: ${user?.email}
- Error Details: ${context.errorDetails || 'None provided'}
`;
    }

    // Prepare messages for OpenAI
    const systemPrompt = buildSupportSystemPrompt();
    const userMessage = `${contextInfo}\n**User Question:** ${message}`;

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      max_tokens: 600,
      temperature: 0.3, // Lower temperature for more consistent support responses
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: 'Failed to generate support response' },
        { status: 500 }
      );
    }

    // Log support interaction for analytics
    console.log('Support Genie interaction:', {
      userEmail: user?.email,
      page: context?.page || 'bulk-upload',
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reply,
      escalationSuggested: reply.toLowerCase().includes('human support') || 
                          reply.toLowerCase().includes('escalate'),
      supportContact: {
        email: 'support@209.works',
        responseTime: '24 hours',
      },
    });

  } catch (error) {
    console.error('Support Genie error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Support assistant temporarily unavailable. Please contact support@209.works directly.' },
      { status: 500 }
    );
  }
}
