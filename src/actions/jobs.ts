'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/app/api/auth/prisma';
import { ActionResult } from '@/types/actions';

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(1, 'Requirements are required'),
  location: z.string().min(1, 'Location is required'),
  jobType: z.enum([
    'full_time',
    'part_time',
    'contract',
    'internship',
  ]),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  benefits: z.string().optional(),
  skills: z.array(z.string()).optional(),
  isRemote: z.boolean().default(false),
  applicationUrl: z.string().url().optional(),
  applicationEmail: z.string().email().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().uuid('Invalid job ID'),
});

const jobApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  coverLetter: z
    .string()
    .min(100, 'Cover letter must be at least 100 characters'),
  resumeUrl: z.string().url('Please provide a valid resume URL'),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  additionalNotes: z.string().optional(),
});

const saveJobSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

const jobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  jobType: z
    .enum(['full_time', 'part_time', 'contract', 'temporary', 'internship'])
    .optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  remote: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Create job action (for employers)
export async function createJobAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Verify user is an employer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return {
        success: false,
        message: 'Only employers can create job postings',
      };
    }

    // Extract and validate form data
    const rawData = {
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      description: formData.get('description') as string,
      requirements: formData.get('requirements') as string,
      location: formData.get('location') as string,
      jobType: formData.get('jobType') as any,
      experienceLevel: formData.get('experienceLevel') as any,
      salaryMin: formData.get('salaryMin')
        ? Number(formData.get('salaryMin'))
        : undefined,
      salaryMax: formData.get('salaryMax')
        ? Number(formData.get('salaryMax'))
        : undefined,
      benefits: formData.get('benefits') as string,
      skills: formData.get('skills')
        ? JSON.parse(formData.get('skills') as string)
        : [],
      isRemote: formData.get('isRemote') === 'true',
      applicationUrl: (formData.get('applicationUrl') as string) || undefined,
      applicationEmail:
        (formData.get('applicationEmail') as string) || undefined,
      expiresAt: (formData.get('expiresAt') as string) || undefined,
    };

    const validatedData = createJobSchema.parse(rawData);

    // Validate salary range
    if (
      validatedData.salaryMin &&
      validatedData.salaryMax &&
      validatedData.salaryMin > validatedData.salaryMax
    ) {
      return {
        success: false,
        message: 'Minimum salary cannot be greater than maximum salary',
      };
    }

    // Create job posting
    const job = await prisma.job.create({
      data: {
        ...validatedData,
        companyId: userId,
        skills: validatedData.skills || [],
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        status: 'active',
        // Required fields for Job model
        source: 'employer_portal',
        url:
          validatedData.applicationUrl ||
          `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${Date.now()}`,
        postedAt: new Date(),
      },
    });

    revalidatePath('/employers/my-jobs');
    revalidatePath('/jobs');

    return {
      success: true,
      message: 'Job posted successfully!',
      data: { jobId: job.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Create job error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Update job action
export async function updateJobAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const jobId = formData.get('id') as string;
    if (!jobId) {
      return {
        success: false,
        message: 'Job ID is required',
      };
    }

    // Verify job ownership
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: userId,
      },
    });

    if (!existingJob) {
      return {
        success: false,
        message: 'Job not found or access denied',
      };
    }

    // Extract and validate form data
    const rawData = {
      id: jobId,
      title: (formData.get('title') as string) || undefined,
      company: (formData.get('company') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      requirements: (formData.get('requirements') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      jobType: (formData.get('jobType') as any) || undefined,
      experienceLevel: (formData.get('experienceLevel') as any) || undefined,
      salaryMin: formData.get('salaryMin')
        ? Number(formData.get('salaryMin'))
        : undefined,
      salaryMax: formData.get('salaryMax')
        ? Number(formData.get('salaryMax'))
        : undefined,
      benefits: (formData.get('benefits') as string) || undefined,
      skills: formData.get('skills')
        ? JSON.parse(formData.get('skills') as string)
        : undefined,
      isRemote: formData.get('isRemote')
        ? formData.get('isRemote') === 'true'
        : undefined,
      applicationUrl: (formData.get('applicationUrl') as string) || undefined,
      applicationEmail:
        (formData.get('applicationEmail') as string) || undefined,
      expiresAt: (formData.get('expiresAt') as string) || undefined,
    };

    const validatedData = updateJobSchema.parse(rawData);

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    // Remove id from update data
    delete updateData.id;

    // Handle expiresAt conversion
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(
        updateData.expiresAt as string
      ).toISOString();
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/employers/my-jobs');
    revalidatePath(`/jobs/${jobId}`);

    return {
      success: true,
      message: 'Job updated successfully!',
      data: { jobId: updatedJob.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Update job error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Delete job action
export async function deleteJobAction(
  jobId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Verify job ownership
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: userId,
      },
    });

    if (!existingJob) {
      return {
        success: false,
        message: 'Job not found or access denied',
      };
    }

    // Use soft deletion to prevent cascading delete issues
    const { DataIntegrityService } = await import(
      '@/lib/database/data-integrity'
    );
    const deletionResult = await DataIntegrityService.softDeleteJob(
      jobId,
      userId,
      'Employer requested job deletion'
    );

    if (!deletionResult.success) {
      return {
        success: false,
        message: deletionResult.errors?.[0] || 'Failed to delete job safely',
      };
    }

    revalidatePath('/employers/my-jobs');

    return {
      success: true,
      message: 'Job deleted successfully',
    };
  } catch (error) {
    console.error('Delete job error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Apply to job action
export async function applyToJobAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Extract and validate form data first
    const rawData = {
      jobId: formData.get('jobId') as string,
      coverLetter: formData.get('coverLetter') as string,
      resumeUrl: formData.get('resumeUrl') as string,
      linkedinUrl: (formData.get('linkedinUrl') as string) || undefined,
      portfolioUrl: (formData.get('portfolioUrl') as string) || undefined,
      additionalNotes: (formData.get('additionalNotes') as string) || undefined,
    };

    const validatedData = jobApplicationSchema.parse(rawData);

    // OPTIMIZATION: Run independent database queries in parallel
    const [user, job, existingApplication] = await Promise.all([
      // Verify user is a jobseeker
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true, email: true },
      }),
      // Check if job exists and is active
      prisma.job.findUnique({
        where: { id: validatedData.jobId },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          expiresAt: true,
          companyId: true,
        },
      }),
      // Check if user already applied
      prisma.jobApplication.findFirst({
        where: {
          jobId: validatedData.jobId,
          userId: userId,
        },
      }),
    ]);

    // Validate user
    if (!user || user.role !== 'jobseeker') {
      return {
        success: false,
        message: 'Only job seekers can apply to jobs',
      };
    }

    // Validate job
    if (!job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    if (job.status !== 'active') {
      return {
        success: false,
        message: 'This job is no longer accepting applications',
      };
    }

    if (job.expiresAt && job.expiresAt < new Date()) {
      return {
        success: false,
        message: 'The application deadline for this job has passed',
      };
    }

    // Validate existing application
    if (existingApplication) {
      return {
        success: false,
        message: 'You have already applied to this job',
      };
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        ...validatedData,
        userId: userId,
        status: 'pending',
      },
    });

    revalidatePath('/profile/applications');
    revalidatePath(`/jobs/${validatedData.jobId}`);

    return {
      success: true,
      message: 'Application submitted successfully!',
      data: { applicationId: application.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Apply to job error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Save job action
export async function saveJobAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const rawData = {
      jobId: formData.get('jobId') as string,
    };

    const validatedData = saveJobSchema.parse(rawData);

    // OPTIMIZATION: Run independent database queries in parallel
    const [job, existingSave] = await Promise.all([
      // Check if job exists
      prisma.job.findUnique({
        where: { id: validatedData.jobId },
        select: { id: true, title: true },
      }),
      // Check if already saved
      prisma.savedJob.findFirst({
        where: {
          jobId: validatedData.jobId,
          userId: userId,
        },
      }),
    ]);

    if (!job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    if (existingSave) {
      // Unsave the job
      await prisma.savedJob.delete({
        where: { id: existingSave.id },
      });

      revalidatePath('/profile/saved');

      return {
        success: true,
        message: 'Job removed from saved jobs',
        data: { action: 'unsaved' },
      };
    } else {
      // Save the job
      await prisma.savedJob.create({
        data: {
          jobId: validatedData.jobId,
          userId: userId,
        },
      });

      revalidatePath('/profile/saved');

      return {
        success: true,
        message: 'Job saved successfully!',
        data: { action: 'saved' },
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Save job error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Search jobs action
export async function searchJobsAction(
  prevState: any,
  formData: FormData
): Promise<{ jobs: any[]; totalCount: number; currentPage: number }> {
  try {
    // Extract search parameters
    const rawData = {
      query: (formData.get('query') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      jobType: (formData.get('jobType') as any) || undefined,
      experienceLevel: (formData.get('experienceLevel') as any) || undefined,
      salaryMin: formData.get('salaryMin')
        ? Number(formData.get('salaryMin'))
        : undefined,
      salaryMax: formData.get('salaryMax')
        ? Number(formData.get('salaryMax'))
        : undefined,
      remote: formData.get('remote')
        ? formData.get('remote') === 'true'
        : undefined,
      skills: formData.get('skills')
        ? JSON.parse(formData.get('skills') as string)
        : undefined,
      page: formData.get('page') ? Number(formData.get('page')) : 1,
      limit: formData.get('limit') ? Number(formData.get('limit')) : 20,
    };

    const validatedData = jobSearchSchema.parse(rawData);

    // Build where condition
    const whereCondition: any = {
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    // Add search filters
    if (validatedData.query) {
      whereCondition.OR = [
        { title: { contains: validatedData.query, mode: 'insensitive' } },
        { description: { contains: validatedData.query, mode: 'insensitive' } },
        { company: { contains: validatedData.query, mode: 'insensitive' } },
      ];
    }

    if (validatedData.location) {
      whereCondition.location = {
        contains: validatedData.location,
        mode: 'insensitive',
      };
    }

    if (validatedData.jobType) {
      whereCondition.jobType = validatedData.jobType;
    }

    if (validatedData.experienceLevel) {
      whereCondition.experienceLevel = validatedData.experienceLevel;
    }

    if (validatedData.salaryMin) {
      whereCondition.salaryMin = { gte: validatedData.salaryMin };
    }

    if (validatedData.salaryMax) {
      whereCondition.salaryMax = { lte: validatedData.salaryMax };
    }

    if (validatedData.remote !== undefined) {
      whereCondition.isRemote = validatedData.remote;
    }

    if (validatedData.skills && validatedData.skills.length > 0) {
      whereCondition.skills = {
        hasEvery: validatedData.skills,
      };
    }

    // Get total count
    const totalCount = await prisma.job.count({ where: whereCondition });

    // Get jobs
    const jobs = await prisma.job.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        isRemote: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
    });

    return {
      jobs,
      totalCount,
      currentPage: validatedData.page,
    };
  } catch (error) {
    console.error('Search jobs error:', error);
    return {
      jobs: [],
      totalCount: 0,
      currentPage: 1,
    };
  }
}

// Toggle job status action (for employers)
export async function toggleJobStatusAction(
  jobId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Verify job ownership
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: userId,
      },
      select: { id: true, status: true, title: true },
    });

    if (!existingJob) {
      return {
        success: false,
        message: 'Job not found or access denied',
      };
    }

    // Toggle status
    const newStatus = existingJob.status === 'active' ? 'paused' : 'active';

    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    revalidatePath('/employers/my-jobs');
    revalidatePath(`/jobs/${jobId}`);

    return {
      success: true,
      message: `Job ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
      data: { status: newStatus },
    };
  } catch (error) {
    console.error('Toggle job status error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
