'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Building2,
  MapPin,
  Users,
  Target,
  CheckCircle,
  Upload,
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
  logoUrl: string;
  location: string;
  hiresTeens: boolean;
  hiresSeniors: boolean;
  providesTraining: boolean;
  requiresBackgroundCheck: boolean;
  jobRolesCommon: string[];
  postingPrefersAi: boolean;
  contactMethod: string;
  hiringGoal: string;
}

const INDUSTRY_TYPES = [
  'Agriculture & Farming',
  'Construction & Trades',
  'Food Service & Hospitality',
  'Healthcare & Medical',
  'Manufacturing',
  'Retail & Sales',
  'Transportation & Logistics',
  'Warehouse & Distribution',
  'Professional Services',
  'Other'
];

const COMMON_ROLES = [
  'Warehouse Worker',
  'Sales Associate',
  'Customer Service Rep',
  'Food Service Worker',
  'Administrative Assistant',
  'Delivery Driver',
  'Security Guard',
  'Maintenance Worker',
  'Production Worker',
  'Cashier'
];

export default function EmployerOnboardingClient({ user }: EmployerOnboardingClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
    companyName: user.companyName || '',
    industryType: user.industry || '',
    logoUrl: '',
    location: user.location || '',
    hiresTeens: false,
    hiresSeniors: false,
    providesTraining: false,
    requiresBackgroundCheck: false,
    jobRolesCommon: [],
    postingPrefersAi: false,
    contactMethod: 'email',
    hiringGoal: '',
  });

  const steps = [
    { title: 'Company Info', description: 'Tell us about your business' },
    { title: 'Hiring Preferences', description: 'Who do you typically hire?' },
    { title: 'Job Posting', description: 'How do you prefer to post jobs?' },
    { title: 'Goals', description: 'What are your hiring goals?' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof FormData] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
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
        await fetch('/api/profile/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingCompleted: true }),
        });
        
        router.push('/employers/dashboard');
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Your Company Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Type *
              </label>
              <select
                value={formData.industryType}
                onChange={(e) => handleInputChange('industryType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="City, State"
              />
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hiresTeens}
                  onChange={(e) => handleInputChange('hiresTeens', e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Hire teens (16-18)</span>
              </label>
              
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hiresSeniors}
                  onChange={(e) => handleInputChange('hiresSeniors', e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Hire seniors (55+)</span>
              </label>
              
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.providesTraining}
                  onChange={(e) => handleInputChange('providesTraining', e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Provide training</span>
              </label>
              
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.requiresBackgroundCheck}
                  onChange={(e) => handleInputChange('requiresBackgroundCheck', e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Require background check</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Common roles you hire for:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COMMON_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => handleArrayToggle('jobRolesCommon', role)}
                    className={`p-2 text-sm rounded border transition-colors ${
                      formData.jobRolesCommon.includes(role)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How would you like employers to contact you?
              </label>
              <div className="space-y-3">
                {[
                  { value: 'email', label: 'Email only' },
                  { value: 'phone', label: 'Phone calls' },
                  { value: 'dashboard_only', label: 'Through dashboard only' }
                ].map(option => (
                  <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="contactMethod"
                      value={option.value}
                      checked={formData.contactMethod === option.value}
                      onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.postingPrefersAi}
                onChange={(e) => handleInputChange('postingPrefersAi', e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">Auto-optimize job posts with AI</div>
                <div className="text-sm text-gray-600">Let AI help improve your job descriptions</div>
              </div>
            </label>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What best describes your hiring goals?
              </label>
              <div className="space-y-3">
                {[
                  { value: 'urgently_hiring', label: 'Urgently hiring', desc: 'Need to fill positions quickly' },
                  { value: 'seasonal', label: 'Seasonal hiring', desc: 'Hiring for specific seasons or periods' },
                  { value: 'always_hiring', label: 'Always hiring', desc: 'Continuously looking for good candidates' }
                ].map(option => (
                  <label key={option.value} className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="hiringGoal"
                      value={option.value}
                      checked={formData.hiringGoal === option.value}
                      onChange={(e) => handleInputChange('hiringGoal', e.target.value)}
                      className="w-4 h-4 text-blue-600 mt-1"
                    />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0:
        return formData.companyName && formData.industryType && formData.location;
      case 1:
        return true; // Optional preferences
      case 2:
        return formData.contactMethod;
      case 3:
        return formData.hiringGoal;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Set Up Your Company Profile</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={!canContinue() || isLoading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={!canContinue()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
