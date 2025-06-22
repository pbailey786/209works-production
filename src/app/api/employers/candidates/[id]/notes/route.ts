import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { Session } from 'next-auth';

// POST /api/employers/candidates/:id/notes - Add note to candidate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = (await params).id;
    const { note } = await request.json();

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    // Fetch the application to verify ownership
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            employerId: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the application belongs to this employer's job
    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, we'll store notes in the coverLetter field as a workaround
    // TODO: Add a proper notes field to JobApplication model
    const timestamp = new Date().toISOString();
    const newNoteEntry = `[EMPLOYER NOTE - ${timestamp}] ${note}`;
    const existingContent = application.coverLetter || '';

    // Separate existing cover letter from notes
    const notesSection = existingContent.includes('[EMPLOYER NOTE')
      ? existingContent.split('[EMPLOYER NOTE')[0].trim()
      : existingContent;

    const existingNotes = existingContent.includes('[EMPLOYER NOTE')
      ? '[EMPLOYER NOTE' + existingContent.split('[EMPLOYER NOTE').slice(1).join('[EMPLOYER NOTE')
      : '';

    const updatedContent = existingNotes
      ? `${notesSection}\n\n${existingNotes}\n\n${newNoteEntry}`
      : `${notesSection}\n\n${newNoteEntry}`;

    // Update the application with the new note
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { coverLetter: updatedContent.trim() },
    });

    return NextResponse.json({
      success: true,
      notes: updatedApplication.coverLetter
    });
  } catch (error) {
    console.error('Error adding note to candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
