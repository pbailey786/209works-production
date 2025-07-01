import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {
      job: {
        employerId: user.id
      }
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            skills: {
              hasSome: [search.trim()]
            }
          }
        }
      ];
    }

    // Fetch applications with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.jobApplication.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              location: true,
              skills: true,
              currentJobTitle: true,
              experienceLevel: true,
              resumeUrl: true,
              bio: true,
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          appliedAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.jobApplication.count({
        where: whereClause,
      })
    ]);

    // Get status summary
    const statusSummary = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        job: {
          employerId: user.id
        }
      },
      _count: {
        status: true,
      },
    });

    const statusCounts = statusSummary.reduce((acc, item) => {
      acc[item.status || 'pending'] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Transform applications to match frontend interface
    const transformedApplications = applications.map(application => ({
      id: application.id,
      status: application.status || 'pending',
      appliedAt: application.appliedAt.toISOString(),
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      notes: application.notes,
      job: {
        id: application.job.id,
        title: application.job.title,
        company: application.job.company,
        location: application.job.location,
        jobType: application.job.jobType || 'full-time',
        postedAt: application.job.createdAt.toISOString(),
      },
      user: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        phoneNumber: application.user.phoneNumber,
        resumeUrl: application.user.resumeUrl,
        bio: application.user.bio,
        skills: application.user.skills || [],
        experience: application.user.experienceLevel,
        location: application.user.location,
      }
    }));

    return NextResponse.json({
      applications: transformedApplications,
      statusSummary: statusCounts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer applications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { applicationId, status } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    return NextResponse.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
}