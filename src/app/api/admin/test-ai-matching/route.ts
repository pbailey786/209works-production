import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { requireRole } from '@/lib/auth/middleware';
import { JobMatchingService } from '@/lib/services/job-matching';
import { ResumeEmbeddingService } from '@/lib/services/resume-embedding';
import { JobQueueService } from '@/lib/services/job-queue';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';


const testSchema = z.object({
  action: z.enum(['process_resume', 'match_job', 'send_emails', 'full_test']),
  userId: z.string().optional(),
  jobId: z.string().optional(),
  testResumeText: z.string().optional()
});

// POST /api/admin/test-ai-matching - Test AI matching system components
export const POST = withValidation(
  async (req, { body }) => {
    // Check admin authorization
    const session = await requireRole(req, ['admin']);
    if (session instanceof NextResponse) return session;

    try {
      const { action, userId, jobId, testResumeText } = body!;

      switch (action) {
        case 'process_resume':
          return await testResumeProcessing(userId, testResumeText);
        
        case 'match_job':
          return await testJobMatching(jobId);
        
        case 'send_emails':
          return await testEmailSending(jobId);
        
        case 'full_test':
          return await runFullTest();
        
        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid action'
          }, { status: 400 });
      }

    } catch (error) {
      console.error('AI matching test failed:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  },
  {
    bodySchema: testSchema
  }
);

async function testResumeProcessing(userId?: string, testResumeText?: string) {
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: 'User ID required for resume processing test'
    }, { status: 400 });
  }

  const resumeText = testResumeText || `
John Doe
Software Engineer

EXPERIENCE
Senior Software Engineer at Tech Corp (2020-2024)
- Developed React and Node.js applications
- Worked with PostgreSQL and MongoDB databases
- Led team of 5 developers on major projects

Junior Developer at StartupXYZ (2018-2020)
- Built web applications using JavaScript, HTML, CSS
- Implemented REST APIs and microservices
- Used AWS for deployment and scaling

EDUCATION
Bachelor of Science in Computer Science
University of California, 2018

SKILLS
JavaScript, React, Node.js, PostgreSQL, MongoDB, AWS, Docker, Git, Python
  `.trim();

  console.log(`🧪 Testing resume processing for user: ${userId}`);

  try {
    await ResumeEmbeddingService.processResumeEmbedding(userId, resumeText);
    const embedding = await ResumeEmbeddingService.getResumeEmbedding(userId);

    return NextResponse.json({
      success: true,
      message: 'Resume processing test completed',
      user: embedding?.user,
      extractedData: {
        skills: embedding?.skills || [],
        jobTitles: embedding?.jobTitles || [],
        industries: embedding?.industries || [],
        education: embedding?.education || []
      },
      embeddingLength: embedding?.embedding ? JSON.parse(embedding.embedding).length : 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testJobMatching(jobId?: string) {
  if (!jobId) {
    // Find a featured job to test with
    const featuredJob = await prisma.job.findFirst({
      where: { featured: true, status: 'active' },
      select: { id: true, title: true }
    });

    if (!featuredJob) {
      return NextResponse.json({
        success: false,
        error: 'No featured jobs found for testing'
      }, { status: 404 });
    }

    jobId = featuredJob.id;
  }

  console.log(`🧪 Testing job matching for job: ${jobId}`);

  try {
    const result = await JobMatchingService.processFeaturedJobMatching(jobId);
    return NextResponse.json({
      success: true,
      message: 'Job matching test completed',
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testEmailSending(jobId?: string) {
  if (!jobId) {
    // Find a job with matches
    const jobWithMatches = await prisma.jobMatch.findFirst({
      where: { 
        emailSent: false,
        score: { gte: 80 }
      },
      select: { jobId: true },
      distinct: ['jobId']
    });

    if (!jobWithMatches) {
      return NextResponse.json({
        success: false,
        error: 'No jobs with unsent matches found for testing'
      }, { status: 404 });
    }

    jobId = jobWithMatches.jobId;
  }

  console.log(`🧪 Testing email sending for job: ${jobId}`);

  try {
    const { FeaturedJobEmailService } = await import('@/lib/services/featured-job-email');
    const result = await FeaturedJobEmailService.sendJobMatchEmails(jobId);

    return NextResponse.json({
      success: true,
      message: 'Email sending test completed',
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function runFullTest() {
  console.log('🧪 Running full AI matching system test');
  
  const results: {
    steps: string[];
    success: boolean;
    errors: string[];
  } = {
    steps: [],
    success: true,
    errors: []
  };

  try {
    // Step 1: Check queue stats
    results.steps.push('Checking queue statistics...');
    const queueStats = await JobQueueService.getQueueStats();
    results.steps.push(`Queue stats: ${JSON.stringify(queueStats)}`);

    // Step 2: Process some pending jobs
    results.steps.push('Processing pending queue jobs...');
    const processResult = await JobQueueService.processAllPendingJobs(5);
    results.steps.push(`Processed ${processResult.processed} jobs (${processResult.successful} successful)`);

    // Step 3: Check for users needing resume processing
    results.steps.push('Checking users needing resume processing...');
    const usersNeedingProcessing = await ResumeEmbeddingService.getUsersNeedingProcessing(5);
    results.steps.push(`Found ${usersNeedingProcessing.length} users needing processing`);

    // Step 4: Check for featured jobs
    results.steps.push('Checking featured jobs...');
    const featuredJobs = await prisma.job.findMany({
      where: { featured: true, status: 'active' },
      select: { id: true, title: true, company: true },
      take: 3
    });
    results.steps.push(`Found ${featuredJobs.length} active featured jobs`);

    // Step 5: Get recent matches
    results.steps.push('Checking recent AI matches...');
    const recentMatches = await prisma.jobMatch.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 10
    });
    results.steps.push(`Found ${recentMatches.length} matches in last 24 hours`);

    return NextResponse.json({
      success: true,
      message: 'Full system test completed successfully',
      results,
      summary: {
        queueStats,
        processResult,
        usersNeedingProcessing: usersNeedingProcessing.length,
        featuredJobs: featuredJobs.length,
        recentMatches: recentMatches.length
      }
    });

  } catch (error) {
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json({
      success: false,
      error: `Full test failed: ${JSON.stringify(results)}`
    }, { status: 500 });
  }
}

// GET /api/admin/test-ai-matching - Get system status
export const GET = withValidation(
  async (req) => {
    // Check admin authorization
    const session = await requireRole(req, ['admin']);
    if (session instanceof NextResponse) return session;

    try {
      // Get basic system statistics
      const stats = {
        resumeEmbeddings: await prisma.resumeEmbedding.count(),
        jobMatches: await prisma.jobMatch.count(),
        queueJobs: await prisma.jobProcessingQueue.count(),
        featuredJobs: await prisma.job.count({ where: { featured: true } }),
        recentMatches: await prisma.jobMatch.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
            }
          }
        }),
        emailsSent: await prisma.jobMatch.count({ where: { emailSent: true } })
      };

      const queueStats = await JobQueueService.getQueueStats();

      return NextResponse.json({
        success: true,
        message: 'AI matching system status',
        stats,
        queueStats,
        systemHealth: {
          embeddings: stats.resumeEmbeddings > 0,
          matches: stats.jobMatches > 0,
          recentActivity: stats.recentMatches > 0,
          emailsWorking: stats.emailsSent > 0
        }
      });

    } catch (error) {
      console.error('Failed to get system status:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  },
  {}
);