import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import WebhookSystem from '@/lib/integrations/webhook-system';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * GET /api/platform/webhooks
 * Get user's webhook endpoints
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's webhook endpoints
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { userId },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        lastDeliveryAt: true,
        failureCount: true,
        retryPolicy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get webhook event types
    const webhookSystem = WebhookSystem.getInstance();
    const eventTypes = webhookSystem.getEventTypes();

    return NextResponse.json({
      success: true,
      data: {
        webhooks,
        eventTypes,
      },
      meta: {
        timestamp: new Date().toISOString(),
        count: webhooks.length,
      },
    });

  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform/webhooks
 * Create new webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events, secret } = body;

    // Validate input
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'URL and events are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    const webhookSystem = WebhookSystem.getInstance();
    const validEventTypes = webhookSystem.getEventTypes().map(et => et.name);
    const invalidEvents = events.filter((event: string) => !validEventTypes.includes(event));
    
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid event types: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Check webhook limit
    const existingWebhooks = await prisma.webhookEndpoint.count({
      where: { userId, status: 'active' },
    });

    if (existingWebhooks >= 10) { // Limit to 10 webhooks per user
      return NextResponse.json(
        { error: 'Maximum 10 webhook endpoints allowed per user' },
        { status: 400 }
      );
    }

    // Create webhook
    const webhook = await webhookSystem.createWebhook({
      userId,
      url,
      events,
      secret,
    });

    return NextResponse.json({
      success: true,
      data: { webhook },
      message: 'Webhook endpoint created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook endpoint' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/platform/webhooks/{webhookId}
 * Update webhook endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const webhookId = url.pathname.split('/').pop();
    const body = await request.json();
    const { url: webhookUrl, events, status } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Validate events if provided
    if (events) {
      const webhookSystem = WebhookSystem.getInstance();
      const validEventTypes = webhookSystem.getEventTypes().map(et => et.name);
      const invalidEvents = events.filter((event: string) => !validEventTypes.includes(event));
      
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid event types: ${invalidEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update webhook
    const updatedWebhook = await prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: {
        ...(webhookUrl && { url: webhookUrl }),
        ...(events && { events }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { webhook: updatedWebhook },
      message: 'Webhook endpoint updated successfully',
    });

  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook endpoint' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/platform/webhooks/{webhookId}
 * Delete webhook endpoint
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const webhookId = url.pathname.split('/').pop();

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    await prisma.webhookEndpoint.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook endpoint' },
      { status: 500 }
    );
  }
}
