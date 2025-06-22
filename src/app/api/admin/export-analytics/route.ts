import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users'; // users, jobs, applications, chat
    const format = searchParams.get('format') || 'csv'; // csv, json
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Date filtering
    const whereClause: any = {};
    if (dateFrom) {
      whereClause.createdAt = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      whereClause.createdAt = { 
        ...whereClause.createdAt, 
        lte: new Date(dateTo) 
      };
    }

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            onboardingCompleted: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        filename = `users-export-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'jobs':
        data = await prisma.job.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            status: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
            updatedAt: true,
            viewCount: true,
            jobApplications: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        // Add application count
        data = data.map(job => ({
          ...job,
          applicationCount: job.jobApplications.length,
          jobApplications: undefined, // Remove the applications array
        }));
        filename = `jobs-export-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'applications':
        data = await prisma.jobApplication.findMany({
          where: {
            appliedAt: whereClause.createdAt,
          },
          select: {
            id: true,
            appliedAt: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
            job: {
              select: {
                title: true,
                company: true,
                location: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        });
        // Flatten the data
        data = data.map(app => ({
          id: app.id,
          appliedAt: app.appliedAt,
          status: app.status,
          userEmail: app.user.email,
          userName: app.user.name,
          jobTitle: app.job.title,
          company: app.job.company,
          location: app.job.location,
        }));
        filename = `applications-export-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'chat':
        data = await prisma.chatAnalytics.findMany({
          where: whereClause,
          select: {
            id: true,
            question: true,
            response: true,
            jobsFound: true,
            responseTime: true,
            createdAt: true,
            sessionId: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        // Flatten the data
        data = data.map(chat => ({
          id: chat.id,
          question: chat.question,
          response: chat.response?.substring(0, 200) + '...', // Truncate response
          jobsFound: chat.jobsFound,
          responseTime: chat.responseTime,
          createdAt: chat.createdAt,
          sessionId: chat.sessionId,
          userEmail: chat.user?.email,
          userName: chat.user?.name,
        }));
        filename = `chat-analytics-export-${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 400 });
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle dates, nulls, and strings with commas
            if (value === null || value === undefined) return '';
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Return JSON
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
