import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Schema for adding notes to applicant
const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
  tags: z.array(z.string()).optional(),
});

// GET /api/employers/applicants/[id] - Get detailed applicant information
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
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Get application with full details
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            description: true,
            postedAt: true,
            employerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            resumeUrl: true,
            bio: true,
            skills: true,
            location: true,
            linkedinUrl: true,

            phoneNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the application belongs to this employer's job
    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get other applications from this user to this employer's jobs
    const otherApplications = await prisma.jobApplication.findMany({
      where: {
        userId: application.userId,
        job: {
          employerId: user.id,
        },
        id: {
          not: applicationId,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            postedAt: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({
      application,
      otherApplications,
      applicantProfile: application.user,
    });
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicant details' },
      { status: 500 }
    );
  }
}

// POST /api/employers/applicants/[id] - Add note or tag to applicant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { id: true, role: true, name: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const body = await request.json();
    const validatedData = addNoteSchema.parse(body);

    // Verify the application belongs to this employer's job
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            employerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add note to application (commented out until notes field is added to schema)
    // const updatedApplication = await prisma.jobApplication.update({
    //   where: { id: applicationId },
    //   data: {
    //     notes: validatedData.note,
    //     // If tags are provided, we could store them in a separate field or table
    //     // For now, we'll append them to the notes
    //     ...(validatedData.tags && validatedData.tags.length > 0 && {
    //       notes: `${validatedData.note}\n\nTags: ${validatedData.tags.join(', ')}`,
    //     }),
    //   },
    // });

    // Log the note addition (commented out)
    // await prisma.auditLog
    //   .create({
    //     data: {
    //       userId: user.id,
    //       action: 'applicant_note_added',
    //       resource: 'job_application',
    //       resourceId: applicationId,
    //       details: {
    //         applicationId,
    //         jobId: application.job.id,
    //         jobTitle: application.job.title,
    //         applicantId: application.user.id,
    //         applicantName: application.user.name,
    //         note: validatedData.note,
    //         tags: validatedData.tags,
    //         addedBy: user.name || user.id,
    //         addedAt: new Date().toISOString(),
    //       },
    //     },
    //   })
    //   .catch(error => {
    //     console.error('Failed to log note addition:', error);
    //   });

    return NextResponse.json({
      success: true,
      message: 'Note functionality temporarily disabled - schema update needed',
    });
  } catch (error) {
    console.error('Error adding note to applicant:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}
