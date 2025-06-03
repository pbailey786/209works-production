import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';
import { JobType } from '@prisma/client';
import { requireRole } from '../../auth/requireRole';

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
  const session = await requireRole(req, ['admin', 'employer']);
  if (session instanceof NextResponse) return session;
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
}

// DELETE /api/jobs/:id - Delete job by ID (admin or employer only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole(req, ['admin', 'employer']);
  if (session instanceof NextResponse) return session;

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
}
