import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/employers(.*)',
  '/profile(.*)',
  '/admin(.*)',
]);

// Routes that don't require onboarding completion
const isPublicRoute = createRouteMatcher([
  '/',
  '/jobs(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/auth-redirect(.*)',
  '/api(.*)',
]);

export default clerkMiddleware(async (authFunc, req: NextRequest) => {
  console.log('🔍 MIDDLEWARE - URL:', req.nextUrl.pathname);
  
  // Skip middleware completely for auth-redirect to prevent loops
  if (req.nextUrl.pathname.startsWith('/auth-redirect')) {
    console.log('✅ MIDDLEWARE - Skipping auth-redirect');
    return NextResponse.next();
  }
  
  const { userId } = await authFunc();
  console.log('🔍 MIDDLEWARE - User ID:', userId ? 'exists' : 'none');
  
  // Simple auth check - if accessing protected route without auth, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    console.log('❌ MIDDLEWARE - Protected route without auth, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // For authenticated users, just allow them through
  // The individual pages will handle any onboarding checks
  if (userId) {
    console.log('✅ MIDDLEWARE - User authenticated, allowing access');
    return NextResponse.next();
  }

  console.log('✅ MIDDLEWARE - Allowing request to continue');
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip all internal paths and auth-related paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Exclude Clerk webhooks and internal routes
    '/((?!api/clerk|api/webhooks).*)',
  ],
};
