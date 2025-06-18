import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Routes that require email verification
    const emailVerificationRequired = [
      '/employers',
      '/admin',
      '/profile',
      '/applications',
      '/saved-jobs',
      '/job-alerts',
      '/apply'
    ];

    // Check if email verification is required for this route
    const requiresVerification = emailVerificationRequired.some(route =>
      pathname.startsWith(route)
    );

    // If user is authenticated but email not verified and route requires verification
    // Temporarily disabled to debug authentication issues
    // if (token && requiresVerification && !token.isEmailVerified) {
    //   return NextResponse.redirect(new URL('/verify-email', req.url));
    // }

    // Comprehensive Role-Based Access Control (RBAC)
    if (token) {
      const userRole = token.role;

      // Define role-specific protected routes
      const jobSeekerRoutes = ['/dashboard', '/profile', '/applications', '/saved-jobs', '/job-alerts'];
      const employerRoutes = ['/employers'];
      const adminRoutes = ['/admin'];

      // Check if current path matches any protected route patterns
      const isJobSeekerRoute = jobSeekerRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      );
      const isEmployerRoute = employerRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      );
      const isAdminRoute = adminRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      );

      // Role-based access control
      if (userRole === 'employer') {
        // Employers trying to access job seeker routes
        if (isJobSeekerRoute) {
          return NextResponse.redirect(new URL('/employers/dashboard', req.url));
        }
        // Redirect generic /dashboard to employer dashboard
        if (pathname === '/dashboard') {
          return NextResponse.redirect(new URL('/employers/dashboard', req.url));
        }
      } else if (userRole === 'jobseeker') {
        // Job seekers trying to access employer routes
        if (isEmployerRoute) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      } else if (userRole === 'admin') {
        // Admins have access to all routes, no restrictions
      } else {
        // Unknown role - redirect to home
        if (isJobSeekerRoute || isEmployerRoute || isAdminRoute) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    }

    // If user is authenticated and visiting root, redirect based on role
    if (pathname === '/' && token) {
      if (token.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (token.role === 'employer') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
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
    if (pathname.startsWith('/employers')) {
      if (!token || token.role !== 'employer') {
        return NextResponse.redirect(new URL('/employers/signin?redirect=' + encodeURIComponent(pathname), req.url));
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
          pathname.startsWith('/signup') ||
          pathname.startsWith('/employers/signin') ||
          pathname.startsWith('/employers/signup') ||
          pathname.startsWith('/verify-email') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/password-reset') ||
          pathname.startsWith('/reset-password') ||
          pathname.startsWith('/onboarding') ||
          pathname.startsWith('/debug')
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
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
