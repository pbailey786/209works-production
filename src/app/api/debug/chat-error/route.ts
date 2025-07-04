import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: { status: 'pending', error: null },
      openai: { status: 'pending', configured: false },
      anthropic: { status: 'pending', configured: false },
      features: { status: 'pending', ai_enabled: false, clerk_enabled: false },
      authentication: { status: 'pending', error: null },
    },
  };

  // Check database connection
  try {
    const jobCount = await prisma.job.count();
    results.checks.database = { 
      status: 'connected', 
      error: null,
      jobCount 
    };
  } catch (error) {
    results.checks.database = { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }

  // Check OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY;
  results.checks.openai = {
    status: openaiKey ? 'configured' : 'missing',
    configured: !!openaiKey,
    keyPrefix: openaiKey ? openaiKey.substring(0, 7) + '...' : 'not set',
  };

  // Check Anthropic configuration
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  results.checks.anthropic = {
    status: anthropicKey ? 'configured' : 'missing',
    configured: !!anthropicKey,
    keyPrefix: anthropicKey ? anthropicKey.substring(0, 7) + '...' : 'not set',
  };

  // Check feature flags
  results.checks.features = {
    status: 'ok',
    ai_enabled: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    clerk_enabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
    ai_skill_suggestions: process.env.NEXT_PUBLIC_ENABLE_AI_SKILL_SUGGESTIONS === 'true',
  };

  // Check authentication
  try {
    // Check if Clerk environment variables are set
    const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    
    results.checks.authentication = {
      status: 'configured',
      clerk_publishable_set: !!clerkPublishable,
      clerk_secret_set: !!clerkSecret,
      clerk_enabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
    };
  } catch (error) {
    results.checks.authentication = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown auth error',
    };
  }

  // Overall status
  const hasErrors = Object.values(results.checks).some(
    (check: any) => check.status === 'error'
  );
  results.overallStatus = hasErrors ? 'error' : 'ok';

  return NextResponse.json(results, { status: 200 });
}