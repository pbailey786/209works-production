import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Mock JobPostingCreditsService for build compatibility
const JobPostingCreditsService = {
  deductCredits: async (userId: string, amount: number) => ({ success: true }),
  getCredits: async (userId: string) => 10,
  hasCredits: async (userId: string, amount: number) => true
};

// Define the JobType enum to match Prisma schema
type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'other';

// Helper function to normalize job type formats
function normalizeJobType(jobType: string): JobType {
  if (!jobType) return 'full_time';

  const normalized = jobType.toLowerCase().trim();

  // Map common variations to our enum values
  const jobTypeMap: Record<string, JobType> = {
    'full-time': 'full_time',
    'full_time': 'full_time',
    'fulltime': 'full_time',
    'full time': 'full_time',
    'part-time': 'part_time',
    'part_time': 'part_time',
    'parttime': 'part_time',
    'part time': 'part_time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'contract',
    'temporary': 'temporary',
    'temp': 'temporary',
    'temporary work': 'temporary',
    'internship': 'internship',
    'intern': 'internship',
    'student': 'internship',
    'volunteer': 'volunteer',
    'volunteering': 'volunteer',
  };

  return jobTypeMap[normalized] || 'full_time'; // Default to full_time if not found
}

// Define the ExperienceLevel enum to match Prisma schema
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

// Helper function to normalize experience level
function normalizeExperienceLevel(level: string): ExperienceLevel {
  if (!level) return 'entry';

  const normalized = level.toLowerCase().trim();

  const levelMap: Record<string, ExperienceLevel> = {
    'entry': 'entry',
    'entry-level': 'entry',
    'entry level': 'entry',
    'junior': 'entry',
    'beginner': 'entry',
    'mid': 'mid',
    'mid-level': 'mid',
    'mid level': 'mid',
    'middle': 'mid',
    'intermediate': 'mid',
    'senior': 'senior',
    'senior-level': 'senior',
    'senior level': 'senior',
    'experienced': 'senior',
    'expert': 'senior',
    'executive': 'executive',
    'leadership': 'executive',
    'management': 'executive',
    'director': 'executive',
    'manager': 'executive',
  };

  return levelMap[normalized] || 'entry';
}

// Schema for bulk upload validation
const bulkJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  jobType: z.string().optional().transform((val) => normalizeJobType(val || '')),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  salary: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  category: z.string().optional(),
  experienceLevel: z.string().optional().transform((val) => normalizeExperienceLevel(val || '')),
  remote: z.union([z.boolean(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'remote';
    }
    return val || false;
  }),
  featured: z.union([z.boolean(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'featured';
    }
    return val || false;
  }),
  optimizationLevel: z.string().optional().transform((val) => {
    if (!val) return 'standard';
    const normalized = val.toLowerCase().trim();
    if (['enhanced', 'premium'].includes(normalized)) return normalized;
    return 'standard';
  }),
  // Application preferences
  applicationMethod: z.string().optional().transform((val) => {
    if (!val) return 'internal';
    const normalized = val.toLowerCase().trim();
    if (['external_url', 'email'].includes(normalized)) return normalized;
    return 'internal';
  }),
  externalApplicationUrl: z.string().url().optional(),
  applicationEmail: z.string().email().optional(),
  applicationInstructions: z.string().optional(),
  // Supplemental questions
  supplementalQuestions: z.string().optional().transform((val) => {
    if (!val) return [];
    // Split by semicolon or newline and filter empty strings
    return val.split(/[;\n]/).map(q => q.trim()).filter(q => q.length > 0);
  }),
  questionsRequired: z.union([z.boolean(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'required';
    }
    return val || false;
  }),
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
      select: { id: true, role: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        status: 'success' as 'success' | 'warning' | 'error',
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

      if (processedJob.validationErrors.length === 0 || (processedJob.validationErrors.length === 1 && !jobData.salary)) {
        processedJob.status = processedJob.validationErrors.length === 0 ? 'success' : 'warning';
      }

      processedJobs.push(processedJob);
    }

    // Check if user has enough credits (unified credit system)
    const userCredits = await JobPostingCreditsService.getUserCredits(user.id);
    const availableCredits = userCredits.total;

    if (totalCreditsNeeded > availableCredits) {
      return NextResponse.json({
        error: 'Insufficient credits',
        creditsNeeded: totalCreditsNeeded,
        creditsAvailable: availableCredits,
        processedJobs,
      }, { status: 402 });
    }

    // Actually create the jobs in the database
    const createdJobs = [];
    const successfulJobs = processedJobs.filter(job => job.status === 'success');

    for (const processedJobData of successfulJobs) {
      try {
        // Extract only the job fields we need, excluding processing metadata
        const jobData = {
          title: processedJobData.title,
          company: processedJobData.company,
          description: processedJobData.description,
          location: processedJobData.location,
          jobType: processedJobData.jobType,
          salary: processedJobData.salary,
          requirements: processedJobData.requirements,
          benefits: processedJobData.benefits,
          category: processedJobData.category,
          experienceLevel: processedJobData.experienceLevel,
          remote: processedJobData.remote,
          featured: processedJobData.featured,
        };

        console.log('Creating job with data:', JSON.stringify(jobData, null, 2));

        // Parse salary if provided
        let salaryMin = null;
        let salaryMax = null;
        if (jobData.salary) {
          const salaryMatch = jobData.salary.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
          if (salaryMatch) {
            salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''));
            salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''));
          } else {
            const singleSalaryMatch = jobData.salary.match(/\$?([\d,]+)/);
            if (singleSalaryMatch) {
              salaryMin = parseInt(singleSalaryMatch[1].replace(/,/g, ''));
            }
          }
        }

        // Try creating a simple job first to test if basic creation works
        console.log('Attempting to create job in database...');

        const jobCreateData = {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          location: jobData.location,
          jobType: jobData.jobType || 'full_time',
          salaryMin,
          salaryMax,
          categories: jobData.category ? [jobData.category] : [],
          employerId: user.id,
          source: 'bulk_upload',
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/temp-${Date.now()}`, // Temporary URL
          postedAt: new Date(),
          status: 'active',
          region: '209', // Default for 209 Works
          // Optional fields
          benefits: jobData.benefits,
          requirements: jobData.requirements,
          isRemote: jobData.remote || false,
        };

        console.log('Job create data:', JSON.stringify(jobCreateData, null, 2));

        // Try to create a minimal job first to test database connection
        try {
          console.log('Testing minimal job creation...');
          const testJob = await prisma.job.create({
            data: {
              title: 'Test Job',
              company: 'Test Company',
              description: 'This is a test job description that is longer than 50 characters to meet the minimum requirement.',
              location: 'Test Location',
              source: 'test',
              url: 'https://test.com/job/123',
              postedAt: new Date(),
              categories: ['test'],
              jobType: 'full_time',
              employerId: user.id,
              status: 'active',
              region: '209',
            },
          });
          console.log('Test job created successfully:', testJob.id);

          // Delete the test job
          await prisma.job.delete({ where: { id: testJob.id } });
          console.log('Test job deleted successfully');
        } catch (testError) {
          console.error('Test job creation failed:', testError);
          throw new Error('Database test failed: ' + (testError instanceof Error ? testError.message : 'Unknown error'));
        }

        const createdJob = await prisma.job.create({
          data: jobCreateData,
        });

        // Use unified credit system for job posting
        const creditResult = await JobPostingCreditsService.useJobPostCredit(user.id, createdJob.id);

        if (!creditResult.success) {
          // If credit usage fails, delete the job and continue with next job
          await prisma.job.delete({ where: { id: createdJob.id } });
          throw new Error(creditResult.error || 'Failed to use job posting credit');
        }

        // Update the job URL with the actual job ID
        await prisma.job.update({
          where: { id: createdJob.id },
          data: {
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${createdJob.id}`,
          },
        });

        createdJobs.push(createdJob);
      } catch (error) {
        console.error('Error creating job:', error);
        // Update the job status to error
        const jobIndex = processedJobs.findIndex(j => j.title === processedJobData.title);
        if (jobIndex !== -1) {
          processedJobs[jobIndex].status = 'error';
          processedJobs[jobIndex].validationErrors.push('Failed to create job in database');
        }
      }
    }

    // Log the bulk upload attempt
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'bulk_upload_processed',
          resource: 'job_posting',
          resourceId: 'bulk_upload_' + Date.now(),
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

    // Get remaining credits after usage (unified credit system)
    const remainingCreditsData = await JobPostingCreditsService.getUserCredits(user.id);
    const remainingCredits = remainingCreditsData.total;

    return NextResponse.json({
      success: true,
      bulkUploadId: null, // Temporarily disabled
      totalJobs: validatedData.jobs.length,
      createdJobs: createdJobs.length,
      processedJobs,
      creditsNeeded: totalCreditsNeeded,
      creditsRemaining: remainingCredits,
      message: `Successfully created ${createdJobs.length} jobs`,
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
      select: { id: true, role: true, email: true },
    });

    if (!userRecord?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userRecord || userRecord.role !== 'employer') {
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
