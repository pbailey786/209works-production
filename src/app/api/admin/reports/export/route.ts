import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Rate limiting store (in production, use Redis)
const exportRateLimit = new Map<string, { count: number; resetTime: number }>();

const exportRequestSchema = z.object({
  reportType: z.enum([
    'user_activity',
    'job_listings',
    'revenue_analytics',
    'system_performance',
    'application_analytics',
    'moderation_log',
    'advertisement_performance',
    'security_audit',
  ]),
  format: z.enum(['csv', 'excel', 'pdf']),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  filters: z.any().optional(),
});

// Rate limiting: 10 exports per hour per user
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = exportRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    exportRateLimit.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Data sanitization function
function sanitizeData(data: any[]): any[] {
  return data.map(row => {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Remove sensitive fields
      if (
        ['password', 'passwordHash', 'twoFactorSecret', 'resetToken'].includes(
          key
        )
      ) {
        continue;
      }

      // Sanitize email addresses (partial masking)
      if (key.toLowerCase().includes('email') && typeof value === 'string') {
        const [local, domain] = value.split('@');
        if (local && domain) {
          sanitized[key] = `${local.substring(0, 2)}***@${domain}`;
        } else {
          sanitized[key] = value;
        }
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  });
}

// Generate CSV content
function generateCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

// Generate Excel content (simplified - in production use a proper library like xlsx)
function generateExcel(data: any[]): Buffer {
  // For this demo, we'll return CSV content as Excel
  // In production, use libraries like 'xlsx' or 'exceljs'
  const csvContent = generateCSV(data);
  return Buffer.from(csvContent, 'utf-8');
}

// Generate PDF content (simplified - in production use a proper library like puppeteer)
function generatePDF(data: any[], reportType: string): Buffer {
  // For this demo, we'll return a simple text representation
  // In production, use libraries like 'puppeteer', 'jsPDF', or 'pdfkit'
  const reportTitle = reportType.replace(/_/g, ' ').toUpperCase();
  const content = `
${reportTitle} REPORT
Generated: ${new Date().toISOString()}
Total Records: ${data.length}

${data
  .slice(0, 10)
  .map(
    (row, index) =>
      `Record ${index + 1}:\n${Object.entries(row)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join('\n')}`
  )
  .join('\n\n')}

${data.length > 10 ? `\n... and ${data.length - 10} more records` : ''}
  `;

  return Buffer.from(content, 'utf-8');
}

async function generateReportData(
  reportType: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<any[]> {
  const baseWhere = {
    ...(dateFrom && { createdAt: { gte: dateFrom } }),
    ...(dateTo && { createdAt: { lte: dateTo } }),
  };

  switch (reportType) {
    case 'user_activity':
      return await prisma.user.findMany({
        where: baseWhere,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          isActive: true,
          profilePictureUrl: true,
          companyWebsite: true,
        },
        take: 10000, // Limit for performance
      });

    case 'job_listings':
      return await prisma.job.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          jobType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          postedAt: true,
        },
        take: 10000,
      });

    case 'application_analytics':
      return await prisma.jobApplication.findMany({
        where: {
          ...(dateFrom && { appliedAt: { gte: dateFrom } }),
          ...(dateTo && { appliedAt: { lte: dateTo } }),
        },
        select: {
          id: true,
          jobId: true,
          userId: true,
          status: true,
          appliedAt: true,
        },
        take: 10000,
      });

    case 'revenue_analytics':
      // Mock revenue data since we don't have a billing table in the schema
      return [
        {
          id: '1',
          date: new Date().toISOString(),
          revenue: 1250.0,
          subscriptions: 45,
          jobPostings: 123,
          premiumUsers: 28,
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          revenue: 980.5,
          subscriptions: 42,
          jobPostings: 98,
          premiumUsers: 26,
        },
      ];

    case 'system_performance':
      // Mock system performance data
      return [
        {
          timestamp: new Date().toISOString(),
          responseTime: 245,
          errorRate: 0.02,
          activeUsers: 1247,
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 34.1,
        },
      ];

    case 'moderation_log':
      // Mock moderation data since we don't have moderation logs in schema
      return [
        {
          id: '1',
          action: 'job_approved',
          moderatorId: 'admin-123',
          resourceId: 'job-456',
          timestamp: new Date().toISOString(),
          reason: 'Content meets guidelines',
        },
      ];

    case 'advertisement_performance':
      return await prisma.advertisement.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          impressions: true,
          clicks: true,
          bidding: true,
          currentSpend: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 10000,
      });

    case 'security_audit':
      // Mock security audit data
      return [
        {
          id: '1',
          event: 'failed_login',
          userId: 'user-123',
          ipAddress: '192.168.1.100',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        },
      ];

    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user?.role || 'guest';
    if (!hasPermission(userRole, Permission.EXPORT_REPORTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const userId = (session!.user as any)?.id;
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 exports per hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = exportRequestSchema.parse(body);

    const { reportType, format, dateFrom, dateTo } = validatedData;

    // Parse dates
    const parsedDateFrom = dateFrom ? new Date(dateFrom) : undefined;
    const parsedDateTo = dateTo ? new Date(dateTo) : undefined;

    // Generate report data
    const rawData = await generateReportData(
      reportType,
      parsedDateFrom,
      parsedDateTo
    );

    // Sanitize data
    const sanitizedData = sanitizeData(rawData);

    // Generate file content based on format
    let fileContent: Buffer;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'csv':
        fileContent = Buffer.from(generateCSV(sanitizedData), 'utf-8');
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'excel':
        fileContent = generateExcel(sanitizedData);
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;

      case 'pdf':
        fileContent = generatePDF(sanitizedData, reportType);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Log the export action
    console.log(`Report exported: ${reportType} (${format}) by user ${userId}`);

    // Return file
    const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
