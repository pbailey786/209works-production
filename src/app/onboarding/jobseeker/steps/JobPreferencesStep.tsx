'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';

interface JobPreferencesStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const JOB_TYPES = [
  { id: 'warehouse', label: 'Warehouse & Logistics' },
  { id: 'retail', label: 'Retail & Sales' },
  { id: 'food_service', label: 'Food Service' },
  { id: 'customer_service', label: 'Customer Service' },
  { id: 'healthcare', label: 'Healthcare Support' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'construction', label: 'Construction & Trades' },
  { id: 'transportation', label: 'Transportation & Delivery' },
  { id: 'office_admin', label: 'Office & Administrative' },
  { id: 'security', label: 'Security' },
];

export default function JobPreferencesStep({ formData, setFormData, onNext, onPrev }: JobPreferencesStepProps) {
  const handleJobTypeToggle = (jobTypeId: string) => {
    const currentTypes = formData.jobTypes || [];
    const newTypes = currentTypes.includes(jobTypeId)
      ? currentTypes.filter((type: string) => type !== jobTypeId)
      : [...currentTypes, jobTypeId];
    
    setFormData((prev: any) => ({
      ...prev,
      jobTypes: newTypes,
    }));
  };

  const canContinue = (formData.jobTypes?.length > 0);

  return (
    <div className="space-y-8">
      {/* Job Types */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          <Briefcase className="w-5 h-5 inline mr-2" />
          What types of jobs interest you? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {JOB_TYPES.map((jobType) => {
            const isSelected = formData.jobTypes?.includes(jobType.id);
            return (
              <button
                key={jobType.id}
                onClick={() => handleJobTypeToggle(jobType.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-medium">{jobType.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* What are you good at */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          What are you good at?
        </label>
        <textarea
          value={formData.whatAreYouGoodAt || ''}
          onChange={(e) => setFormData((prev: any) => ({
            ...prev,
            whatAreYouGoodAt: e.target.value
          }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Tell us about your strengths and what makes you a great employee..."
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
