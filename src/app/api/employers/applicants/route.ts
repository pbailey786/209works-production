import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    // Fetch applications to this employer's jobs
    const applications = await prisma.application.findMany({
      where: {
        job: {
          employerId: user.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
          }
        },
        job: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform applications to match the expected format
    const transformedApplicants = applications.map(application => ({
      id: application.id,
      name: application.user.name || 'Anonymous',
      email: application.user.email,
      jobTitle: application.job.title,
      appliedDate: application.createdAt.toISOString().split('T')[0],
      status: application.status || 'new',
      matchScore: 85, // TODO: Implement match scoring
      location: application.user.location || 'Not specified',
    }));

    return NextResponse.json({
      applicants: transformedApplicants,
      total: applications.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching employer applicants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer applicants' },
      { status: 500 }
    );
  }
}
