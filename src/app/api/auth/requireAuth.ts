// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { NextRequest, NextResponse } from 'next/server';
import authOptions from './authOptions';

/**
 * Checks for a valid session. If not authenticated, returns a 401 response.
 * If authenticated, returns the session object.
 * Usage: Call at the top of your API route handler.
 */
export async function requireAuth(req: NextRequest) {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}
