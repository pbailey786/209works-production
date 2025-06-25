'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Briefcase, Users, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Start the onboarding API call (but don't wait for it due to timeout issues)
      console.log('🚀 Starting onboarding API call...');
      fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          userId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
        }),
      }).catch(error => {
        console.log('🔥 API call error (expected due to timeout):', error);
      });

      // Wait for database write to complete (the API call happens in background)
      console.log('⏳ Waiting for database write to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Start checking status
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`🔍 Attempt ${attempt}: Checking onboarding status...`);
        
        try {
          const statusResponse = await fetch('/api/auth/user-status');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 Status data:', statusData);
            
            if (statusData.user?.onboardingCompleted && statusData.user?.role === role) {
              console.log('✅ Onboarding completed! Redirecting...');
              window.location.href = role === 'employer' ? '/employers/dashboard' : '/dashboard';
              return;
            }
          }
        } catch (statusError) {
          console.log(`❌ Status check ${attempt} failed:`, statusError);
        }

        // Wait before next attempt
        if (attempt < 5) {
          console.log(`⏳ Waiting 2 seconds before attempt ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // If all attempts failed
      throw new Error('Onboarding completion verification failed - please refresh the page');
    } catch (error) {
      console.error('Onboarding error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to 209.works! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Choose your path to get started in the Central Valley job market
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Job Seeker Option */}
          <div 
            onClick={() => setSelectedRole('jobseeker')}
            className={`cursor-pointer p-8 rounded-2xl border-2 transition-all duration-200 ${
              selectedRole === 'jobseeker' 
                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Job Seeker</h2>
              <p className="text-gray-600 mb-4">
                Find your next opportunity in the 209 area with AI-powered job matching and career tools
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>✓ Smart job recommendations</li>
                <li>✓ AI-powered "Should I Apply?" feature</li>
                <li>✓ .works resume builder</li>
                <li>✓ Skills & career guidance</li>
              </ul>
              {selectedRole === 'jobseeker' && (
                <div className="mt-4 flex items-center justify-center text-blue-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Employer Option */}
          <div 
            onClick={() => setSelectedRole('employer')}
            className={`cursor-pointer p-8 rounded-2xl border-2 transition-all duration-200 ${
              selectedRole === 'employer' 
                ? 'border-green-500 bg-green-50 shadow-lg transform scale-105' 
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Employer</h2>
              <p className="text-gray-600 mb-4">
                Post jobs and find top talent in the Central Valley with our AI-powered hiring platform
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>✓ AI-optimized job posts</li>
                <li>✓ Smart applicant matching</li>
                <li>✓ Candidate management tools</li>
                <li>✓ Local talent insights</li>
              </ul>
              {selectedRole === 'employer' && (
                <div className="mt-4 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {selectedRole && (
          <div className="text-center mt-8">
            <button
              onClick={() => handleRoleSelection(selectedRole)}
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 ${
                selectedRole === 'employer'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Setting up your account...
                </div>
              ) : (
                `Continue as ${selectedRole === 'employer' ? 'Employer' : 'Job Seeker'}`
              )}
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            You can always change your role later in your account settings
          </p>
        </div>
      </div>
    </div>
  );
}