import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { withValidation } from '@/lib/middleware/validation';
import { prisma } from '@/lib/database/prisma';

// Validation schemas
const createAlertSchema = z.object({
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
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  emailEnabled: z.boolean().default(true)
});

// GET /api/alerts - List user's alerts
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! }
    });
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! }
    });

    if (!userRecord?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createAlertSchema.parse(body);

    // Check if user already has maximum alerts (optional business rule)
    const alertCount = await prisma.alert.count({
      where: { userId: userRecord.id, isActive: true }
    });

    if (alertCount >= 10) {
      // Max 10 active alerts per user
      return NextResponse.json(
        { error: 'Maximum number of alerts reached (10)' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: userRecord.id,
        ...validatedData
      }
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: Alternative middleware handlers removed for Next.js compatibility
