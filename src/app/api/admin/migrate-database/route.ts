import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

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
      // Create SavedJob table if it doesn't exist
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
        
        // Add foreign key constraints if they don't exist
        await prisma.$executeRaw`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'SavedJob_userId_fkey'
            ) THEN
              ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" 
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
          END $$;
        `;

        await prisma.$executeRaw`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'SavedJob_jobId_fkey'
            ) THEN
              ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" 
              FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
          END $$;
        `;

        // Add unique constraint
        await prisma.$executeRaw`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'SavedJob_userId_jobId_key'
            ) THEN
              ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_jobId_key" 
              UNIQUE ("userId", "jobId");
            END IF;
          END $$;
        `;

        results.migrations.push('SavedJob table created successfully');
      } catch (error) {
        results.errors.push(`SavedJob table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Create ChatHistory table if it doesn't exist
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "ChatHistory" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "sessionId" TEXT NOT NULL,
            "messages" JSONB NOT NULL,
            "title" TEXT,
            "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ChatHistory_pkey" PRIMARY KEY ("id")
          );
        `;

        // Add foreign key constraint
        await prisma.$executeRaw`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'ChatHistory_userId_fkey'
            ) THEN
              ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_userId_fkey" 
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
          END $$;
        `;

        results.migrations.push('ChatHistory table created successfully');
      } catch (error) {
        results.errors.push(`ChatHistory table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Verify tables were created by testing counts
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
    console.error('Database migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run database migration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
