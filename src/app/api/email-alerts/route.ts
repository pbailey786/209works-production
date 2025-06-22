import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '../auth/prisma';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Validation schemas for the new email alert system
const createEmailAlertSchema = z.object({
  type: z.enum([
    'job_title_alert',
    'weekly_digest',
    'job_category_alert',
    'location_alert',
    'company_alert',
  ]),
  frequency: z
    .enum(['immediate', 'daily', 'weekly', 'monthly'])
    .default('immediate'),
  jobTitle: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  location: z.string().optional(),
  categories: z.array(z.string()).default([]),
  jobTypes: z
    .array(
      z.enum([
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
        'volunteer',
        'other',
      ])
    )
    .default([]),
  companies: z.array(z.string()).default([]),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  emailEnabled: z.boolean().default(true),
});

const updateEmailAlertSchema = createEmailAlertSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/email-alerts - List user's email alerts
export async function GET(req: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');

    const whereClause: any = { userId: user.id };

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            jobs: true,
            emailLogs: true,
          },
        },
      },
    });

    // Get email statistics
    const emailStats = await prisma.emailLog.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        emailType: 'job_alert',
      },
      _count: true,
    });

    return NextResponse.json({
      alerts,
      stats: {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.isActive).length,
        emailStats: emailStats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error('Get email alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/email-alerts - Create new email alert
export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session

    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createEmailAlertSchema.parse(body);

    // Business rules validation
    const alertCount = await prisma.alert.count({
      where: { userId: user.id, isActive: true },
    });

    if (alertCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of alerts reached (10)' },
        { status: 400 }
      );
    }

    // Validate salary range
    if (
      validatedData.salaryMin &&
      validatedData.salaryMax &&
      validatedData.salaryMin > validatedData.salaryMax
    ) {
      return NextResponse.json(
        { error: 'Minimum salary cannot be greater than maximum salary' },
        { status: 400 }
      );
    }

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Email alert created successfully',
        alert,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create email alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/email-alerts - Bulk update alerts (e.g., enable/disable all)
export async function PATCH(req: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session

    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, alertIds } = body;

    if (action === 'toggleAll') {
      const { isActive } = body;

      await prisma.alert.updateMany({
        where: {
          userId: user.id,
          ...(alertIds ? { id: { in: alertIds } } : {}),
        },
        data: { isActive },
      });

      return NextResponse.json({
        message: `Alerts ${isActive ? 'enabled' : 'disabled'} successfully`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk update email alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
