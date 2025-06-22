import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { isResumeParsingAvailable, getEnvironmentConfig } from '@/lib/env-validation';
import { isValidResumeFile } from '@/lib/fileUpload';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 MINIMAL DEBUG: Starting resume parse test');

    // Step 1: Test environment availability
    console.log('🔍 STEP 1: Testing environment...');
    const isAvailable = isResumeParsingAvailable();
    const config = getEnvironmentConfig();
    
    if (!isAvailable) {
      return NextResponse.json({
        error: 'Environment check failed',
        debug: {
          step: 'environment',
          isAvailable,
          config
        }
      }, { status: 503 });
    }

    // Step 2: Test authentication
    console.log('🔍 STEP 2: Testing authentication...');
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Authentication failed',
        debug: {
          step: 'authentication',
          hasSession: !!session,
          hasEmail: !!session?.user?.email
        }
      }, { status: 401 });
    }

    // Step 3: Test file upload
    console.log('🔍 STEP 3: Testing file upload...');
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        debug: { step: 'file_upload' }
      }, { status: 400 });
    }

    // Step 4: Test file validation
    console.log('🔍 STEP 4: Testing file validation...');
    const validation = isValidResumeFile(file);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'File validation failed',
        debug: {
          step: 'file_validation',
          validation,
          fileInfo: {
            name: file.name,
            type: file.type,
            size: file.size
          }
        }
      }, { status: 400 });
    }

    // Step 5: Test database connection
    console.log('🔍 STEP 5: Testing database connection...');
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });

      if (!user) {
        return NextResponse.json({
          error: 'User not found in database',
          debug: {
            step: 'database_user_lookup',
            email: session.user.email
          }
        }, { status: 404 });
      }

      console.log('✅ All steps passed! User found:', user.id);

      return NextResponse.json({
        success: true,
        debug: {
          step: 'complete',
          details: {
            environment: { isAvailable, config },
            authentication: { email: session.user.email },
            file: {
              name: file.name,
              type: file.type,
              size: file.size,
              validation
            },
            database: { userId: user.id }
          }
        },
        message: 'All preliminary checks passed! The issue is likely in text extraction, AI parsing, or data saving.'
      });

    } catch (dbError: any) {
      return NextResponse.json({
        error: 'Database connection failed',
        debug: {
          step: 'database_connection',
          error: dbError.message,
          code: dbError.code
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ MINIMAL DEBUG ERROR:', error);
    return NextResponse.json({
      error: 'Unexpected error in minimal test',
      debug: {
        step: 'unknown',
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }
    }, { status: 500 });
  }
}
