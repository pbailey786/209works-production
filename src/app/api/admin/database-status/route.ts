import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    // Only allow admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const status = {
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: {} as Record<string, any>,
      errors: [] as string[]
    };

    // Check all tables
    const tableNames = [
      'User', 'Job', 'JobApplication', 'Company', 'ChatAnalytics',
      'SavedJob', 'ChatHistory', 'AuditLog'
    ];

    for (const tableName of tableNames) {
      try {
        let count = 0;
        let exists = false;

        switch (tableName) {
          case 'User':
            count = await prisma.user.count();
            exists = true;
            break;
          case 'Job':
            count = await prisma.job.count();
            exists = true;
            break;
          case 'JobApplication':
            count = await prisma.jobApplication.count();
            exists = true;
            break;
          case 'Company':
            count = await prisma.company.count();
            exists = true;
            break;
          case 'ChatAnalytics':
            count = await prisma.chatAnalytics.count();
            exists = true;
            break;
          case 'AuditLog':
            count = await prisma.auditLog.count();
            exists = true;
            break;
          case 'SavedJob':
            try {
              count = await prisma.savedJob.count();
              exists = true;
            } catch (e) {
              exists = false;
              status.errors.push(`SavedJob table does not exist: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
            break;
          case 'ChatHistory':
            try {
              count = await prisma.chatHistory.count();
              exists = true;
            } catch (e) {
              exists = false;
              status.errors.push(`ChatHistory table does not exist: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
            break;
        }

        status.tables[tableName] = {
          exists,
          count: exists ? count : 'N/A'
        };

      } catch (error) {
        status.tables[tableName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        status.errors.push(`Error checking ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      status.database = 'connected';
    } catch (error) {
      status.database = 'disconnected';
      status.errors.push(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: status.errors.length === 0,
      status,
      summary: {
        totalTables: Object.keys(status.tables).length,
        existingTables: Object.values(status.tables).filter(t => t.exists).length,
        missingTables: Object.values(status.tables).filter(t => !t.exists).length,
        errors: status.errors.length
      }
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check database status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
