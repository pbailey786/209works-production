import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  editedContent: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        {
          error: 'Authentication required. Only employers can update job posts.',
        },
        { status: 401 }
      );
    }

    const { id: optimizerJobId } = await params;

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
          error: 'Job post not found or you do not have permission to update it.',
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Update the job post optimizer with edited content
    const updatedJobPostOptimizer = await prisma.jobPostOptimizer.update({
      where: { id: optimizerJobId },
      data: {
        editedContent: validatedData.editedContent,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job post updated successfully!',
      data: {
        id: updatedJobPostOptimizer.id,
        editedContent: updatedJobPostOptimizer.editedContent,
      },
    });
  } catch (error) {
    console.error('Update job post optimizer error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update job post. Please try again.' },
      { status: 500 }
    );
  }
}
