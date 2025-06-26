import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AuthRedirectPage() {
  console.log('🚀 AUTH-REDIRECT: Starting auth redirect flow');
  
  // Use auth() instead of currentUser() for more reliable auth check
  const { userId } = await auth();
  console.log('🚀 AUTH-REDIRECT: User ID:', userId);
  
  if (!userId) {
    console.log('❌ AUTH-REDIRECT: No user ID, redirecting to sign-in');
    redirect('/sign-in');
  }
  
  try {
    // Get user from database by Clerk ID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
        role: true,
      },
    });
    
    console.log('🚀 AUTH-REDIRECT: Database user:', user);
    
    // If user doesn't exist in database, create them
    if (!user) {
      console.log('🆕 AUTH-REDIRECT: Creating new user with ID:', userId);
      
      // Get user details from Clerk
      const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });
      
      if (!clerkResponse.ok) {
        console.error('❌ AUTH-REDIRECT: Failed to fetch Clerk user');
        redirect('/sign-in');
      }
      
      const clerkUser = await clerkResponse.json();
      const email = clerkUser.email_addresses?.[0]?.email_address;
      
      if (!email) {
        console.error('❌ AUTH-REDIRECT: No email found for user');
        redirect('/sign-in');
      }
      
      // Create user in database
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'User',
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
    }
    
    // Determine where to redirect based on onboarding status
    if (!user.onboardingCompleted) {
      console.log('→ AUTH-REDIRECT: Redirecting to onboarding (role selection)');
      redirect('/onboarding');
    }
    
    if (user.role === 'employer' && !user.employerOnboardingCompleted) {
      console.log('→ AUTH-REDIRECT: Redirecting to employer onboarding');
      redirect('/onboarding/employer');
    }
    
    // All onboarding complete, redirect to appropriate dashboard
    console.log('→ AUTH-REDIRECT: All onboarding complete, redirecting to dashboard');
    if (user.role === 'employer') {
      redirect('/employers/dashboard');
    } else if (user.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/dashboard');
    }
    
  } catch (error) {
    console.error('❌ AUTH-REDIRECT: Error:', error);
    // On error, redirect to home page instead of sign-in to avoid loops
    redirect('/');
  }
}