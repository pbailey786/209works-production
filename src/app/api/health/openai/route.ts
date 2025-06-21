import { NextRequest, NextResponse } from 'next/server';
import { checkOpenAIHealth } from '@/lib/openai';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 OpenAI Health Check Started');
    console.log('Environment check:', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
      nodeEnv: process.env.NODE_ENV,
    });

    const healthStatus = await checkOpenAIHealth();
    
    console.log('✅ OpenAI Health Check Result:', healthStatus);

    return NextResponse.json({
      openai: healthStatus,
      environment: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ OpenAI Health Check Failed:', error);
    
    return NextResponse.json(
      {
        openai: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        environment: {
          hasApiKey: !!process.env.OPENAI_API_KEY,
          apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
          nodeEnv: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
