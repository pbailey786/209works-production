'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface HiringPreferencesData {
  positionTitle: string;
  urgency: 'this_week' | 'this_month' | 'when_right_person' | '';
  biggestDealBreaker: string;
  whatMatters: string[];
  contactMethod: 'email' | 'phone' | 'dashboard_only';
}

interface HiringPreferencesFormProps {
  onComplete: (data: HiringPreferencesData) => void;
  isLoading?: boolean;
}

const COMMON_POSITIONS = [
  'Cashier',
  'Sales Associate', 
  'Warehouse Worker',
  'Customer Service Rep',
  'Food Service Worker',
  'Administrative Assistant',
  'Delivery Driver',
  'Security Guard',
  'Maintenance Worker',
  'Production Worker'
];

const DEAL_BREAKERS = [
  'Unreliable/poor attendance',
  'No relevant experience',
  'Poor attitude/work ethic',
  'Not a team player',
  'Lacks basic skills',
  'Other'
];

const WHAT_MATTERS_OPTIONS = [
  'Strong work ethic',
  'Local/nearby location',
  'Previous experience',
  'Team player attitude',
  'Specific technical skills',
  'Availability/schedule flexibility',
  'Professional appearance',
  'Customer service skills'
];

export default function HiringPreferencesForm({ onComplete, isLoading = false }: HiringPreferencesFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<HiringPreferencesData>({
    positionTitle: '',
    urgency: '',
    biggestDealBreaker: '',
    whatMatters: [],
    contactMethod: 'email',
  });

  const steps = [
    { title: 'Job Basics', description: 'What position are you hiring for?' },
    { title: 'Hiring Intelligence', description: 'Help our AI understand your priorities' },
    { title: 'Communication', description: 'How should candidates reach you?' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof HiringPreferencesData] as string[];
      const maxSelections = 3;
      
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      } else if (currentArray.length < maxSelections) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      }
      return prev; // Don't add if already at max
    });
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0:
        return formData.positionTitle && formData.urgency;
      case 1:
        return formData.biggestDealBreaker && formData.whatMatters.length > 0;
      case 2:
        return formData.contactMethod;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete(formData);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Position Title *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {COMMON_POSITIONS.map(position => (
                  <button
                    key={position}
                    onClick={() => handleInputChange('positionTitle', position)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.positionTitle === position
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {position}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.positionTitle}
                onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Or type a custom position title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How urgent is this hire? *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'this_week', label: 'Need to hire this week', icon: '🔥' },
                  { value: 'this_month', label: 'Need to hire this month', icon: '⏰' },
                  { value: 'when_right_person', label: 'Hiring when I find the right person', icon: '🎯' }
                ].map(option => (
                  <label key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-xl">{option.icon}</span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What's your biggest deal-breaker when hiring? *
              </label>
              <div className="space-y-2">
                {DEAL_BREAKERS.map(dealBreaker => (
                  <label key={dealBreaker} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="biggestDealBreaker"
                      value={dealBreaker}
                      checked={formData.biggestDealBreaker === dealBreaker}
                      onChange={(e) => handleInputChange('biggestDealBreaker', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{dealBreaker}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What matters most for THIS role? * 
                <span className="text-sm text-gray-500 ml-2">(Select up to 3)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {WHAT_MATTERS_OPTIONS.map(matter => (
                  <button
                    key={matter}
                    onClick={() => handleArrayToggle('whatMatters', matter)}
                    disabled={!formData.whatMatters.includes(matter) && formData.whatMatters.length >= 3}
                    className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                      formData.whatMatters.includes(matter)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : formData.whatMatters.length >= 3
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {matter}
                    {formData.whatMatters.includes(matter) && (
                      <CheckCircle className="w-4 h-4 inline ml-2" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected: {formData.whatMatters.length}/3
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How should candidates contact you? *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'email', label: 'Email only', desc: 'Candidates will email you directly' },
                  { value: 'phone', label: 'Phone calls preferred', desc: 'You prefer phone calls over emails' },
                  { value: 'dashboard_only', label: 'Through dashboard only', desc: 'Manage all communication through 209.works' }
                ].map(option => (
                  <label key={option.value} className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="contactMethod"
                      value={option.value}
                      checked={formData.contactMethod === option.value}
                      onChange={(e) => handleInputChange('contactMethod', e.target.value)}
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-medium text-blue-900">We'll save these preferences</h4>
                  <p className="text-sm text-blue-700">
                    These settings will be remembered for future job posts, but you can always change them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Help our AI find your perfect hire
          </h2>
          <span className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <p className="text-gray-600 mt-2">
          The more we know about what you're looking for, the better candidates you'll see.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h3>
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
          
          <button
            onClick={handleNext}
            disabled={!canContinue() || isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{currentStep === steps.length - 1 ? 'Continue to Job Creation' : 'Continue'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}