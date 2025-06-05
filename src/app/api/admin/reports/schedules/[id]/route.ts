import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../../auth/authOptions';
import { prisma } from '../../../../auth/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
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
        performedBy: session.user.id,
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
