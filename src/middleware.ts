import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

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
  
  // If accessing protected route without auth, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    console.log('❌ MIDDLEWARE - Protected route without auth, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If user is authenticated and accessing protected route, check onboarding
  if (userId && isProtectedRoute(req) && !isPublicRoute(req)) {
    console.log('🔍 MIDDLEWARE - Checking onboarding for protected route');
    try {
      // Get user's onboarding status by Clerk ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          onboardingCompleted: true, 
          employerOnboardingCompleted: true,
          role: true 
        },
      });

      console.log('🔍 MIDDLEWARE - Database user:', user ? `exists (onboarding: ${user.onboardingCompleted}, employer: ${user.employerOnboardingCompleted}, role: ${user.role})` : 'not found');

      // If user doesn't exist or basic onboarding not completed, redirect to onboarding
      if (!user || !user.onboardingCompleted) {
        // Don't redirect if we're already on the onboarding page
        if (!req.nextUrl.pathname.startsWith('/onboarding')) {
          console.log('❌ MIDDLEWARE - Onboarding not completed, redirecting to /onboarding');
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
      }
      
      // Special handling for employer routes
      if (req.nextUrl.pathname.startsWith('/employers') && user?.role === 'employer') {
        // Check if employer onboarding is completed
        if (!user.employerOnboardingCompleted) {
          // Don't redirect if we're already on the employer onboarding page
          if (!req.nextUrl.pathname.startsWith('/onboarding/employer')) {
            console.log('❌ MIDDLEWARE - Employer onboarding not completed, redirecting to /onboarding/employer');
            return NextResponse.redirect(new URL('/onboarding/employer', req.url));
          }
        }
      }
      
      console.log('✅ MIDDLEWARE - Onboarding completed, allowing access');

      // If trying to access employer routes but not an employer, redirect to appropriate dashboard
      if (user && req.nextUrl.pathname.startsWith('/employers') && user.role !== 'employer' && user.role !== 'admin') {
        console.log('❌ MIDDLEWARE - Non-employer accessing employer routes, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // If trying to access job seeker dashboard but is an employer, redirect to employer dashboard
      if (user && req.nextUrl.pathname === '/dashboard' && user.role === 'employer') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
      }
    } catch (error) {
      console.error('❌ MIDDLEWARE ERROR:', error);
      // On error, redirect to auth-redirect to handle properly
      return NextResponse.redirect(new URL('/auth-redirect', req.url));
    }
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
