/**
 * Session adapter to make Iron Session compatible with existing NextAuth code
 * This allows gradual migration without breaking existing functionality
 */

import { getSession, getCurrentUser } from './iron-session';
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from './iron-session';

/**
 * Drop-in replacement for NextAuth's getServerSession
 * Can be used in both API routes and Server Components
 */
export async function getServerSession(req?: NextRequest) {
  try {
    // If request is provided (API route), use request-based session
    if (req) {
      const session = await getSessionFromRequest(req);
      if (!session.isLoggedIn || !session.user) {
        return null;
      }
      
      // Return NextAuth-compatible session structure
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
    }
    
    // Server Component usage
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return null;
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Session adapter error:', error);
    return null;
  }
}

/**
 * Drop-in replacement for NextAuth's auth() function
 */
export async function auth(req?: NextRequest) {
  return getServerSession(req);
}