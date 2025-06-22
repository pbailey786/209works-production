import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import { InstagramAlertType } from '@prisma/client';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

const createAlertSchema = z.object({
  alertType: z.nativeEnum(InstagramAlertType),
  threshold: z.number().min(0).max(100),
  comparison: z.enum(['above', 'below', 'equal']).default('below'),
  emailNotification: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

const updateAlertSchema = z.object({
  id: z.string(),
  threshold: z.number().min(0).max(100).optional(),
  emailNotification: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's engagement alerts
    const alerts = await prisma.instagramEngagementAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching engagement alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createAlertSchema.parse(body);

    // Check if user already has an alert of this type
    const existingAlert = await prisma.instagramEngagementAlert.findFirst({
      where: {
        userId: user.id,
        alertType: validatedData.alertType,
      },
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: 'Alert of this type already exists for user' },
        { status: 409 }
      );
    }

    // Create new engagement alert
    const alert = await prisma.instagramEngagementAlert.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    return NextResponse.json(
      {
        success: true,
        alert,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating engagement alert:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create engagement alert' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    // Verify the alert belongs to the user
    const existingAlert = await prisma.instagramEngagementAlert.findFirst({
      where: {
        id: validatedData.id,
        userId: user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Update the alert
    const { id, ...updateData } = validatedData;
    const updatedAlert = await prisma.instagramEngagementAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });
  } catch (error) {
    console.error('Error updating engagement alert:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update engagement alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Verify the alert belongs to the user
    const existingAlert = await prisma.instagramEngagementAlert.findFirst({
      where: {
        id: alertId,
        userId: user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the alert
    await prisma.instagramEngagementAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting engagement alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete engagement alert' },
      { status: 500 }
    );
  }
}
