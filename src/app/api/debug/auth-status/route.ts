import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateNextAuthConfig } from '@/lib/auth/url-fix';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    // Get current session
    const session = await auth();
    
    // Validate configuration
    const configValidation = validateNextAuthConfig();
    
    // Check environment variables
    const envStatus = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Analyze session state
    const sessionAnalysis = {
      hasSession: !!session,
      hasUser: !!(session as any)?.user,
      hasUserId: !!((session as any)?.user as any)?.id,
      hasUserEmail: !!((session as any)?.user)?.email,
      hasUserRole: !!((session as any)?.user as any)?.role,
      userDetails: (session as any)?.user || null,
    };

    // Check for common issues
    const issues = [];
    const warnings = [];
    
    if (sessionAnalysis.hasSession && !sessionAnalysis.hasUserId) {
      issues.push('Session exists but user.id is missing');
    }
    
    if (sessionAnalysis.hasSession && !sessionAnalysis.hasUserEmail) {
      issues.push('Session exists but user.email is missing');
    }
    
    if (sessionAnalysis.hasSession && !sessionAnalysis.hasUserRole) {
      warnings.push('Session exists but user.role is missing');
    }
    
    if (!configValidation.isValid) {
      issues.push(...configValidation.issues);
    }

    const status = {
      timestamp: new Date().toISOString(),
      overall: issues.length === 0 ? 'HEALTHY' : 'ISSUES_DETECTED',
      environment: envStatus,
      configuration: configValidation,
      session: sessionAnalysis,
      issues,
      warnings,
      recommendations: [
        ...(issues.length > 0 ? ['Fix configuration issues listed above'] : []),
        ...(sessionAnalysis.hasSession && !sessionAnalysis.hasUserId ? ['Check JWT callback user data flow'] : []),
        ...(warnings.length > 0 ? ['Check session callback role assignment'] : []),
        ...configValidation.recommendations,
      ],
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Auth status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}