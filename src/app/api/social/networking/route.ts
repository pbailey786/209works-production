import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ProfessionalNetworkingService } from '@/lib/social/professional-networking';
import { z } from 'zod';

// Validation schemas
const connectionRequestSchema = z.object({
  recipientId: z.string().uuid(),
  message: z.string().max(300).optional(),
});

const connectionResponseSchema = z.object({
  connectionId: z.string().uuid(),
  response: z.enum(['accept', 'decline']),
});

// POST /api/social/networking - Handle networking actions
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'send_connection_request':
        const requestData = connectionRequestSchema.parse(data);
        
        const connection = await ProfessionalNetworkingService.sendConnectionRequest(
          user.id,
          requestData.recipientId,
          requestData.message
        );

        return NextResponse.json({
          success: true,
          connection,
          message: 'Connection request sent successfully',
        });

      case 'respond_to_connection':
        const responseData = connectionResponseSchema.parse(data);
        
        const updatedConnection = await ProfessionalNetworkingService.respondToConnectionRequest(
          responseData.connectionId,
          user.id,
          responseData.response
        );

        return NextResponse.json({
          success: true,
          connection: updatedConnection,
          message: `Connection request ${responseData.response}ed successfully`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in networking API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process networking request' },
      { status: 500 }
    );
  }
}

// GET /api/social/networking - Get networking data
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get_connections';

    switch (action) {
      case 'get_connections':
        const status = url.searchParams.get('status') as any || 'accepted';
        const search = url.searchParams.get('search') || undefined;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        const connections = await ProfessionalNetworkingService.getUserConnections(
          user.id,
          { status, search, page, limit }
        );

        return NextResponse.json({
          success: true,
          ...connections,
        });

      case 'get_suggestions':
        const suggestionLimit = parseInt(url.searchParams.get('limit') || '10');
        
        const suggestions = await ProfessionalNetworkingService.getNetworkSuggestions(
          user.id,
          suggestionLimit
        );

        return NextResponse.json({
          success: true,
          suggestions,
        });

      case 'get_analytics':
        const analytics = await ProfessionalNetworkingService.getNetworkAnalytics(user.id);

        return NextResponse.json({
          success: true,
          analytics,
        });

      case 'get_pending_requests':
        const pendingConnections = await ProfessionalNetworkingService.getUserConnections(
          user.id,
          { status: 'pending' }
        );

        return NextResponse.json({
          success: true,
          pendingRequests: pendingConnections.connections.filter(
            conn => conn.recipientId === user.id
          ),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching networking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networking data' },
      { status: 500 }
    );
  }
}
