import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { Session } from 'next-auth';
import { prisma } from '@/lib/database/prisma';

// Re-export auth config from the v5 configuration
export { authConfig } from '@/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getServerSession(): Promise<AuthUser | null> {
  try {
    const session = await auth() as Session | null;
    
    if (!session?.user?.email) {
      return null;
    }

    return {
      id: (session.user as any).id || '',
      email: session.user.email,
      name: session.user.name || null,
      role: (session.user as any).role || 'jobseeker',
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

export async function getCurrentUser(
  request?: NextRequest
): Promise<AuthUser | null> {
  // For server-side rendering, use getServerSession
  return await getServerSession();
}

export async function requireAuth(request?: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(
  role: string,
  request?: NextRequest
): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== role && user.role !== 'admin') {
    throw new Error(`Role ${role} required`);
  }
  return user;
}
