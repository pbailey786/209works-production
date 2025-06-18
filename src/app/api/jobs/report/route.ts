import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/app/api/auth/prisma';
import type { Session } from 'next-auth';

interface JobReport {
  id: string;
  jobId: string;
  reason: string;
  reporterUserId?: string;
  reporterEmail?: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

// POST /api/jobs/report - Report a job posting
export async function POST(req: NextRequest) {
  try {
    const { jobId, reason, reporterUserId } = await req.json();

    if (!jobId || !reason) {
      return NextResponse.json(
        {
          error: 'Job ID and reason are required',
        },
        { status: 400 }
      );
    }

    // Validate reason length
    if (reason.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            'Please provide a more detailed reason (at least 10 characters)',
        },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get session for additional context
    const session = await getServerSession() as Session | null;

    // Get user ID from database if session exists
    let sessionUserId;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user?.email },
      });
      sessionUserId = user?.id;
    }

    // Create the report object
    const report: JobReport = {
      id: crypto.randomUUID(),
      jobId,
      reason: reason.trim(),
      reporterUserId: reporterUserId || sessionUserId,
      reporterEmail: session?.user?.email || undefined,
      reportedAt: new Date(),
      status: 'pending',
    };

    // For now, we'll log the report. In a production app, you'd want to:
    // 1. Store reports in a dedicated table
    // 2. Send notifications to moderators
    // 3. Implement a review system

    console.log('Job Report Submitted:', {
      reportId: report.id,
      jobId: report.jobId,
      jobTitle: job.title,
      jobCompany: job.company,
      reason: report.reason,
      reporterUserId: report.reporterUserId,
      reporterEmail: report.reporterEmail,
      reportedAt: report.reportedAt,
    });

    // You could also store in a simple JSON file or send to an external service
    // For production, consider:
    // - Creating a JobReport model in Prisma schema
    // - Sending email notifications to moderators
    // - Implementing automated flagging for certain keywords

    try {
      // Optional: Store in a simple log file for demonstration
      const fs = require('fs').promises;
      const path = require('path');
      const logPath = path.join(process.cwd(), 'job-reports.log');

      const logEntry = `${new Date().toISOString()} - Report ID: ${report.id} - Job: ${job.title} at ${job.company} (${jobId}) - Reason: ${report.reason} - Reporter: ${report.reporterUserId || 'anonymous'}\n`;

      await fs.appendFile(logPath, logEntry);
    } catch (fileError) {
      // Don't fail the request if logging fails
      console.error('Failed to write to log file:', fileError);
    }

    return NextResponse.json({
      success: true,
      message:
        'Report submitted successfully. Thank you for helping us maintain job quality.',
      reportId: report.id,
    });
  } catch (error) {
    console.error('Error reporting job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
