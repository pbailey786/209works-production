'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Users, 
  Target,
  CheckCircle,
  Upload
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  companyName: string | null;
  companyWebsite: string | null;
  industry: string | null;
  location: string | null;
  createdAt: Date | string;
}

interface EmployerOnboardingClientProps {
  user: User;
}

interface FormData {
  companyName: string;
  industryType: string;
  location: string;
  businessDescription: string;
}

const INDUSTRY_TYPES = [
  'Retail & Food Service',
  'Healthcare & Personal Care', 
  'Manufacturing & Warehouse',
  'Office & Administrative',
  'Construction & Trades',
  'Other'
];

// Removed - moving to Stage 2

export default function EmployerOnboardingClient({ user }: EmployerOnboardingClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    companyName: user.companyName || '',
    industryType: user.industry || '',
    location: '', // Always start with empty location to avoid pre-filling
    businessDescription: '',
  });

  // Single step onboarding - no steps needed

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save employer profile
      const response = await fetch('/api/profile/employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Mark onboarding as completed
        const onboardingResponse = await fetch('/api/profile/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            onboardingCompleted: true,
            employerOnboardingCompleted: true,
            companyName: formData.companyName,
            industry: formData.industryType,
            location: formData.location,
            companyDescription: formData.businessDescription,
          }),
        });
        
        if (!onboardingResponse.ok) {
          throw new Error('Failed to complete onboarding');
        }
        
        // Force a page reload to ensure auth state is updated
        window.location.href = '/employers/dashboard';
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Your Company Name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            value={formData.industryType}
            onChange={(e) => handleInputChange('industryType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Industry</option>
            {INDUSTRY_TYPES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="City, State"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description *
          </label>
          <textarea
            value={formData.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="What does your business do? (1-2 sentences)"
            rows={3}
          />
        </div>
      </div>
    );
  };

  const canContinue = () => {
    return formData.companyName && 
           formData.industryType && 
           formData.location && 
           formData.businessDescription;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Company Profile
          </h1>
          <p className="text-gray-600">
            Let's get you set up! This takes less than 60 seconds.
          </p>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {renderForm()}

          {/* Submit Button */}
          <div className="pt-8">
            <button
              onClick={handleComplete}
              disabled={!canContinue() || isLoading}
              className="w-full bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Setting up your account...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <CheckCircle className="w-6 h-6" />
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              You can add hiring preferences later when creating your first job post
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
