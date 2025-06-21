'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


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
}

export default function OnboardingClient({ user }: OnboardingClientProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleOnboardingComplete = async () => {
    setIsCompleting(true);

    try {
      // The OnboardingWizard component will handle the API call
      // This is just a callback for when it's done

      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to appropriate dashboard
      if (user.role === 'employer') {
        router.push('/employers/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  if (isCompleting) {
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

  return (
    <OnboardingWizard
      userRole={user.role as 'jobseeker' | 'employer'}
      onComplete={handleOnboardingComplete}
    />
  );
}
