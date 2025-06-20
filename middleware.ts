import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/employers/dashboard(.*)',
  '/employers/jobs(.*)',
  '/employers/candidates(.*)',
  '/employers/account(.*)',
  '/admin(.*)',
  '/dashboard(.*)',
  '/profile(.*)',
  '/applications(.*)',
  '/saved-jobs(.*)',
  '/job-alerts(.*)',
]);

// Define employer-only routes
const isEmployerRoute = createRouteMatcher([
  '/employers(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

// Define job seeker routes
const isJobSeekerRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/applications(.*)',
  '/saved-jobs(.*)',
  '/job-alerts(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId, sessionClaims } = await auth();

  console.log('🛡️ Clerk Middleware processing:', pathname);
  console.log('🛡️ User ID:', userId);
  console.log('🛡️ Session claims:', sessionClaims);

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const authResult = await auth();
    if (!authResult.userId) {
      return authResult.redirectToSignIn();
    }
  }

  // Role-based access control
  if (userId && sessionClaims) {
    const userRole = (sessionClaims as any)?.metadata?.role || (sessionClaims as any)?.publicMetadata?.role;
    console.log('🛡️ User role:', userRole);

    // If user is authenticated and visiting root, redirect based on role
    if (pathname === '/') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (userRole === 'employer') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
      }
      // Job seekers stay on home page
      return NextResponse.next();
    }

    // Role-based route protection
    if (userRole === 'employer') {
      // Employers trying to access job seeker routes
      if (isJobSeekerRoute(req)) {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
      }
      // Redirect generic /dashboard to employer dashboard
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
      }
    } else if (userRole === 'jobseeker') {
      // Job seekers trying to access employer routes
      if (isEmployerRoute(req)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } else if (userRole === 'admin') {
      // Admins have access to all routes, no restrictions
    } else {
      // Unknown role - redirect to home for protected routes
      if (isJobSeekerRoute(req) || isEmployerRoute(req) || isAdminRoute(req)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Protect admin routes
    if (isAdminRoute(req) && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/signin?redirect=/admin', req.url));
    }

    // Protect employer routes
    if (isEmployerRoute(req) && userRole !== 'employer') {
      return NextResponse.redirect(new URL('/employers/signin?redirect=' + encodeURIComponent(pathname), req.url));
    }
  }

  console.log('🛡️ Clerk middleware complete, allowing request');
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};