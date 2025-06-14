import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironmentVariables, getEnvironmentConfig, isResumeParsingAvailable } from '@/lib/env-validation';

export async function GET(request: NextRequest) {
  try {
    const validation = validateEnvironmentVariables();
    const config = getEnvironmentConfig();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      validation: {
        isValid: validation.isValid,
        missing: validation.missing,
        invalid: validation.invalid,
        warnings: validation.warnings,
      },
      config: {
        openai: {
          hasKey: config.openai.hasKey,
          keyLength: config.openai.keyLength,
          isValidFormat: config.openai.isValidFormat,
        },
        database: {
          hasUrl: config.database.hasUrl,
          isValidFormat: config.database.isValidFormat,
        },
        auth: {
          hasSecret: config.auth.hasSecret,
          hasUrl: config.auth.hasUrl,
        },
        email: {
          hasResendKey: config.email.hasResendKey,
          hasEmailFrom: config.email.hasEmailFrom,
        },
      },
      features: {
        resumeParsingAvailable: isResumeParsingAvailable(),
      },
      message: validation.isValid 
        ? 'All environment variables are properly configured' 
        : 'Some environment variables need attention',
    });
  } catch (error) {
    console.error('Environment test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
