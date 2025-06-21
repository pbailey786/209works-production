import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import InstagramScheduler from '@/lib/services/instagram-scheduler';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';

const updatePostSchema = z.object({
  caption: z.string().min(1).max(2200).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.instagramPost.findFirst({
      where: {
        id: (await params).id,
        creatorId: user.id,
      },
      include: {
        job: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching Instagram post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!userRecord?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // Check if post exists and belongs to user
    const existingPost = await prisma.instagramPost.findFirst({
      where: {
        id: (await params).id,
        creatorId: user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only allow updates to draft or scheduled posts
    if (!['draft', 'scheduled'].includes(existingPost.status)) {
      return NextResponse.json(
        { error: 'Cannot update published or failed posts' },
        { status: 400 }
      );
    }

    // Handle rescheduling
    if (validatedData.scheduledAt) {
      const newScheduledAt = new Date(validatedData.scheduledAt);

      if (newScheduledAt <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }

      if (existingPost.status === 'scheduled') {
        // Update the scheduled time directly since reschedulePost doesn't exist
        await prisma.instagramPost.update({
          where: { id: (await params).id },
          data: { scheduledFor: newScheduledAt },
        });
      }
    }

    // Update the post
    const updateData: any = {};
    if (validatedData.caption) updateData.caption = validatedData.caption;
    if (validatedData.hashtags) updateData.hashtags = validatedData.hashtags;
    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt);
      updateData.status = 'scheduled';
    }

    const updatedPost = await prisma.instagramPost.update({
      where: { id: (await params).id },
      data: updateData,
      include: {
        job: true,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Error updating Instagram post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!userRecord?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if post exists and belongs to user
    const existingPost = await prisma.instagramPost.findFirst({
      where: {
        id: (await params).id,
        creatorId: user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post (whether scheduled or draft)
    await prisma.instagramPost.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting Instagram post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
