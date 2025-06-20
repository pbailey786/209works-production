import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';


export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get backup statistics
    const [
      totalBackups,
      completedBackups,
      failedBackups,
      automatedBackups,
      manualBackups,
      lastBackup,
      lastAutomatedBackup,
      totalBackupSize
    ] = await Promise.all([
      // Total backups
      prisma.systemBackup.count(),
      
      // Completed backups
      prisma.systemBackup.count({
        where: { status: 'completed' }
      }),
      
      // Failed backups
      prisma.systemBackup.count({
        where: { status: 'failed' }
      }),
      
      // Automated backups
      prisma.systemBackup.count({
        where: { type: 'automated' }
      }),
      
      // Manual backups
      prisma.systemBackup.count({
        where: { type: 'manual' }
      }),
      
      // Last backup
      prisma.systemBackup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          status: true,
          type: true,
          size: true,
          createdAt: true,
          metadata: true
        }
      }),
      
      // Last automated backup
      prisma.systemBackup.findFirst({
        where: { type: 'automated' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          status: true,
          size: true,
          createdAt: true,
          metadata: true
        }
      }),
      
      // Total backup size
      prisma.systemBackup.aggregate({
        where: { status: 'completed' },
        _sum: { size: true }
      })
    ]);

    // Calculate next automated backup time (2 AM tomorrow)
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setDate(now.getDate() + 1);
    nextBackup.setHours(2, 0, 0, 0);

    // If it's already past 2 AM today, next backup is tomorrow
    if (now.getHours() < 2) {
      nextBackup.setDate(now.getDate());
    }

    // Check if automated backups are healthy (last automated backup within 25 hours)
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const isAutomatedBackupHealthy = lastAutomatedBackup && 
      new Date(lastAutomatedBackup.createdAt) > twentyFiveHoursAgo &&
      lastAutomatedBackup.status === 'completed';

    // Get recent backup history (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBackups = await prisma.systemBackup.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        status: true,
        type: true,
        size: true,
        createdAt: true
      }
    });

    // Calculate success rate
    const successRate = totalBackups > 0 ? (completedBackups / totalBackups) * 100 : 0;

    return NextResponse.json({
      success: true,
      status: {
        healthy: isAutomatedBackupHealthy,
        nextAutomatedBackup: nextBackup.toISOString(),
        lastBackupAge: lastBackup ? 
          Math.floor((Date.now() - new Date(lastBackup.createdAt).getTime()) / (1000 * 60 * 60)) : null
      },
      statistics: {
        total: totalBackups,
        completed: completedBackups,
        failed: failedBackups,
        automated: automatedBackups,
        manual: manualBackups,
        successRate: Math.round(successRate * 100) / 100,
        totalSize: totalBackupSize._sum.size || 0,
        averageSize: completedBackups > 0 ? 
          Math.round((totalBackupSize._sum.size || 0) / completedBackups) : 0
      },
      lastBackup: lastBackup ? {
        ...lastBackup,
        age: Math.floor((Date.now() - new Date(lastBackup.createdAt).getTime()) / (1000 * 60 * 60))
      } : null,
      lastAutomatedBackup: lastAutomatedBackup ? {
        ...lastAutomatedBackup,
        age: Math.floor((Date.now() - new Date(lastAutomatedBackup.createdAt).getTime()) / (1000 * 60 * 60))
      } : null,
      recentBackups: recentBackups.map(backup => ({
        ...backup,
        age: Math.floor((Date.now() - new Date(backup.createdAt).getTime()) / (1000 * 60 * 60))
      }))
    });

  } catch (error) {
    console.error('Error fetching backup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup status' },
      { status: 500 }
    );
  }
}
