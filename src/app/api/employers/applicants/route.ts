import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.emailAddresses?.[0]?.emailAddress) {
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
    const applications = await prisma.jobApplication.findMany({
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
        appliedAt: 'desc'
      }
    });

    // Transform applications to match the expected format
    const transformedApplicants = applications.map(application => ({
      id: application.id,
      name: application.user.name || 'Anonymous',
      email: application.user.email,
      jobTitle: application.job.title,
      appliedDate: application.appliedAt.toISOString().split('T')[0],
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
