import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;
    
    // Only allow admins or during development
    if (!session?.user?.email || (session.user as any).role !== 'admin') {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const envChecks = {
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        format: process.env.OPENAI_API_KEY ? 
          (process.env.OPENAI_API_KEY.startsWith('sk-') ? 'Valid format' : 'Invalid format') 
          : 'Not set',
        length: process.env.OPENAI_API_KEY?.length || 0,
      },
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        format: process.env.DATABASE_URL ? 'Set' : 'Not set',
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        format: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      },
      NODE_ENV: {
        exists: !!process.env.NODE_ENV,
        value: process.env.NODE_ENV,
      },
    };

    const allGood = Object.values(envChecks).every(check => check.exists);

    return NextResponse.json({
      status: allGood ? 'healthy' : 'issues_found',
      environment: process.env.NODE_ENV,
      checks: envChecks,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
} 