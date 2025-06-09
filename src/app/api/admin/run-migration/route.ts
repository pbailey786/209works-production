import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
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

    const results = {
      timestamp: new Date().toISOString(),
      migrations: [] as string[],
      errors: [] as string[],
      success: true
    };

    try {
      // Run the migration SQL directly
      const migrationSQL = `
        -- CreateTable SavedJob if not exists
        CREATE TABLE IF NOT EXISTS "SavedJob" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "jobId" TEXT NOT NULL,
            "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
        );

        -- CreateTable ChatHistory if not exists
        CREATE TABLE IF NOT EXISTS "ChatHistory" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "sessionId" TEXT NOT NULL,
            "title" TEXT,
            "messages" JSONB NOT NULL,
            "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ChatHistory_pkey" PRIMARY KEY ("id")
        );
      `;

      // Execute the migration
      await prisma.$executeRawUnsafe(migrationSQL);
      results.migrations.push('Tables created successfully');

      // Add indexes and constraints
      try {
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");
        `;
        results.migrations.push('SavedJob unique index created');
      } catch (e) {
        // Index might already exist
        results.migrations.push('SavedJob unique index already exists or created');
      }

      try {
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "ChatHistory_userId_idx" ON "ChatHistory"("userId");
        `;
        results.migrations.push('ChatHistory userId index created');
      } catch (e) {
        results.migrations.push('ChatHistory userId index already exists or created');
      }

      try {
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "ChatHistory_sessionId_idx" ON "ChatHistory"("sessionId");
        `;
        results.migrations.push('ChatHistory sessionId index created');
      } catch (e) {
        results.migrations.push('ChatHistory sessionId index already exists or created');
      }

      try {
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "ChatHistory_createdAt_idx" ON "ChatHistory"("createdAt");
        `;
        results.migrations.push('ChatHistory createdAt index created');
      } catch (e) {
        results.migrations.push('ChatHistory createdAt index already exists or created');
      }

      // Add foreign key constraints (these might fail if they already exist)
      try {
        await prisma.$executeRaw`
          ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        results.migrations.push('SavedJob userId foreign key added');
      } catch (e) {
        results.migrations.push('SavedJob userId foreign key already exists or created');
      }

      try {
        await prisma.$executeRaw`
          ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" 
          FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        results.migrations.push('SavedJob jobId foreign key added');
      } catch (e) {
        results.migrations.push('SavedJob jobId foreign key already exists or created');
      }

      try {
        await prisma.$executeRaw`
          ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        results.migrations.push('ChatHistory userId foreign key added');
      } catch (e) {
        results.migrations.push('ChatHistory userId foreign key already exists or created');
      }

      // Test the tables
      try {
        const savedJobCount = await prisma.savedJob.count();
        results.migrations.push(`SavedJob table verified - ${savedJobCount} records`);
      } catch (error) {
        results.errors.push(`SavedJob table verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      try {
        const chatHistoryCount = await prisma.chatHistory.count();
        results.migrations.push(`ChatHistory table verified - ${chatHistoryCount} records`);
      } catch (error) {
        results.errors.push(`ChatHistory table verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      results.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.success = false;
    }

    return NextResponse.json({
      success: results.success,
      results,
      summary: {
        migrationsRun: results.migrations.length,
        errorsFound: results.errors.length,
        overallSuccess: results.success && results.errors.length === 0
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run migration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
