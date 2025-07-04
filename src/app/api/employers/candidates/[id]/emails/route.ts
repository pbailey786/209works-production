import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/employers/candidates/:id/emails - Get email history for a candidate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const candidateId = (await params).id;

    // Fetch email history for this candidate
    const emailHistory = await prisma.emailLog.findMany({
      where: {
        userId: user.id,
        emailType: 'employer_candidate_communication',
        // JSON query for candidateId in metadata field
        AND: [
          {
            metadata: {
              path: ['candidateId'],
              equals: candidateId,
            },
          },
        ],
      },
      orderBy: {
        sentAt: 'desc',
      },
      select: {
        id: true,
        subject: true,
        sentAt: true,
        templateName: true,
        status: true,
        toEmail: true,
      },
    });

    // Transform for frontend
    const emails = emailHistory.map((email: any) => ({
      id: email.id,
      subject: email.subject,
      sentAt: email.sentAt?.toISOString() || null,
      templateUsed: email.templateName,
      status: email.status,
    }));

    return NextResponse.json({ emails });

  } catch (error) {
    console.error('Error fetching email history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}