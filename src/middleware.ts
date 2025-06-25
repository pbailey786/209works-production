import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
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

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  
  // If accessing protected route without auth, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If user is authenticated and accessing protected route, check onboarding
  if (userId && isProtectedRoute(req) && !isPublicRoute(req)) {
    try {
      // Get Clerk user to get email
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;
      
      if (!userEmail) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }

      // Get user's onboarding status by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { onboardingCompleted: true, role: true },
      });

      // If user doesn't exist or onboarding not completed, redirect to onboarding
      if (!user || !user.onboardingCompleted) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }

      // If trying to access employer routes but not an employer, redirect to appropriate dashboard
      if (req.nextUrl.pathname.startsWith('/employers') && user.role !== 'employer' && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // If trying to access job seeker dashboard but is an employer, redirect to employer dashboard
      if (req.nextUrl.pathname === '/dashboard' && user.role === 'employer') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url));
      }
    } catch (error) {
      console.error('Middleware onboarding check error:', error);
      // On error, redirect to auth-redirect to handle properly
      return NextResponse.redirect(new URL('/auth-redirect', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', 
    '/', 
    '/(api|trpc)(.*)'
  ],
};
