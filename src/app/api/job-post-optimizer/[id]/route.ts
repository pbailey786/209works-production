import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk
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
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
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
