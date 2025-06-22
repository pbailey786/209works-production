import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Also allow GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

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
      // Check if tables exist first
      const tableChecks = await Promise.allSettled([
        prisma.$queryRaw`SELECT to_regclass('public."SavedJob"') as exists`,
        prisma.$queryRaw`SELECT to_regclass('public."ChatHistory"') as exists`
      ]);

      const savedJobExists = tableChecks[0].status === 'fulfilled' &&
        Array.isArray(tableChecks[0].value) &&
        tableChecks[0].value[0]?.exists !== null;

      const chatHistoryExists = tableChecks[1].status === 'fulfilled' &&
        Array.isArray(tableChecks[1].value) &&
        tableChecks[1].value[0]?.exists !== null;

      results.migrations.push(`Table check: SavedJob exists: ${savedJobExists}, ChatHistory exists: ${chatHistoryExists}`);

      // Create SavedJob table if it doesn't exist
      if (!savedJobExists) {
        try {
          await prisma.$executeRaw`
            CREATE TABLE "SavedJob" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "jobId" TEXT NOT NULL,
              "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id"),
              CONSTRAINT "SavedJob_userId_jobId_key" UNIQUE ("userId", "jobId")
            );
          `;

          // Add foreign key constraints
          await prisma.$executeRaw`
            ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          `;

          await prisma.$executeRaw`
            ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey"
            FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          `;

          results.migrations.push('SavedJob table created successfully');
        } catch (error) {
          results.errors.push(`SavedJob table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        results.migrations.push('SavedJob table already exists');
      }

      // Create ChatHistory table if it doesn't exist
      if (!chatHistoryExists) {
        try {
          await prisma.$executeRaw`
            CREATE TABLE "ChatHistory" (
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
            ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          `;

          // Add indexes
          await prisma.$executeRaw`
            CREATE INDEX "ChatHistory_userId_idx" ON "ChatHistory"("userId");
          `;

          await prisma.$executeRaw`
            CREATE INDEX "ChatHistory_sessionId_idx" ON "ChatHistory"("sessionId");
          `;

          await prisma.$executeRaw`
            CREATE INDEX "ChatHistory_createdAt_idx" ON "ChatHistory"("createdAt");
          `;

          results.migrations.push('ChatHistory table created successfully');
        } catch (error) {
          results.errors.push(`ChatHistory table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        results.migrations.push('ChatHistory table already exists');
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
