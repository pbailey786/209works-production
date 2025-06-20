import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import APIPlatformManager from '@/lib/api/platform-manager';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * GET /api/platform/keys
 * Get user's API keys
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platformManager = APIPlatformManager.getInstance();
    
    // Get user's API keys from database
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        scopes: true,
        rateLimit: true,
        status: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { apiKeys },
      meta: {
        timestamp: new Date().toISOString(),
        count: apiKeys.length,
      },
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform/keys
 * Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, tier = 'free', expiresInDays, metadata = {} } = body;

    // Validate input
    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        { error: 'Name and scopes are required' },
        { status: 400 }
      );
    }

    // Check if user has reached API key limit
    const existingKeys = await prisma.apiKey.count({
      where: { userId, status: 'active' },
    });

    const keyLimits = {
      free: 2,
      basic: 5,
      pro: 10,
      enterprise: 50,
    };

    if (existingKeys >= keyLimits[tier as keyof typeof keyLimits]) {
      return NextResponse.json(
        { error: `Maximum ${keyLimits[tier as keyof typeof keyLimits]} API keys allowed for ${tier} tier` },
        { status: 400 }
      );
    }

    const platformManager = APIPlatformManager.getInstance();
    
    const apiKey = await platformManager.generateAPIKey({
      userId,
      name,
      scopes,
      tier: tier as any,
      expiresInDays,
      metadata,
    });

    // Return API key (only time the full key is shown)
    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          ...apiKey,
          key: apiKey.key, // Full key with prefix
        },
      },
      message: 'API key created successfully. Save this key securely - it will not be shown again.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/platform/keys/{keyId}
 * Revoke API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const keyId = url.pathname.split('/').pop();

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and revoke key
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { status: 'revoked' },
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
