import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { openai } from '@/lib/openai';
import type { Session } from 'next-auth';

// GET /api/debug/openai-status - Debug OpenAI configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic API key validation
    const apiKey = process.env.OPENAI_API_KEY;
    const hasValidApiKey =
      apiKey &&
      apiKey !== 'your-openai-key' &&
      apiKey !== 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key' &&
      apiKey !== 'dummy-key-for-build' &&
      apiKey.length > 20 &&
      (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-'));

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || 'none',
      hasValidApiKey,
      validationChecks: {
        exists: !!apiKey,
        notPlaceholder: apiKey !== 'your-openai-key' && apiKey !== 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key',
        notDummy: apiKey !== 'dummy-key-for-build',
        validLength: (apiKey?.length || 0) > 20,
        validPrefix: apiKey ? (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) : false,
      }
    };

    // Test OpenAI connection if key is valid
    let connectionTest = null;
    if (hasValidApiKey) {
      try {
        console.log('🧪 Testing OpenAI connection...');
        
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'Say "Hello, 209 Works!" in exactly those words.',
            },
          ],
          max_tokens: 10,
          temperature: 0,
        });

        const testContent = testResponse.choices[0]?.message?.content || '';
        
        connectionTest = {
          success: true,
          response: testContent,
          model: 'gpt-4o-mini',
          tokensUsed: testResponse.usage?.total_tokens || 0,
        };

        console.log('✅ OpenAI connection test successful:', testContent);
      } catch (testError) {
        console.error('❌ OpenAI connection test failed:', testError);
        
        connectionTest = {
          success: false,
          error: testError instanceof Error ? testError.message : 'Unknown error',
          errorType: testError instanceof Error ? testError.constructor.name : 'Unknown',
        };
      }
    }

    return NextResponse.json({
      status: hasValidApiKey ? 'configured' : 'not_configured',
      debug: debugInfo,
      connectionTest,
      message: hasValidApiKey 
        ? 'OpenAI is properly configured'
        : 'OpenAI API key is missing or invalid',
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to check OpenAI status' },
      { status: 500 }
    );
  }
}