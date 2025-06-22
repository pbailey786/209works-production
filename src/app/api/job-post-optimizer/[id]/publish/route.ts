import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { JobPostingCreditsService } from '@/lib/services/job-posting-credits';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        {
          error:
            'Authentication required. Only employers can publish job posts.',
        },
        { status: 401 }
      );
    }

    const { id: optimizerJobId } = await params;

    // Parse request body to check for edited content preference
    const body = await req.json().catch(() => ({}));
    const useEditedContent = body.useEditedContent || false;

    // Get the job post optimizer record
    const jobPostOptimizer = await prisma.jobPostOptimizer.findUnique({
      where: {
        id: optimizerJobId,
        employerId: (session!.user as any).id, // Ensure user owns this job post
      },
    });

    if (!jobPostOptimizer) {
      return NextResponse.json(
        {
          error:
            'Job post not found or you do not have permission to publish it.',
        },
        { status: 404 }
      );
    }

    if (jobPostOptimizer.isPublished) {
      return NextResponse.json(
        { error: 'This job post has already been published.' },
        { status: 400 }
      );
    }

    // Check if user has credits before publishing
    const canPost = await JobPostingCreditsService.canPostJob((session!.user as any).id);

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

    // Validate required fields
    if (!jobPostOptimizer.jobTitle?.trim()) {
      return NextResponse.json(
        {
          error: 'Job title is required',
          code: 'MISSING_TITLE'
        },
        { status: 400 }
      );
    }

    if (!jobPostOptimizer.companyName?.trim()) {
      return NextResponse.json(
        {
          error: 'Company name is required',
          code: 'MISSING_COMPANY'
        },
        { status: 400 }
      );
    }

    if (!jobPostOptimizer.location?.trim()) {
      return NextResponse.json(
        {
          error: 'Location is required',
          code: 'MISSING_LOCATION'
        },
        { status: 400 }
      );
    }

    // Extract job type from the job title or default to full_time
    const jobType = extractJobType(jobPostOptimizer.jobTitle);

    // Determine which content to use for the job description
    let jobDescription = '';
    if (useEditedContent && jobPostOptimizer.editedContent) {
      jobDescription = jobPostOptimizer.editedContent.trim();
    } else if (jobPostOptimizer.aiGeneratedOutput) {
      jobDescription = jobPostOptimizer.aiGeneratedOutput.trim();
    }

    // Validate job description content
    if (!jobDescription || jobDescription.length < 50) {
      return NextResponse.json(
        {
          error: 'Job description is required and must be at least 50 characters long. Please add more details about the position.',
          code: 'INVALID_DESCRIPTION'
        },
        { status: 400 }
      );
    }

    // Create the actual job posting
    const publishedJob = await prisma.job.create({
      data: {
        title: jobPostOptimizer.jobTitle,
        company: jobPostOptimizer.companyName,
        description: jobDescription,
        location: jobPostOptimizer.location,
        jobType: jobType,
        source: 'job_post_optimizer',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${Date.now()}`, // Temporary URL
        postedAt: new Date(),
        status: 'active',
        employerId: (session!.user as any).id,
        // Optional fields
        salaryMin: extractSalaryMin(jobPostOptimizer.pay),
        salaryMax: extractSalaryMax(jobPostOptimizer.pay),
        benefits: jobPostOptimizer.perks,
        requirements: jobPostOptimizer.idealFit,
        categories: extractCategories(jobPostOptimizer.jobTitle),
        // Upsells
        socialMediaShoutout: jobPostOptimizer.socialMediaShoutout,
        placementBump: jobPostOptimizer.placementBump,
        upsellBundle: jobPostOptimizer.upsellBundle,
        region: extractRegion(jobPostOptimizer.location),
      },
    });

    // Use job posting credit for publishing
    const creditResult = await JobPostingCreditsService.useJobPostCredit((session!.user as any).id, publishedJob.id);

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

    // Update the job post optimizer to mark as published
    await prisma.jobPostOptimizer.update({
      where: { id: optimizerJobId },
      data: {
        isPublished: true,
        publishedJobId: publishedJob.id,
        status: 'published',
      },
    });

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
      message: 'Job post published successfully!',
      jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${publishedJob.id}`,
    });
  } catch (error) {
    console.error('Publish job post error:', error);
    return NextResponse.json(
      { error: 'Failed to publish job post. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to extract job type from title
function extractJobType(
  title: string
):
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'volunteer'
  | 'other' {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('part-time') || titleLower.includes('part time')) {
    return 'part_time';
  }
  if (titleLower.includes('contract') || titleLower.includes('contractor')) {
    return 'contract';
  }
  if (titleLower.includes('intern') || titleLower.includes('internship')) {
    return 'internship';
  }
  if (titleLower.includes('temporary') || titleLower.includes('temp')) {
    return 'temporary';
  }
  if (titleLower.includes('volunteer')) {
    return 'volunteer';
  }

  // Default to full-time
  return 'full_time';
}

// Helper function to extract minimum salary
function extractSalaryMin(payString?: string | null): number | null {
  if (!payString) return null;

  const match = payString.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));

    // Convert hourly to yearly (assuming 40 hours/week, 52 weeks/year)
    if (
      payString.toLowerCase().includes('/hr') ||
      payString.toLowerCase().includes('hour')
    ) {
      return Math.round(amount * 40 * 52);
    }

    // If it's already yearly or monthly, return as is
    return Math.round(amount);
  }

  return null;
}

// Helper function to extract maximum salary
function extractSalaryMax(payString?: string | null): number | null {
  if (!payString) return null;

  const matches = payString.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
  if (matches && matches.length >= 2) {
    const amount = parseFloat(matches[1].replace(/[\$,]/g, ''));

    // Convert hourly to yearly (assuming 40 hours/week, 52 weeks/year)
    if (
      payString.toLowerCase().includes('/hr') ||
      payString.toLowerCase().includes('hour')
    ) {
      return Math.round(amount * 40 * 52);
    }

    return Math.round(amount);
  }

  return extractSalaryMin(payString); // Fallback to min if only one number
}

// Helper function to extract categories from job title
function extractCategories(title: string): string[] {
  const titleLower = title.toLowerCase();
  const categories: string[] = [];

  // Healthcare
  if (
    titleLower.includes('nurse') ||
    titleLower.includes('medical') ||
    titleLower.includes('healthcare') ||
    titleLower.includes('doctor')
  ) {
    categories.push('healthcare');
  }

  // Technology
  if (
    titleLower.includes('developer') ||
    titleLower.includes('engineer') ||
    titleLower.includes('programmer') ||
    titleLower.includes('tech') ||
    titleLower.includes('software')
  ) {
    categories.push('technology');
  }

  // Customer Service
  if (
    titleLower.includes('customer service') ||
    titleLower.includes('support') ||
    titleLower.includes('representative')
  ) {
    categories.push('customer-service');
  }

  // Sales
  if (
    titleLower.includes('sales') ||
    titleLower.includes('account manager') ||
    titleLower.includes('business development')
  ) {
    categories.push('sales');
  }

  // Warehouse/Logistics
  if (
    titleLower.includes('warehouse') ||
    titleLower.includes('logistics') ||
    titleLower.includes('driver') ||
    titleLower.includes('delivery')
  ) {
    categories.push('logistics');
  }

  // Administrative
  if (
    titleLower.includes('admin') ||
    titleLower.includes('assistant') ||
    titleLower.includes('clerk') ||
    titleLower.includes('receptionist')
  ) {
    categories.push('administrative');
  }

  // Food Service
  if (
    titleLower.includes('server') ||
    titleLower.includes('cook') ||
    titleLower.includes('chef') ||
    titleLower.includes('restaurant') ||
    titleLower.includes('food')
  ) {
    categories.push('food-service');
  }

  // Retail
  if (
    titleLower.includes('retail') ||
    titleLower.includes('cashier') ||
    titleLower.includes('store')
  ) {
    categories.push('retail');
  }

  // Default category if none found
  if (categories.length === 0) {
    categories.push('other');
  }

  return categories;
}

// Helper function to extract region from location
function extractRegion(location: string): string {
  const locationLower = location.toLowerCase();

  // 209 area code cities
  const cities209 = [
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
    'ceres',
    'patterson',
    'newman',
    'gustine',
    'los banos',
    'atwater',
    'livingston',
    'winton',
  ];

  for (const city of cities209) {
    if (locationLower.includes(city)) {
      return '209';
    }
  }

  // Default to Central Valley if in California
  if (locationLower.includes('ca') || locationLower.includes('california')) {
    return 'central-valley';
  }

  return 'other';
}
