'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobSeekerProfileSetup from '@/components/profile/JobSeekerProfileSetup';

interface JobSeekerProfile {
  id?: string;
  zipCode?: string;
  distanceWillingToTravel?: number;
  availabilityDays?: string[];
  availabilityShifts?: string[];
  jobTypes?: string[];
  skills?: string[];
  careerGoal?: string;
  optInEmailAlerts?: boolean;
  optInSmsAlerts?: boolean;
  allowEmployerMessages?: boolean;
  whatAreYouGoodAt?: string;
  resumeData?: {
    workHistory?: string[];
    education?: string;
    skills?: string[];
  };
}

interface ProfileSetupClientProps {
  userId: string;
  initialProfile?: JobSeekerProfile | null;
}

export default function ProfileSetupClient({ 
  userId, 
  initialProfile 
}: ProfileSetupClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async (profile: JobSeekerProfile) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile/jobseeker', {
        method: initialProfile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();
      setSuccess('Profile saved successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Component */}
      <JobSeekerProfileSetup
        initialProfile={initialProfile || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Why complete your profile?
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Get personalized job recommendations based on your preferences</li>
          <li>• Receive email alerts for jobs that match your criteria</li>
          <li>• Allow employers to find and contact you about opportunities</li>
          <li>• Track your applications and saved jobs in one place</li>
          <li>• Access JobsGPT for AI-powered job search assistance</li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Privacy:</strong> Your profile information is secure and will only be shared with employers 
          when you apply to jobs or opt-in to direct messages. You can update your privacy preferences 
          at any time in your account settings.
        </p>
      </div>
    </div>
  );
}
