import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import InstagramScheduler from '@/lib/services/instagram-scheduler';
import { InstagramUtils } from '@/lib/services/instagram-api';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

const createPostSchema = z.object({
  jobId: z.string().optional(),
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).max(30),
  scheduledAt: z.string().datetime().optional(),
  imageOptions: z
    .object({
      template: z.enum(['modern', 'classic', 'minimal', 'gradient']).optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      brandColor: z.string().optional(),
    })
    .optional(),
  type: z
    .enum(['job_listing', 'company_highlight', 'industry_news', 'custom'])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let posts;
    if (status === 'scheduled') {
      posts = await prisma.instagramPost.findMany({
        where: {
          creatorId: user.id,
          status: 'scheduled',
        },
        include: { job: true },
        orderBy: { scheduledFor: 'asc' },
      });
    } else if (status === 'published') {
      posts = await prisma.instagramPost.findMany({
        where: {
          creatorId: user.id,
          status: 'published',
        },
        include: { job: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
    } else {
      // Get all posts
      posts = await prisma.instagramPost.findMany({
        where: { creatorId: user.id },
        include: { job: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Validate caption
    const captionValidation = InstagramUtils.validateCaption(
      validatedData.caption
    );
    if (!captionValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid caption', details: captionValidation.errors },
        { status: 400 }
      );
    }

    // Parse scheduled date if provided
    const scheduledAt = validatedData.scheduledAt
      ? new Date(validatedData.scheduledAt)
      : undefined;

    // Validate scheduled date is in the future
    if (scheduledAt && scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Use static method to schedule post
    const postId = await InstagramScheduler.schedulePost({
      caption: validatedData.caption,
      type: validatedData.type || 'job_listing',
      jobId: validatedData.jobId,
      scheduledFor: scheduledAt,
    });

    // Get the created post
    const post = await prisma.instagramPost.findUnique({
      where: { id: postId },
      include: { job: true },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating Instagram post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
