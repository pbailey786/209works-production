import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Schema for saving search history
const saveSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  filters: z.record(z.any()).optional(),
});

// Schema for getting search history
const getSearchHistorySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET /api/search-history - Get user's search history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const { limit, offset } = getSearchHistorySchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });

    // Get search history
    const [searchHistory, totalCount] = await Promise.all([
      prisma.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          query: true,
          filters: true,
          createdAt: true,
        },
      }),
      prisma.searchHistory.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      searchHistory,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Get search history error:', error);
    return NextResponse.json(
      { error: 'Failed to get search history' },
      { status: 500 }
    );
  }
}

// POST /api/search-history - Save a search query
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { query, filters } = saveSearchSchema.parse(body);

    // Check if this exact search already exists recently (within last hour)
    const recentSearch = await prisma.searchHistory.findFirst({
      where: {
        userId: user.id,
        query: query,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    // If the same search was made recently, don't save duplicate
    if (recentSearch) {
      return NextResponse.json({
        success: true,
        message: 'Search already recorded recently',
        duplicate: true,
      });
    }

    // Save the search
    const savedSearch = await prisma.searchHistory.create({
      data: {
        userId: user.id,
        query: query,
        filters: filters ? JSON.stringify(filters) : null,
      },
    });

    // Clean up old search history (keep only last 50 searches per user)
    const searchCount = await prisma.searchHistory.count({
      where: { userId: user.id },
    });

    if (searchCount > 50) {
      // Get the oldest searches to delete
      const oldSearches = await prisma.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        take: searchCount - 50,
        select: { id: true },
      });

      // Delete old searches
      await prisma.searchHistory.deleteMany({
        where: {
          id: {
            in: oldSearches.map(s => s.id),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Search saved to history',
      searchId: savedSearch.id,
    });
  } catch (error) {
    console.error('Save search history error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save search history' },
      { status: 500 }
    );
  }
}

// DELETE /api/search-history - Clear search history
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const searchId = url.searchParams.get('id');

    if (searchId) {
      // Delete specific search
      const deletedSearch = await prisma.searchHistory.deleteMany({
        where: {
          id: searchId,
          userId: user.id, // Ensure user can only delete their own searches
        },
      });

      if (deletedSearch.count === 0) {
        return NextResponse.json(
          { error: 'Search not found or not authorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Search deleted from history',
      });
    } else {
      // Clear all search history for user
      const deletedCount = await prisma.searchHistory.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount.count} searches from history`,
        deletedCount: deletedCount.count,
      });
    }
  } catch (error) {
    console.error('Delete search history error:', error);
    return NextResponse.json(
      { error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}
