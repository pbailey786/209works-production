import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import type { Session } from 'next-auth';

const upsellSchema = z.object({
  jobId: z.string().uuid(),
  socialMediaShoutout: z.boolean().default(false),
  placementBump: z.boolean().default(false),
  upsellBundle: z.boolean().default(false),
  paymentIntentId: z.string().optional(), // For Stripe payment processing
});

const addonPurchaseSchema = z.object({
  addonId: z.string(),
  jobId: z.string().uuid().optional(),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = upsellSchema.parse(body);

    // Verify the job belongs to the current user
    const job = await prisma.job.findFirst({
      where: {
        id: validatedData.jobId,
        employerId: (session!.user as any).id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate total cost
    let totalCost = 0;
    if (validatedData.upsellBundle) {
      totalCost = 50;
    } else {
      if (validatedData.socialMediaShoutout) totalCost += 29;
      if (validatedData.placementBump) totalCost += 29;
    }

    // In a real implementation, you would process payment here
    // For now, we'll simulate successful payment processing

    // Update the job with upsell features
    const updatedJob = await prisma.job.update({
      where: { id: validatedData.jobId },
      data: {
        socialMediaShoutout:
          validatedData.socialMediaShoutout || validatedData.upsellBundle,
        placementBump:
          validatedData.placementBump || validatedData.upsellBundle,
        upsellBundle: validatedData.upsellBundle,
      },
    });

    // Trigger upsell actions
    if (validatedData.socialMediaShoutout || validatedData.upsellBundle) {
      // Queue social media posting
      await queueSocialMediaPost(updatedJob);
    }

    if (validatedData.placementBump || validatedData.upsellBundle) {
      // Update job priority for AI recommendations
      await updateJobPriority(updatedJob.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Upsells activated successfully',
      job: updatedJob,
      totalCost,
    });
  } catch (error) {
    console.error('Error processing upsells:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to queue social media posting
async function queueSocialMediaPost(job: any) {
  try {
    // Create Instagram post entry
    await prisma.instagramPost.create({
      data: {
        jobId: job.id,
        caption: generateSocialMediaCaption(job),
        hashtags: generateHashtags(job),
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      },
    });

    console.log(`Queued social media post for job: ${job.title}`);
  } catch (error) {
    console.error('Error queuing social media post:', error);
  }
}

// Helper function to update job priority for AI recommendations
async function updateJobPriority(jobId: string) {
  try {
    // In a real implementation, this would update some priority scoring system
    // For now, we'll just log it
    console.log(`Updated priority for job: ${jobId}`);

    // You could also update a priority field or create a separate priority table
    // await prisma.job.update({
    //   where: { id: jobId },
    //   data: { priority: 10 } // Higher priority for placement bump
    // });
  } catch (error) {
    console.error('Error updating job priority:', error);
  }
}

// Helper function to generate social media caption
function generateSocialMediaCaption(job: any): string {
  return `🚨 NEW JOB ALERT! 🚨

${job.title} at ${job.company}
📍 ${job.location}

${job.description.substring(0, 150)}...

Apply now on 209Works.com! 

#209Jobs #${job.location.replace(/\s+/g, '')} #Hiring #LocalJobs #209Works`;
}

// Helper function to generate hashtags
function generateHashtags(job: any): string[] {
  const baseHashtags = ['209Jobs', '209Works', 'Hiring', 'LocalJobs'];
  const locationTag = job.location.replace(/\s+/g, '').replace(/,/g, '');
  const companyTag = job.company
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');

  return [
    ...baseHashtags,
    locationTag,
    companyTag,
    'JobAlert',
    'NowHiring',
    'CareerOpportunity',
  ];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const action = searchParams.get('action'); // 'addons' or 'status'

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, currentTier: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If action is 'addons', return available addons
    if (action === 'addons') {
      const addons = await prisma.addOn.findMany({
        where: {
          isActive: true,
          requiredUserRole: {
            has: 'employer'
          },
          compatibleTiers: {
            has: user.currentTier
          }
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });

      // Group addons by category
      const groupedAddons = {
        promotion: addons.filter(addon => addon.category === 'marketing'),
        jobPosts: addons.filter(addon => addon.category === 'recruitment_tools')
      };

      return NextResponse.json({
        success: true,
        addons: groupedAddons,
        userTier: user.currentTier
      });
    }

    // Default behavior: get job upsell status
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required for status check' },
        { status: 400 }
      );
    }

    // Get current upsell status for a job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        employerId: user.id,
      },
      select: {
        id: true,
        title: true,
        socialMediaShoutout: true,
        placementBump: true,
        upsellBundle: true,
        socialMediaPromoted: true,
        socialMediaPromotedAt: true,
        isPinned: true,
        pinnedAt: true,
        pinnedUntil: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Error fetching upsell data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
