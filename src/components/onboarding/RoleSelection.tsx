'use client';

import { useState } from 'react';
import { Briefcase, Search, ArrowRight } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelected: (role: 'jobseeker' | 'employer') => void;
  isLoading?: boolean;
}

export default function RoleSelection({ onRoleSelected, isLoading = false }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);

  const handleContinue = () => {
    if (selectedRole && !isLoading) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to 209 Works
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            How would you like to use our platform?
          </p>
          <p className="text-gray-500">
            Choose your role to get a personalized experience
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Job Seeker Card */}
          <button
            onClick={() => setSelectedRole('jobseeker')}
            disabled={isLoading}
            className={`p-8 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
              selectedRole === 'jobseeker'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-xl ${
                selectedRole === 'jobseeker' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Search className="h-8 w-8" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              I'm looking for work
            </h3>
            <p className="text-gray-600 mb-4">
              Find jobs in the 209 area, save applications, and get personalized job recommendations.
            </p>
            
            <div className="text-sm text-gray-500">
              <ul className="space-y-1">
                <li>• Search and apply to jobs</li>
                <li>• Get AI-powered job matches</li>
                <li>• Track your applications</li>
                <li>• Build your professional profile</li>
              </ul>
            </div>
          </button>

          {/* Employer Card */}
          <button
            onClick={() => setSelectedRole('employer')}
            disabled={isLoading}
            className={`p-8 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
              selectedRole === 'employer'
                ? 'border-orange-500 bg-orange-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-xl ${
                selectedRole === 'employer' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Briefcase className="h-8 w-8" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              I'm hiring talent
            </h3>
            <p className="text-gray-600 mb-4">
              Post jobs, manage applications, and find the best candidates in the Central Valley.
            </p>
            
            <div className="text-sm text-gray-500">
              <ul className="space-y-1">
                <li>• Post and manage job listings</li>
                <li>• Review and filter applications</li>
                <li>• Access hiring analytics</li>
                <li>• Build your company profile</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className={`inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
              selectedRole && !isLoading
                ? selectedRole === 'jobseeker'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Setting up your account...
              </>
            ) : (
              <>
                Continue as {selectedRole === 'jobseeker' ? 'Job Seeker' : selectedRole === 'employer' ? 'Employer' : '...'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
          
          {selectedRole && !isLoading && (
            <p className="mt-4 text-sm text-gray-500">
              You can always change this later in your settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}