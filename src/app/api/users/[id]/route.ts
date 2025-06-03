import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { updateUserSchema } from '@/lib/validations/api';
import { routeParamsSchemas } from '@/lib/middleware/validation';
import { UserCacheService } from '@/lib/cache/services';
import {
  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors/api-errors';
import { prisma } from '../../auth/prisma';

// GET /api/users/:id - Get user profile (own profile or admin)
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const userId = params.id;

    // Users can view their own profile, admins can view any profile
    if (user!.id !== userId && user!.role !== 'admin') {
      throw new AuthorizationError('You can only view your own profile');
    }

    // Get user with caching
    const profile = await UserCacheService.getUserById(userId, performance);

    if (!profile) {
      throw new NotFoundError('User');
    }

    return createSuccessResponse({ user: profile });
  },
  {
    requireAuthentication: true,
    paramsSchema: routeParamsSchemas.userId,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// PUT /api/users/:id - Update user profile (own profile or admin)
export const PUT = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const userId = params.id;

    // Users can update their own profile, admins can update any profile
    if (user!.id !== userId && user!.role !== 'admin') {
      throw new AuthorizationError('You can only update your own profile');
    }

    performance.trackDatabaseQuery();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundError('User');
    }

    performance.trackDatabaseQuery();

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: body!,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePictureUrl: true,
        resumeUrl: true,
        skills: true,
        companyWebsite: true,
        phoneNumber: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate user caches
    await UserCacheService.invalidateUserCaches(userId);

    return createSuccessResponse(
      { user: updatedUser },
      'Profile updated successfully'
    );
  },
  {
    requireAuthentication: true,
    bodySchema: updateUserSchema,
    paramsSchema: routeParamsSchemas.userId,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeBody: false }, // Don't log profile updates
    cors: { enabled: true },
  }
);
