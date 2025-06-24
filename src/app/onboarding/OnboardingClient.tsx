'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import RoleSelection from '@/components/onboarding/RoleSelection';
import ConversationalOnboarding from '@/components/onboarding/ConversationalOnboarding';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  onboardingCompleted: boolean;
  location: string | null;
  currentJobTitle: string | null;
  skills: string[];
  experienceLevel: string | null;
  preferredJobTypes: string[];
  companyName: string | null;
  industry: string | null;
  createdAt: Date;
}

interface OnboardingClientProps {
  user: User;
  clerkUserId: string;
}

export default function OnboardingClient({ user, clerkUserId }: OnboardingClientProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  
  // Debug logging
  console.log('🔍 OnboardingClient - User data:', {
    email: user.email,
    onboardingCompleted: user.onboardingCompleted,
    role: user.role,
    createdAt: user.createdAt,
  });
  
  const [showRoleSelection, setShowRoleSelection] = useState(
    // Show role selection for users who haven't completed onboarding
    !user.onboardingCompleted
  );
  
  // Use conversational onboarding instead of form-based
  const [useConversationalOnboarding] = useState(true);

  // Ensure user is synced to database on component mount
  useEffect(() => {
    const ensureUserSynced = async () => {
      try {
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ User sync confirmed:', result.user?.email);
        } else {
          console.error('❌ User sync failed:', await response.json());
        }
      } catch (error) {
        console.error('❌ User sync error:', error);
      }
    };

    ensureUserSynced();
  }, []);

  const handleRoleSelected = async (role: 'jobseeker' | 'employer') => {
    setIsCompleting(true);

    try {
      // Update user role in database
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Update local state
      setCurrentUser(prev => ({ ...prev, role }));
      setShowRoleSelection(false);
      setIsCompleting(false);
    } catch (error) {
      console.error('Error updating role:', error);
      setIsCompleting(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setIsCompleting(true);

    try {
      // The OnboardingWizard component will handle the API call
      // This is just a callback for when it's done

      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to appropriate dashboard
      if (currentUser.role === 'employer') {
        router.push('/employers/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  if (isCompleting && !showRoleSelection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Setting up your account...
          </h2>
          <p className="text-gray-600">
            We're preparing your personalized experience
          </p>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <RoleSelection 
        onRoleSelected={handleRoleSelected}
        isLoading={isCompleting}
      />
    );
  }

  // Use conversational onboarding instead of form-based
  if (useConversationalOnboarding) {
    return (
      <ConversationalOnboarding
        user={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        }}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // OLD FORM-BASED ONBOARDING (commented out but kept for future use)
  // return (
  //   <OnboardingWizard
  //     userRole={currentUser.role as 'jobseeker' | 'employer'}
  //     onComplete={handleOnboardingComplete}
  //   />
  // );

  // Fallback to conversational (this shouldn't happen with current logic)
  return (
    <ConversationalOnboarding
      user={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      }}
      onComplete={handleOnboardingComplete}
    />
  );
}
