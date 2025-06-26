import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AuthRedirectPage() {
  console.log('🚀 AUTH-REDIRECT: Starting auth redirect flow');
  
  let clerkUser;
  let userEmail;
  let user;
  
  try {
    // Step 1: Check Clerk user
    clerkUser = await currentUser();
    console.log('🚀 AUTH-REDIRECT: Clerk user exists?', !!clerkUser);
    console.log('🚀 AUTH-REDIRECT: Clerk user ID:', clerkUser?.id);

    if (!clerkUser) {
      console.log('❌ AUTH-REDIRECT: No Clerk user, redirecting to sign-in');
      redirect('/sign-in');
      return; // This won't execute, but TypeScript needs it
    }

    userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    console.log('🚀 AUTH-REDIRECT: User email:', userEmail);
    
    if (!userEmail) {
      console.log('❌ AUTH-REDIRECT: No email found, redirecting to sign-in');
      redirect('/sign-in');
      return;
    }

    // Step 2: Test database connection
    console.log('🚀 AUTH-REDIRECT: Testing database connection...');
    await prisma.$connect();
    console.log('✅ AUTH-REDIRECT: Database connected successfully');

    // Step 3: Try to find user
    console.log('🚀 AUTH-REDIRECT: Looking up user in database...');
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
        role: true,
      },
    });
    console.log('🚀 AUTH-REDIRECT: Database lookup result:', user);

    // Step 4: Create user if needed
    if (!user) {
      console.log('🆕 AUTH-REDIRECT: Creating new user...');
      user = await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: userEmail,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          passwordHash: 'clerk_managed',
          role: 'jobseeker',
          onboardingCompleted: false,
        },
        select: {
          id: true,
          email: true,
          onboardingCompleted: true,
          employerOnboardingCompleted: true,
          role: true,
        },
      });
      console.log('🆕 AUTH-REDIRECT: User created:', user);
    }

    // Step 5: Check onboarding status
    console.log('✅ AUTH-REDIRECT: User data:', {
      email: user.email,
      role: user.role,
      onboarding: user.onboardingCompleted,
      employerOnboarding: user.employerOnboardingCompleted
    });
    
    // Step 6: Determine redirect destination
    if (!user.onboardingCompleted) {
      console.log('→ AUTH-REDIRECT: Redirecting to onboarding (role selection)');
      redirect('/onboarding');
    } else if (user.role === 'employer' && !user.employerOnboardingCompleted) {
      console.log('→ AUTH-REDIRECT: Redirecting to employer onboarding');
      redirect('/onboarding/employer');
    } else if (user.role === 'employer') {
      console.log('→ AUTH-REDIRECT: Redirecting to employer dashboard');
      redirect('/employers/dashboard');
    } else if (user.role === 'admin') {
      console.log('→ AUTH-REDIRECT: Redirecting to admin dashboard');
      redirect('/admin/dashboard');
    } else {
      console.log('→ AUTH-REDIRECT: Redirecting to job seeker dashboard');
      redirect('/dashboard');
    }
    
  } catch (error) {
    // Don't catch redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect errors
    }
    
    console.error('❌ AUTH-REDIRECT: Actual error occurred:', error);
    
    // Log the full error details
    if (error instanceof Error) {
      console.error('❌ AUTH-REDIRECT: Error name:', error.name);
      console.error('❌ AUTH-REDIRECT: Error message:', error.message);
      console.error('❌ AUTH-REDIRECT: Error stack:', error.stack);
    }
    
    // Return a simple error page for real errors
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Auth Error</h1>
          <p className="text-gray-700 mb-4">
            Something went wrong during authentication. Check the console for details.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <div className="space-x-4">
            <a href="/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try Sign In Again
            </a>
            <a href="/" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}