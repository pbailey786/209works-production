import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Schema for bulk job optimization
const bulkOptimizeSchema = z.object({
  jobs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    description: z.string(),
    salary: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    jobType: z.string().optional(),
    experienceLevel: z.string().optional(),
    remote: z.boolean().optional(),
  })),
});

// AI prompt for bulk job optimization
function createBulkOptimizationPrompt(job: any): string {
  return `You are a professional job posting expert. Transform the following basic job information into a compelling, modern job listing that attracts qualified candidates.

**Job Information:**
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Type: ${job.jobType || 'Full-time'}
- Experience Level: ${job.experienceLevel || 'Entry'}
- Remote: ${job.remote ? 'Yes' : 'No'}
- Salary: ${job.salary || 'Competitive'}

**Original Description:**
${job.description}

${job.requirements ? `**Requirements:**\n${job.requirements}` : ''}

${job.benefits ? `**Benefits:**\n${job.benefits}` : ''}

**Instructions:**
1. Create an engaging, professional job posting that stands out
2. Use a friendly, conversational tone that appeals to 209 area candidates
3. Highlight what makes this opportunity unique and appealing
4. Include clear responsibilities, requirements, and benefits
5. Add a compelling call-to-action for applications
6. Keep it concise but comprehensive (aim for 300-500 words)
7. Use bullet points and clear formatting for readability
8. Emphasize local community connection and growth opportunities

**Format the response as clean, readable text with proper sections and formatting.**`;
}

// Fallback optimization for when AI is not available
function createFallbackOptimization(job: any): string {
  return `# ${job.title}

**${job.company}** - ${job.location}

## About This Opportunity

We are seeking a dedicated ${job.title} to join our team at ${job.company}. This is an excellent opportunity for someone looking to grow their career in the ${job.location} area.

## Job Description

${job.description}

## What We're Looking For

${job.requirements || 'We are looking for motivated individuals who are eager to contribute to our team and grow with our company.'}

## What We Offer

${job.benefits || 'Competitive compensation, professional development opportunities, and a supportive work environment.'}

## Job Details

- **Position:** ${job.title}
- **Company:** ${job.company}
- **Location:** ${job.location}
- **Type:** ${job.jobType || 'Full-time'}
- **Experience:** ${job.experienceLevel || 'Entry level'}
- **Remote Work:** ${job.remote ? 'Available' : 'On-site'}
- **Salary:** ${job.salary || 'Competitive'}

## How to Apply

Ready to join our team? We'd love to hear from you! Apply today and take the next step in your career with ${job.company}.

---

*${job.company} is an equal opportunity employer committed to diversity and inclusion.*`;
}

// POST /api/employers/bulk-upload/optimize - Optimize jobs with AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkOptimizeSchema.parse(body);

    // Check if OpenAI API key is available
    const hasValidApiKey =
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'your-openai-key' &&
      process.env.OPENAI_API_KEY !== 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key';

    const optimizedJobs = [];

    // Process each job for optimization
    for (const job of validatedData.jobs) {
      let optimizedContent = '';
      let optimizationStatus = 'success';
      let error = null;

      if (hasValidApiKey) {
        try {
          // Generate AI-optimized job listing
          const optimizationPrompt = createBulkOptimizationPrompt(job);

          const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert job posting writer who creates compelling, modern job listings that attract qualified candidates. Write in a friendly, conversational tone and focus on what makes each opportunity unique and appealing to local 209 area candidates.',
              },
              {
                role: 'user',
                content: optimizationPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          });

          optimizedContent = response.choices[0]?.message?.content || '';
          
          if (!optimizedContent) {
            throw new Error('Empty response from AI');
          }
        } catch (aiError) {
          console.error(`AI optimization failed for job ${job.id}:`, aiError);
          // Fallback to template optimization
          optimizedContent = createFallbackOptimization(job);
          optimizationStatus = 'fallback';
          error = 'AI optimization failed, using template';
        }
      } else {
        // Use fallback template when OpenAI is not available
        optimizedContent = createFallbackOptimization(job);
        optimizationStatus = 'fallback';
        error = 'AI not available, using template';
      }

      optimizedJobs.push({
        id: job.id,
        originalContent: job.description,
        optimizedContent,
        optimizationStatus,
        error,
        metadata: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          remote: job.remote,
        },
      });
    }

    return NextResponse.json({
      success: true,
      optimizedJobs,
      hasAI: hasValidApiKey,
      message: `Successfully optimized ${optimizedJobs.length} job${optimizedJobs.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Bulk optimization error:', error);

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
      { error: 'Failed to optimize jobs. Please try again.' },
      { status: 500 }
    );
  }
}
