import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated and visiting root, redirect based on role
    if (pathname === '/' && token) {
      if (token.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (token.role === 'employer') {
        return NextResponse.redirect(new URL('/employer', req.url));
      }
      // Job seekers stay on home page
      return NextResponse.next();
    }

    // Protect admin routes (but allow access if no database to show error page)
    if (pathname.startsWith('/admin')) {
      // If no database URL, allow access to show error page
      if (!process.env.DATABASE_URL) {
        return NextResponse.next();
      }
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/signin?redirect=/admin', req.url));
      }
    }

    // Protect employer routes
    if (pathname.startsWith('/employer')) {
      if (!token || token.role !== 'employer') {
        return NextResponse.redirect(new URL('/signin?redirect=/employer', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname === '/' ||
          pathname.startsWith('/jobs') ||
          pathname.startsWith('/chat') ||
          pathname.startsWith('/signin') ||
          pathname.startsWith('/signup')
        ) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
