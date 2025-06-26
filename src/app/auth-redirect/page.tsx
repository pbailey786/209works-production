import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AuthRedirectPage() {
  console.log('🚀 AUTH-REDIRECT: Starting auth redirect flow');
  
  try {
    // Step 1: Check Clerk user
    const clerkUser = await currentUser();
    console.log('🚀 AUTH-REDIRECT: Clerk user exists?', !!clerkUser);
    console.log('🚀 AUTH-REDIRECT: Clerk user ID:', clerkUser?.id);

    if (!clerkUser) {
      console.log('❌ AUTH-REDIRECT: No Clerk user, redirecting to sign-in');
      redirect('/sign-in');
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    console.log('🚀 AUTH-REDIRECT: User email:', userEmail);
    
    if (!userEmail) {
      console.log('❌ AUTH-REDIRECT: No email found, redirecting to sign-in');
      redirect('/sign-in');
    }

    // Step 2: Test database connection
    console.log('🚀 AUTH-REDIRECT: Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ AUTH-REDIRECT: Database connected successfully');
    } catch (dbError) {
      console.error('❌ AUTH-REDIRECT: Database connection failed:', dbError);
      // For now, let's continue and see what happens
    }

    // Step 3: Try to find user
    console.log('🚀 AUTH-REDIRECT: Looking up user in database...');
    let user;
    try {
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
    } catch (lookupError) {
      console.error('❌ AUTH-REDIRECT: Database lookup failed:', lookupError);
      throw lookupError;
    }

    // Step 4: Create user if needed
    if (!user) {
      console.log('🆕 AUTH-REDIRECT: Creating new user...');
      try {
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
      } catch (createError) {
        console.error('❌ AUTH-REDIRECT: User creation failed:', createError);
        throw createError;
      }
    }

    // Step 5: Check onboarding status
    console.log('✅ AUTH-REDIRECT: User data:', {
      email: user.email,
      role: user.role,
      onboarding: user.onboardingCompleted,
      employerOnboarding: user.employerOnboardingCompleted
    });
    
    // For debugging, let's temporarily redirect everyone to the job seeker dashboard
    console.log('🧪 AUTH-REDIRECT: DEBUGGING - redirecting to job seeker dashboard');
    redirect('/dashboard');
    
  } catch (error) {
    console.error('❌ AUTH-REDIRECT: Error occurred:', error);
    
    // Log the full error details
    if (error instanceof Error) {
      console.error('❌ AUTH-REDIRECT: Error name:', error.name);
      console.error('❌ AUTH-REDIRECT: Error message:', error.message);
      console.error('❌ AUTH-REDIRECT: Error stack:', error.stack);
    }
    
    // Return a simple error page instead of redirecting
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