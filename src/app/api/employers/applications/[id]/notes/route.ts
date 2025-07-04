import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { createNoteSchema, sanitizeNoteContent } from '@/lib/validation/notes';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = params.id;

    // Verify the application belongs to this employer's job
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          employerId: user.id
        }
      },
      include: {
        notes: {
          where: {
            deletedAt: null // Only fetch non-deleted notes
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      notes: application.notes.map(note => ({
        id: note.id,
        content: note.content,
        type: note.type,
        isPrivate: note.isPrivate,
        createdAt: note.createdAt.toISOString(),
        author: {
          id: note.author.id,
          name: note.author.name,
          email: note.author.email
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching application notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = params.id;
    
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Validate and sanitize input
    const validation = createNoteSchema.safeParse(requestBody);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      }, { status: 400 });
    }

    const { content, type, isPrivate } = validation.data;
    const sanitizedContent = sanitizeNoteContent(content);

    // Verify the application belongs to this employer's job
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          employerId: user.id
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create the note
    const note = await prisma.applicationNote.create({
      data: {
        content: sanitizedContent,
        type,
        isPrivate,
        applicationId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      note: {
        id: note.id,
        content: note.content,
        type: note.type,
        isPrivate: note.isPrivate,
        createdAt: note.createdAt.toISOString(),
        author: {
          id: note.author.id,
          name: note.author.name,
          email: note.author.email
        }
      }
    });
  } catch (error) {
    console.error('Error creating application note:', error);
    return NextResponse.json(
      { error: 'Failed to create application note' },
      { status: 500 }
    );
  }
}