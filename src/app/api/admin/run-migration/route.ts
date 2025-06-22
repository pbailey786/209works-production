import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

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
      // Create SavedJob table
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "SavedJob" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "jobId" TEXT NOT NULL,
              "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
          );
        `;
        results.migrations.push('SavedJob table created successfully');
      } catch (error) {
        results.errors.push(`SavedJob table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Create ChatHistory table
      try {
        await prisma.$executeRaw`
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
        results.migrations.push('ChatHistory table created successfully');
      } catch (error) {
        results.errors.push(`ChatHistory table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Add indexes and constraints
      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes
              WHERE indexname = 'SavedJob_userId_jobId_key'
            ) THEN
              CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");
            END IF;
          END $$;
        `;
        results.migrations.push('SavedJob unique index created');
      } catch (e) {
        results.migrations.push(`SavedJob unique index: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes
              WHERE indexname = 'ChatHistory_userId_idx'
            ) THEN
              CREATE INDEX "ChatHistory_userId_idx" ON "ChatHistory"("userId");
            END IF;
          END $$;
        `;
        results.migrations.push('ChatHistory userId index created');
      } catch (e) {
        results.migrations.push(`ChatHistory userId index: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes
              WHERE indexname = 'ChatHistory_sessionId_idx'
            ) THEN
              CREATE INDEX "ChatHistory_sessionId_idx" ON "ChatHistory"("sessionId");
            END IF;
          END $$;
        `;
        results.migrations.push('ChatHistory sessionId index created');
      } catch (e) {
        results.migrations.push(`ChatHistory sessionId index: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes
              WHERE indexname = 'ChatHistory_createdAt_idx'
            ) THEN
              CREATE INDEX "ChatHistory_createdAt_idx" ON "ChatHistory"("createdAt");
            END IF;
          END $$;
        `;
        results.migrations.push('ChatHistory createdAt index created');
      } catch (e) {
        results.migrations.push(`ChatHistory createdAt index: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      // Add foreign key constraints
      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'SavedJob_userId_fkey'
            ) THEN
              ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
          END $$;
        `;
        results.migrations.push('SavedJob userId foreign key added');
      } catch (e) {
        results.migrations.push(`SavedJob userId foreign key: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'SavedJob_jobId_fkey'
            ) THEN
              ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey"
              FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
          END $$;
        `;
        results.migrations.push('SavedJob jobId foreign key added');
      } catch (e) {
        results.migrations.push(`SavedJob jobId foreign key: ${e instanceof Error ? e.message : 'Already exists'}`);
      }

      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'ChatHistory_userId_fkey'
            ) THEN
              ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
          END $$;
        `;
        results.migrations.push('ChatHistory userId foreign key added');
      } catch (e) {
        results.migrations.push(`ChatHistory userId foreign key: ${e instanceof Error ? e.message : 'Already exists'}`);
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
