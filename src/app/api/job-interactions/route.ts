import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationMemory } from '@/lib/conversation-memory';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    
    const { sessionId, jobId, action } = body;
    
    if (!sessionId || !jobId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, jobId, action' },
        { status: 400 }
      );
    }
    
    if (!['viewed', 'applied', 'saved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: viewed, applied, saved, or rejected' },
        { status: 400 }
      );
    }
    
    // Track the job interaction
    await conversationMemory.trackJobInteraction(sessionId, jobId, action);
    
    return NextResponse.json({
      success: true,
      message: `Job ${action} successfully tracked`,
      sessionId,
      jobId,
      action,
    });
  } catch (error) {
    console.error('Error tracking job interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track job interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }
    
    // Load conversation context to get job interactions
    const context = await conversationMemory.loadContext(sessionId, userId);
    
    return NextResponse.json({
      sessionId,
      jobInteractions: context.jobInteractions,
      preferences: context.preferences,
      recentSearches: context.recentSearches,
    });
  } catch (error) {
    console.error('Error fetching job interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job interactions' },
      { status: 500 }
    );
  }
}
