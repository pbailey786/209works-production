import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';


const applyAddonSchema = z.object({
  userAddonId: z.string().uuid(),
  jobId: z.string().uuid(),
});

// POST /api/addons/apply - Apply purchased addon to a job
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = applyAddonSchema.parse(body);

    // Get user
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Only employers can apply addons' }, { status: 403 });
    }

    // Verify user owns the addon and it's active
    const userAddon = await prisma.userAddOn.findFirst({
      where: {
        id: validatedData.userAddonId,
        userId: user.id,
        isActive: true
      },
      include: {
        AddOn: true
      }
    });

    if (!userAddon) {
      return NextResponse.json({ error: 'Addon not found or not owned by user' }, { status: 404 });
    }

    // Check if addon has expired
    if (userAddon.expiresAt && userAddon.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Addon has expired' }, { status: 400 });
    }

    // Verify user owns the job
    const job = await prisma.job.findFirst({
      where: {
        id: validatedData.jobId,
        employerId: user.id
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found or not owned by user' }, { status: 404 });
    }

    // Check if addon has already been applied to this job
    const usageData = userAddon.usageData as any;
    const appliedJobs = usageData?.appliedToJobs || [];
    const alreadyApplied = appliedJobs.some((applied: any) => applied.jobId === validatedData.jobId);

    if (alreadyApplied) {
      return NextResponse.json({ error: 'Addon has already been applied to this job' }, { status: 400 });
    }

    // Apply the addon based on its type
    const addon = userAddon.AddOn;
    let updateData: any = {};
    let successMessage = '';

    switch (addon.slug) {
      case 'social-media-bump':
        updateData.socialMediaShoutout = true;
        successMessage = 'Social media promotion activated for this job';

        // Queue social media posting
        await queueSocialMediaPost(job);
        break;

      case 'featured-placement':
        updateData.placementBump = true;
        updateData.isPinned = true;
        successMessage = 'Job featured for enhanced visibility';
        break;

      case 'social-featured-bundle':
        updateData.socialMediaShoutout = true;
        updateData.placementBump = true;
        updateData.upsellBundle = true;
        updateData.isPinned = true;
        successMessage = 'Social media promotion and featured placement activated';

        // Queue social media posting
        await queueSocialMediaPost(job);
        break;

      default:
        return NextResponse.json({ error: 'This addon type cannot be applied to individual jobs' }, { status: 400 });
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: validatedData.jobId },
      data: updateData
    });

    // Update addon usage data
    await prisma.userAddOn.update({
      where: { id: validatedData.userAddonId },
      data: {
        usageData: {
          ...usageData,
          appliedToJobs: [
            ...appliedJobs,
            {
              jobId: validatedData.jobId,
              appliedAt: new Date().toISOString(),
              jobTitle: job.title
            }
          ]
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      job: updatedJob,
      addon: {
        id: addon.id,
        name: addon.name,
        slug: addon.slug
      }
    });

  } catch (error) {
    console.error('Error applying addon to job:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to apply addon to job' },
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
