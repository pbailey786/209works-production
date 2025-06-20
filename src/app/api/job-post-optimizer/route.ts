import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Validation schema for job post optimizer
const jobPostOptimizerSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(100),
  location: z.string().min(1, 'Location is required').max(100),
  pay: z.string().max(100).optional(),
  schedule: z.string().max(200).optional(),
  companyDescription: z.string().max(1000).optional(),
  idealFit: z.string().max(1000).optional(),
  culture: z.string().max(1000).optional(),
  growthPath: z.string().max(1000).optional(),
  perks: z.string().max(1000).optional(),
  applicationCTA: z.string().max(500).optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),

  // New job post enhancements
  degreeRequired: z.boolean().optional(),
  salaryRangeMin: z.number().optional(),
  salaryRangeMax: z.number().optional(),
  internalTags: z.array(z.string()).optional().default([]),
  supplementalQuestions: z.array(z.string().max(500)).max(10).optional().default([]),

  // Upsells
  socialMediaShoutout: z.boolean().optional().default(false),
  placementBump: z.boolean().optional().default(false),
  upsellBundle: z.boolean().optional().default(false),
  upsellTotal: z.union([z.string(), z.number()]).optional(),

  // Manual content options
  manualContent: z.string().optional(),
  skipAI: z.boolean().optional().default(false),
});

type JobPostOptimizerData = z.infer<typeof jobPostOptimizerSchema>;

// AI prompt for job post optimization
function createOptimizationPrompt(data: JobPostOptimizerData): string {
  return `You are a professional job posting expert. Transform the following basic job information into a compelling, modern job listing that attracts qualified candidates.

INPUT DATA:
- Job Title: ${data.jobTitle}
- Company: ${data.companyName}
- Location: ${data.location}
- Pay: ${data.pay || 'Not specified'}
- Schedule: ${data.schedule || 'Not specified'}
- Company Description: ${data.companyDescription || 'Not provided'}
- Ideal Candidate: ${data.idealFit || 'Not provided'}
- Work Culture: ${data.culture || 'Not provided'}
- Growth Opportunities: ${data.growthPath || 'Not provided'}
- Perks/Benefits: ${data.perks || 'Not provided'}
- Application Instructions: ${data.applicationCTA || 'Not provided'}

INSTRUCTIONS:
1. Create a friendly, engaging job listing that stands out
2. Use the exact structure provided below
3. Write in a conversational, approachable tone (no corporate buzzwords)
4. Make it scannable with clear sections and bullet points
5. Focus on what makes this opportunity attractive
6. If information is missing, create reasonable content based on the job title and company

OUTPUT FORMAT:
# ${data.jobTitle} — [Create an appealing tagline]

## 👋 About This Opportunity
[Write 2-3 friendly sentences introducing the role and company based on the provided info]

## 🧾 Job Details
- **📍 Location:** ${data.location}
- **💰 Pay:** ${data.pay || '[Competitive compensation]'}
- **📅 Schedule:** ${data.schedule || '[Standard business hours]'}
- **🎁 Perks:** [List the perks/benefits provided, or create reasonable ones]

## 🧠 Who Thrives Here
[Describe the ideal candidate based on the provided info, written in an encouraging way]

## 🚀 Growth & Development
[Describe growth opportunities, or create reasonable ones based on the role]

## 📝 Ready to Apply?
[Provide clear application instructions based on the CTA, or create professional ones]

---

Make this job posting compelling and authentic. Focus on attracting the right people while being honest about the role.`;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        {
          error:
            'Authentication required. Only employers can create job posts.',
        },
        { status: 401 }
      );
    }

    // Job Post Optimizer is now accessible to all employers without credit requirements
    const userId = (session!.user as any).id;

    // Parse and validate request body
    const body = await req.json();
    const validatedData = jobPostOptimizerSchema.parse(body);

    let aiGeneratedOutput = '';
    let optimizationPrompt = '';

    // Check if OpenAI API key is available (needed for both AI generation and response)
    const hasValidApiKey =
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'your-openai-key' &&
      process.env.OPENAI_API_KEY !==
        'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

    // If user chose to skip AI, use manual content or empty string
    if (validatedData.skipAI) {
      aiGeneratedOutput = validatedData.manualContent || '';
    } else {

      if (hasValidApiKey) {
        try {
          // Generate AI-optimized job listing
          optimizationPrompt = createOptimizationPrompt(validatedData);

          const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert job posting writer who creates compelling, modern job listings that attract qualified candidates. Write in a friendly, conversational tone and focus on what makes each opportunity unique and appealing.',
              },
              {
                role: 'user',
                content: optimizationPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          });

          aiGeneratedOutput = response.choices[0]?.message?.content || '';
        } catch (aiError) {
          console.error('AI optimization failed:', aiError);
          // Fallback to manual template if AI fails
          aiGeneratedOutput = createFallbackJobListing(validatedData);
        }
      } else {
        // Use fallback template when OpenAI is not available
        aiGeneratedOutput = createFallbackJobListing(validatedData);
      }
    }

    // Save to database
    const jobPostOptimizer = await prisma.jobPostOptimizer.create({
      data: {
        employerId: (session!.user as any).id,
        jobTitle: validatedData.jobTitle,
        companyName: validatedData.companyName,
        location: validatedData.location,
        pay: validatedData.pay,
        schedule: validatedData.schedule,
        companyDescription: validatedData.companyDescription,
        idealFit: validatedData.idealFit,
        culture: validatedData.culture,
        growthPath: validatedData.growthPath,
        perks: validatedData.perks,
        applicationCTA: validatedData.applicationCTA,
        mediaUrls: validatedData.mediaUrls,
        supplementalQuestions: validatedData.supplementalQuestions || [],
        rawInput: validatedData,
        aiGeneratedOutput,
        editedContent: validatedData.manualContent || null, // Store manual content as edited content
        optimizationPrompt: validatedData.skipAI ? null : (hasValidApiKey ? optimizationPrompt : null),
        status: validatedData.skipAI ? 'draft' : 'optimized',
        // Upsells
        socialMediaShoutout: validatedData.socialMediaShoutout || false,
        placementBump: validatedData.placementBump || false,
        upsellBundle: validatedData.upsellBundle || false,
        upsellTotal: validatedData.upsellTotal
          ? parseFloat(validatedData.upsellTotal.toString())
          : null,
      },
    });

    // Job Post Optimizer is now free to use - no credit deduction required

    return NextResponse.json({
      success: true,
      id: jobPostOptimizer.id,
      aiGeneratedOutput,
      hasAI: hasValidApiKey,
      message: 'Job post optimized successfully!',
    });
  } catch (error) {
    console.error('Job post optimizer error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to optimize job post. Please try again.' },
      { status: 500 }
    );
  }
}

// Fallback job listing template when AI is not available
function createFallbackJobListing(data: JobPostOptimizerData): string {
  const tagline = `Join Our Team!`;

  return `# ${data.jobTitle} — ${tagline}

## 👋 About This Opportunity
${data.companyDescription || `${data.companyName} is looking for a talented ${data.jobTitle} to join our team in ${data.location}.`} ${data.culture || 'We offer a supportive work environment where you can grow your career and make a real impact.'}

## 🧾 Job Details
- **📍 Location:** ${data.location}
- **💰 Pay:** ${data.pay || 'Competitive compensation'}
- **📅 Schedule:** ${data.schedule || 'Standard business hours'}
- **🎁 Perks:** ${data.perks || 'Great benefits package including health insurance and paid time off'}

## 🧠 Who Thrives Here
${data.idealFit || `We're looking for someone who is motivated, reliable, and excited about contributing to our team. The ideal candidate will bring positive energy and a willingness to learn.`}

## 🚀 Growth & Development
${data.growthPath || 'We believe in investing in our employees and providing opportunities for professional development and career advancement.'}

## 📝 Ready to Apply?
${data.applicationCTA || `Interested in this position? We'd love to hear from you! Please send your resume and a brief note about why you're interested in joining our team.`}

---

*This job posting was created using the 209Jobs Job Post Optimizer.*`;
}

// GET endpoint to retrieve job post optimizers for an employer
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: any = {
      employerId: (session!.user as any).id,
    };

    if (status) {
      where.status = status;
    }

    const [jobPosts, total] = await Promise.all([
      prisma.jobPostOptimizer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          publishedJob: {
            select: {
              id: true,
              title: true,
              status: true,
              viewCount: true,
            },
          },
        },
      }),
      prisma.jobPostOptimizer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get job post optimizers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job posts' },
      { status: 500 }
    );
  }
}
