// TODO: Replace with Clerk middleware
// import { withAuth } from 'next-auth/middleware';
import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // TODO: Replace with Clerk token
  const token = null; // Mock - no authentication for now

    // TODO: Implement proper authentication middleware with Clerk
    // For now, allow all routes since authentication is disabled

    // Allow public routes
    const publicRoutes = [
      '/',
      '/jobs',
      '/chat',
      '/signin',
      '/signup',
      '/contact',
      '/about',
      '/onboarding',
      '/debug'
    ];

    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    // For now, allow access to all routes during migration
    // TODO: Re-implement proper authentication checks with Clerk

    return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
