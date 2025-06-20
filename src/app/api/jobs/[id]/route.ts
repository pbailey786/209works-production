import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { JobType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

function isValidJobType(type: any): type is JobType {
  return Object.values(JobType).includes(type);
}

// GET /api/jobs/:id - Get job by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const job = await prisma.job.findUnique({ where: { id: (await params).id } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }
  return NextResponse.json({ job });
}

// PUT /api/jobs/:id - Update job by ID (admin or employer only)
export async function PUT(
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

    // Get user and verify they're an admin or employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || !['admin', 'employer'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
  const updateData: any = {};
  const allowedFields = [
    'title',
    'description',
    'company',
    'location',
    'type',
    'salaryMin',
    'salaryMax',
    'categories',
    'source',
    'url',
    'postedAt',
  ];
  for (const key of allowedFields) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }
  // Validate type if present
  if (updateData.type && !isValidJobType(updateData.type)) {
    return NextResponse.json({ error: 'Invalid job type.' }, { status: 400 });
  }
  // Validate categories if present
  if (updateData.categories && !Array.isArray(updateData.categories)) {
    return NextResponse.json(
      { error: 'Categories must be an array.' },
      { status: 400 }
    );
  }
  // Convert postedAt to Date if present
  if (updateData.postedAt) {
    updateData.postedAt = new Date(updateData.postedAt);
  }
    try {
      const job = await prisma.job.update({
        where: { id: (await params).id },
        data: updateData,
      });
      return NextResponse.json({ job });
    } catch (err) {
      return NextResponse.json(
        { error: 'Job not found or update failed.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/:id - Delete job by ID (admin or employer only)
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

    // Get user and verify they're an admin or employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || !['admin', 'employer'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const { DataIntegrityService } = await import(
        '@/lib/database/data-integrity'
      );
      const deletionResult = await DataIntegrityService.softDeleteJob(
        (await params).id,
        user.id,
        'API deletion request'
      );

      if (!deletionResult.success) {
        return NextResponse.json(
          {
            error: deletionResult.errors?.[0] || 'Failed to delete job safely',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Job deleted successfully',
        auditRecordCreated: deletionResult.auditRecordCreated,
      });
    } catch (err) {
      return NextResponse.json(
        { error: 'Job not found or delete failed.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
