import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import JSZip from 'jszip';
import type { Session } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { jobId, status } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Verify the job belongs to this employer
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        employerId: user.id,
      },
      select: {
        id: true,
        title: true,
        company: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Build query for applications
    const whereClause: any = {
      jobId: jobId,
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get applications with resume URLs
    const applications = await prisma.jobApplication.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            resumeUrl: true,
          },
        },
      },
    });

    // Filter applications that have resumes
    const applicationsWithResumes = applications.filter(
      app => app.resumeUrl || app.user.resumeUrl
    );

    if (applicationsWithResumes.length === 0) {
      return NextResponse.json(
        { error: 'No resumes found for the specified criteria' },
        { status: 404 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const resumeFolder = zip.folder(`${job.company}_${job.title}_Resumes`);

    // Download and add each resume to the ZIP
    const downloadPromises = applicationsWithResumes.map(async (application, index) => {
      try {
        const resumeUrl = application.resumeUrl || application.user.resumeUrl;
        if (!resumeUrl) return;

        // Fetch the resume file
        const response = await fetch(resumeUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch resume for ${application.user.name}: ${response.statusText}`);
          return;
        }

        const resumeBuffer = await response.arrayBuffer();
        
        // Determine file extension from URL or content type
        let extension = 'pdf'; // default
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('pdf')) {
          extension = 'pdf';
        } else if (contentType?.includes('word')) {
          extension = 'docx';
        } else if (contentType?.includes('text')) {
          extension = 'txt';
        } else {
          // Try to get extension from URL
          const urlParts = resumeUrl.split('.');
          if (urlParts.length > 1) {
            extension = urlParts[urlParts.length - 1].toLowerCase();
          }
        }

        // Create safe filename
        const candidateName = application.user.name || application.user.email.split('@')[0];
        const safeFileName = candidateName
          .replace(/[^a-zA-Z0-9\s-_]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50); // Limit length

        const fileName = `${safeFileName}_${application.user.id.substring(0, 8)}.${extension}`;
        
        resumeFolder?.file(fileName, resumeBuffer);
      } catch (error) {
        console.error(`Error processing resume for ${application.user.name}:`, error);
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Create filename for the ZIP
    const statusSuffix = status && status !== 'all' ? `_${status}` : '';
    const zipFileName = `${job.company}_${job.title}_Resumes${statusSuffix}.zip`
      .replace(/[^a-zA-Z0-9\s-_.]/g, '')
      .replace(/\s+/g, '_');

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error creating bulk resume download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
