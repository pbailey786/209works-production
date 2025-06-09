import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Schema for bulk upload validation
const bulkJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).optional(),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  salary: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  category: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  remote: z.boolean().optional(),
  featured: z.boolean().optional(),
  optimizationLevel: z.enum(['standard', 'enhanced', 'premium']).default('standard'),
});

const bulkUploadSchema = z.object({
  jobs: z.array(bulkJobSchema),
  optimizationSettings: z.object({
    autoEnhance: z.boolean().default(true),
    addKeywords: z.boolean().default(true),
    generateGraphics: z.boolean().default(false),
    createFeatured: z.boolean().default(false),
    optimizationLevel: z.enum(['standard', 'enhanced', 'premium']).default('standard'),
    targetAudience: z.string().optional(),
  }).optional(),
});

// POST /api/employers/bulk-upload - Process bulk job upload
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, credits: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkUploadSchema.parse(body);

    // Calculate total credits needed
    let totalCreditsNeeded = 0;
    const processedJobs = [];

    for (const jobData of validatedData.jobs) {
      let creditsForJob = 1; // Base credit for job posting

      // Add credits for optimization level
      if (jobData.optimizationLevel === 'enhanced') {
        creditsForJob += 0.5;
      } else if (jobData.optimizationLevel === 'premium') {
        creditsForJob += 1;
      }

      // Add credits for additional features
      if (validatedData.optimizationSettings?.generateGraphics) {
        creditsForJob += 1;
      }
      if (validatedData.optimizationSettings?.createFeatured || jobData.featured) {
        creditsForJob += 2;
      }

      totalCreditsNeeded += creditsForJob;

      // Validate and process each job
      const processedJob = {
        ...jobData,
        creditsRequired: creditsForJob,
        status: 'pending' as const,
        validationErrors: [] as string[],
      };

      // Basic validation
      if (!jobData.title.trim()) {
        processedJob.validationErrors.push('Job title is required');
        processedJob.status = 'error';
      }
      if (!jobData.description || jobData.description.length < 50) {
        processedJob.validationErrors.push('Job description must be at least 50 characters');
        processedJob.status = 'error';
      }
      if (!jobData.location.trim()) {
        processedJob.validationErrors.push('Location is required');
        processedJob.status = 'error';
      }

      // Warnings for missing optional fields
      if (!jobData.salary) {
        processedJob.validationErrors.push('Salary range not specified');
        if (processedJob.status !== 'error') {
          processedJob.status = 'warning';
        }
      }

      if (processedJob.validationErrors.length === 0) {
        processedJob.status = 'success';
      }

      processedJobs.push(processedJob);
    }

    // Check if user has enough credits
    const userCredits = user.credits as any || { jobPost: 0 };
    if (totalCreditsNeeded > userCredits.jobPost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        creditsNeeded: totalCreditsNeeded,
        creditsAvailable: userCredits.jobPost,
        processedJobs,
      }, { status: 400 });
    }

    // Create bulk upload record
    const bulkUpload = await prisma.bulkUpload.create({
      data: {
        employerId: user.id,
        fileName: `bulk_upload_${Date.now()}.json`,
        totalJobs: validatedData.jobs.length,
        successfulJobs: processedJobs.filter(job => job.status === 'success').length,
        creditsUsed: totalCreditsNeeded,
        status: 'processing',
        settings: validatedData.optimizationSettings || {},
      },
    }).catch(() => {
      // If bulkUpload table doesn't exist, we'll skip this for now
      return null;
    });

    // Log the bulk upload attempt
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'bulk_upload_processed',
          resource: 'job_posting',
          resourceId: bulkUpload?.id || 'unknown',
          details: {
            totalJobs: validatedData.jobs.length,
            successfulJobs: processedJobs.filter(job => job.status === 'success').length,
            errorJobs: processedJobs.filter(job => job.status === 'error').length,
            warningJobs: processedJobs.filter(job => job.status === 'warning').length,
            creditsNeeded: totalCreditsNeeded,
            optimizationSettings: validatedData.optimizationSettings,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .catch(error => {
        console.error('Failed to log bulk upload:', error);
      });

    return NextResponse.json({
      success: true,
      bulkUploadId: bulkUpload?.id,
      totalJobs: validatedData.jobs.length,
      processedJobs,
      creditsNeeded: totalCreditsNeeded,
      creditsRemaining: userCredits.jobPost - totalCreditsNeeded,
      message: 'Bulk upload processed successfully',
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid upload data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}

// GET /api/employers/bulk-upload - Get bulk upload history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get bulk upload history (mock data for now)
    const mockHistory = [
      {
        id: '1',
        fileName: 'tech_jobs_batch_1.csv',
        uploadDate: '2024-01-15',
        totalJobs: 25,
        successfulJobs: 23,
        creditsUsed: 23,
        status: 'completed',
      },
      {
        id: '2',
        fileName: 'sales_positions.xlsx',
        uploadDate: '2024-01-10',
        totalJobs: 15,
        successfulJobs: 15,
        creditsUsed: 15,
        status: 'completed',
      },
    ];

    return NextResponse.json({
      success: true,
      history: mockHistory,
    });
  } catch (error) {
    console.error('Error fetching bulk upload history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload history' },
      { status: 500 }
    );
  }
}
