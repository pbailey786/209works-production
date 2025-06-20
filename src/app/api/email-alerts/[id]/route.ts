import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../auth/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Validation schema for updating alerts
const updateEmailAlertSchema = z.object({
  type: z
    .enum([
      'job_title_alert',
      'weekly_digest',
      'job_category_alert',
      'location_alert',
      'company_alert',
    ])
    .optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).optional(),
  jobTitle: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  location: z.string().optional(),
  categories: z.array(z.string()).optional(),
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
    .optional(),
  companies: z.array(z.string()).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  emailEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/email-alerts/[id] - Get specific alert
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alert = await prisma.alert.findFirst({
      where: {
        id: (await params).id,
        userId: user.id, // Ensure user owns this alert
      },
      include: {
        _count: {
          select: {
            jobs: true,
            emailLogs: true,
          },
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 email logs
          select: {
            id: true,
            subject: true,
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Get email alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/email-alerts/[id] - Update specific alert
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify alert exists and belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: (await params).id,
        userId: user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateEmailAlertSchema.parse(body);

    // Validate salary range if both are provided
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

    // Update the alert
    const updatedAlert = await prisma.alert.update({
      where: { id: (await params).id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Alert updated successfully',
      alert: updatedAlert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update email alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/email-alerts/[id] - Delete specific alert
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify alert exists and belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: (await params).id,
        userId: user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Delete the alert (cascade will handle related records)
    await prisma.alert.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Delete email alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
