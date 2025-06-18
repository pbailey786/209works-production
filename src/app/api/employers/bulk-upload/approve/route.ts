import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import { JobPostingCreditsService } from '@/lib/services/job-posting-credits';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Define the JobType enum to match Prisma schema
type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'other';

// Helper function to normalize job type formats
function normalizeJobType(jobType: string): JobType {
  if (!jobType) return 'full_time';
  
  const normalized = jobType.toLowerCase().trim();
  
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
  
  return jobTypeMap[normalized] || 'full_time';
}



// Schema for job approval
const approveJobSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  salary: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  remote: z.boolean().optional(),
  useOptimizedContent: z.boolean().default(true),
});

// POST /api/employers/bulk-upload/approve - Approve and publish a single job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

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

    const body = await request.json();
    const validatedData = approveJobSchema.parse(body);

    // Check if user has credits before publishing
    const canPost = await JobPostingCreditsService.canPostJob(user.id);

    if (!canPost) {
      return NextResponse.json(
        {
          error: 'Job posting credits required to publish job posts',
          code: 'CREDITS_REQUIRED',
          redirectUrl: '/employers/dashboard'
        },
        { status: 402 }
      );
    }

    // Extract salary range if provided
    const extractSalaryRange = (salaryString?: string) => {
      if (!salaryString) return { min: null, max: null };
      
      const match = salaryString.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
      if (match && match.length >= 2) {
        const min = parseFloat(match[0].replace(/[\$,]/g, ''));
        const max = parseFloat(match[1].replace(/[\$,]/g, ''));
        return { min: Math.round(min), max: Math.round(max) };
      } else if (match && match.length === 1) {
        const amount = parseFloat(match[0].replace(/[\$,]/g, ''));
        return { min: Math.round(amount), max: null };
      }
      
      return { min: null, max: null };
    };

    const salaryRange = extractSalaryRange(validatedData.salary);

    // Create the job posting
    const publishedJob = await prisma.job.create({
      data: {
        title: validatedData.title,
        company: validatedData.company,
        description: validatedData.description,
        location: validatedData.location,
        jobType: normalizeJobType(validatedData.jobType || ''),
        source: 'bulk_upload',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${Date.now()}`, // Temporary URL
        postedAt: new Date(),
        status: 'active',
        employerId: user.id,
        // Optional fields
        salaryMin: salaryRange.min,
        salaryMax: salaryRange.max,
        benefits: validatedData.benefits,
        requirements: validatedData.requirements,
        categories: [], // Will be auto-categorized later
        isRemote: validatedData.remote || false,
        region: '209', // Default for 209 Works
      },
    });

    // Use job posting credit for publishing
    const creditResult = await JobPostingCreditsService.useJobPostCredit(user.id, publishedJob.id);

    if (!creditResult.success) {
      // If credit usage fails, delete the job and return error
      await prisma.job.delete({ where: { id: publishedJob.id } });
      return NextResponse.json(
        {
          error: creditResult.error || 'Failed to use job posting credit',
          code: 'CREDIT_USAGE_FAILED'
        },
        { status: 402 }
      );
    }

    // Update the job URL with the actual job ID
    await prisma.job.update({
      where: { id: publishedJob.id },
      data: {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${publishedJob.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: publishedJob.id,
      message: 'Job approved and published successfully!',
      jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${publishedJob.id}`,
    });
  } catch (error) {
    console.error('Job approval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid job data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to approve job. Please try again.' },
      { status: 500 }
    );
  }
}
