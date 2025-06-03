import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json(
        {
          error:
            'Authentication required. Only employers can publish job posts.',
        },
        { status: 401 }
      );
    }

    const { id: optimizerJobId } = await params;

    // Get the job post optimizer record
    const jobPostOptimizer = await prisma.jobPostOptimizer.findUnique({
      where: {
        id: optimizerJobId,
        employerId: session.user.id, // Ensure user owns this job post
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

    // Extract job type from the job title or default to full_time
    const jobType = extractJobType(jobPostOptimizer.jobTitle);

    // Create the actual job posting
    const publishedJob = await prisma.job.create({
      data: {
        title: jobPostOptimizer.jobTitle,
        company: jobPostOptimizer.companyName,
        description:
          jobPostOptimizer.aiGeneratedOutput || 'Job description not available',
        location: jobPostOptimizer.location,
        jobType: jobType,
        source: 'job_post_optimizer',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${Date.now()}`, // Temporary URL
        postedAt: new Date(),
        status: 'active',
        employerId: session.user.id,
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
