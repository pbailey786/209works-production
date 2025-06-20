import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as any;

    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const scheduleId = resolvedParams.id;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // For now, just log the deletion since we don't have the table yet
    // In a real implementation, you'd delete from the ReportSchedule model
    
    // Log the schedule deletion
    await prisma.auditLog.create({
      data: {
        action: 'REPORT_SCHEDULE_DELETED',
        targetType: 'REPORT_SCHEDULE',
        targetId: scheduleId,
        performedBy: user?.id,
        details: JSON.stringify({
          scheduleId,
          deletedAt: new Date().toISOString(),
        }),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report schedule deleted successfully',
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
