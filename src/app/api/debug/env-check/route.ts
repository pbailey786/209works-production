import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    // Only allow admins or during development
    if (!user?.emailAddresses?.[0]?.emailAddress || (session.user as any).role !== 'admin') {
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