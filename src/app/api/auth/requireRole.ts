import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from './authOptions';

/**
 * Checks if the user is authenticated and has one of the required roles.
 * Usage: Call at the top of your API route handler.
 * @param req - The NextRequest object
 * @param allowedRoles - A string or array of allowed roles (e.g., 'admin' or ['admin', 'moderator'])
 * @returns The session object if authorized, or a NextResponse (403) if not
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string | string[]
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userRole = (session.user as any).role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!userRole || !roles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden: insufficient role' },
      { status: 403 }
    );
  }
  return session;
}
