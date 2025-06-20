import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import { validateStripeConfig } from '@/lib/stripe';
import type { Session } from 'next-auth';

/**
 * Debug route to help troubleshoot session and authentication issues
 * Only available in development or for admin users
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 Debug session route called');

    // Get session information - NextAuth v5 beta
    const session = await auth() as Session | null;
    
    // Basic session info
    const sessionInfo = {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      hasId: !!(session?.user as any)?.id,
      hasName: !!session?.user?.name,
      hasRole: !!(session?.user as any)?.role,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      userName: session?.user?.name,
      userRole: (session?.user as any)?.role,
      userImage: session?.user?.image
    };
    
    // Database user lookup if we have an email
    let dbUserInfo = null;
    if (session?.user?.email) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            onboardingCompleted: true,
            twoFactorEnabled: true,
            isEmailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            isActive: true,
            stripeCustomerId: true,
            currentTier: true,
            subscriptionEndsAt: true
          }
        });
        
        dbUserInfo = {
          found: !!dbUser,
          ...dbUser
        };
      } catch (dbError) {
        dbUserInfo = {
          found: false,
          error: (dbError as Error).message
        };
      }
    }
    
    // Environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PRICE_STARTER: !!process.env.STRIPE_PRICE_STARTER,
      STRIPE_PRICE_STANDARD: !!process.env.STRIPE_PRICE_STANDARD,
      STRIPE_PRICE_PID: !!process.env.STRIPE_PRICE_PID
    };
    
    // Stripe configuration check
    const stripeValidation = validateStripeConfig();
    
    // Request info
    const requestInfo = {
      url: request.url,
      method: request.method,
      headers: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin')
      },
      cookies: {
        hasNextAuthSession: request.cookies.has('next-auth.session-token') || request.cookies.has('__Secure-next-auth.session-token'),
        hasNextAuthCSRF: request.cookies.has('next-auth.csrf-token') || request.cookies.has('__Secure-next-auth.csrf-token'),
        cookieCount: request.cookies.size
      }
    };
    
    // System health check
    let dbHealth = 'unknown';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealth = 'healthy';
    } catch (dbError) {
      dbHealth = 'error: ' + (dbError as Error).message;
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      queryTime: Date.now() - startTime,
      session: sessionInfo,
      database: {
        health: dbHealth,
        user: dbUserInfo
      },
      environment: envCheck,
      stripe: stripeValidation,
      request: requestInfo,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    };
    
    // Only allow in development or for admin users
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAdmin = (session?.user as any)?.role === 'admin';
    
    if (!isDevelopment && !isAdmin) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Debug endpoint only available in development or for admin users'
      }, { status: 403 });
    }
    
    console.log('✅ Debug session info compiled successfully');
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Error in debug session route:', error);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to compile debug information',
      timestamp: new Date().toISOString(),
      queryTime: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * POST endpoint to test session refresh
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'refresh') {
      // Simply return current session info
      return GET(request);
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      availableActions: ['refresh']
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in debug session POST:', error);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to process debug action'
    }, { status: 500 });
  }
}
