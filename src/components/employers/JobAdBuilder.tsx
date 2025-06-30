'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, Eye, Edit3, DollarSign, MapPin, Clock, Briefcase, Users, Sparkles } from 'lucide-react';
import LogoUpload from './LogoUpload';

interface BenefitOption {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  key: string;
}

interface JobData {
  title?: string;
  company?: string;
  companyLogo?: string | null;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
  schedule?: string;
  benefits?: string;
  benefitOptions?: BenefitOption[];
}

interface JobAdBuilderProps {
  initialData: JobData;
  onBack: () => void;
  onContinue: (jobData: JobData) => void;
}

// Central Valley specific benefit options - 12 total for selection
const BENEFIT_OPTIONS: BenefitOption[] = [
  { key: 'health', icon: '🏥', title: 'Health Insurance', description: 'Medical, dental, vision coverage', value: false },
  { key: 'pto', icon: '🌴', title: 'Paid Time Off', description: 'Vacation and sick days', value: false },
  { key: 'retirement', icon: '💰', title: '401(k) Plan', description: 'Retirement savings with match', value: false },
  { key: 'parking', icon: '🚗', title: 'Free Parking', description: 'On-site parking provided', value: false },
  { key: 'training', icon: '📚', title: 'Training', description: 'On-the-job training programs', value: false },
  { key: 'overtime', icon: '⏰', title: 'Overtime Pay', description: 'Time and a half after 40 hours', value: false },
  { key: 'meals', icon: '🍽️', title: 'Meal Benefits', description: 'Free or discounted meals', value: false },
  { key: 'uniform', icon: '👔', title: 'Uniform Provided', description: 'Company provides work attire', value: false },
  { key: 'tools', icon: '🔧', title: 'Tools Provided', description: 'All necessary equipment', value: false },
  { key: 'flexible', icon: '⏱️', title: 'Flexible Schedule', description: 'Work-life balance options', value: false },
  { key: 'bonus', icon: '🎯', title: 'Performance Bonus', description: 'Earn extra based on results', value: false },
  { key: 'commute', icon: '🚌', title: 'Commute Assistance', description: 'Gas cards or transit passes', value: false },
];

export default function JobAdBuilder({ initialData, onBack, onContinue }: JobAdBuilderProps) {
  const [jobData, setJobData] = useState<JobData>({
    ...initialData,
    company: initialData.company || 'Your Company Name', // Default if not set
    benefitOptions: initialData.benefitOptions || BENEFIT_OPTIONS.map(opt => ({ ...opt }))
  });
  const [isPreview, setIsPreview] = useState(false);

  const handleFieldChange = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const toggleBenefit = (benefitKey: string) => {
    setJobData(prev => ({
      ...prev,
      benefitOptions: prev.benefitOptions?.map(benefit => 
        benefit.key === benefitKey ? { ...benefit, value: !benefit.value } : benefit
      )
    }));
  };

  const getSelectedBenefitsCount = () => {
    return jobData.benefitOptions?.filter(b => b.value).length || 0;
  };

  const handleContinue = () => {
    onContinue(jobData);
  };

  if (isPreview) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Job Post Preview</h2>
              <button
                onClick={() => setIsPreview(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-blue-100">This is how your job post will appear to job seekers</p>
          </div>

          {/* Job Preview Content */}
          <div className="p-8">
            <div className="border-b pb-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobData.title}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  {jobData.company}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {jobData.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  {jobData.salary}
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  {jobData.jobType}
                </div>
              </div>
            </div>

            {jobData.description && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">About This Role</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{jobData.description}</p>
              </div>
            )}

            {jobData.requirements && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{jobData.requirements}</p>
              </div>
            )}

            {jobData.benefits && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Benefits</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{jobData.benefits}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold mb-2">How to Apply</h3>
              <p className="text-gray-700">{jobData.contactMethod || 'Contact information will be added'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-8 py-6 flex justify-between">
            <button
              onClick={() => setIsPreview(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={handleContinue}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Continue to Post</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Build Your Job Ad</h1>
            <p className="text-gray-600">Edit and perfect your job posting</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPreview(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span>Preview</span>
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AI Enhancement Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-purple-600 mt-0.5" />
          <div>
            <p className="text-purple-900 font-medium">AI-Enhanced Job Post</p>
            <p className="text-purple-700 text-sm">Your job post has been optimized for the Central Valley market. Feel free to edit any section to better match your needs.</p>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            {/* Job Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Customer Service Representative"
              />
            </div>

            {/* Company Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={jobData.company || ''}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your company name"
              />
            </div>

            {/* Company Logo */}
            <div className="mb-4">
              <LogoUpload
                currentLogo={jobData.companyLogo}
                onLogoChange={(logoUrl) => handleFieldChange('companyLogo', logoUrl)}
                companyName={jobData.company || 'Company'}
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={jobData.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Stockton, CA"
              />
            </div>

            {/* Salary */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range *
              </label>
              <input
                type="text"
                value={jobData.salary || ''}
                onChange={(e) => handleFieldChange('salary', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. $20-25/hour or $50,000-60,000/year"
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                value={jobData.jobType || 'full-time'}
                onChange={(e) => handleFieldChange('jobType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Schedule & Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Schedule & Contact</h2>
            
            {/* Schedule */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Schedule
              </label>
              <input
                type="text"
                value={jobData.schedule || ''}
                onChange={(e) => handleFieldChange('schedule', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Monday-Friday, 9 AM - 5 PM"
              />
            </div>

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How to Apply *
              </label>
              <textarea
                value={jobData.contactMethod || ''}
                onChange={(e) => handleFieldChange('contactMethod', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Email your resume to jobs@company.com or apply in person at..."
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Job Description</h2>
            <textarea
              value={jobData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the role, responsibilities, and what makes this position great..."
            />
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Requirements</h2>
            <textarea
              value={jobData.requirements || ''}
              onChange={(e) => handleFieldChange('requirements', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="List the skills, experience, and qualifications needed..."
            />
          </div>

          {/* Benefits Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">What We Offer</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getSelectedBenefitsCount()}/6 selected
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select up to 6 benefits that make your position attractive to Central Valley job seekers
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobData.benefitOptions?.map((benefit) => (
                <button
                  key={benefit.key}
                  type="button"
                  onClick={() => toggleBenefit(benefit.key)}
                  disabled={!benefit.value && getSelectedBenefitsCount() >= 6}
                  className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                    benefit.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    !benefit.value && getSelectedBenefitsCount() >= 6
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{benefit.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{benefit.title}</div>
                      <div className="text-sm text-gray-600">{benefit.description}</div>
                    </div>
                    {benefit.value && (
                      <div className="text-blue-600">
                        ✓
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {getSelectedBenefitsCount() >= 6 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  💡 You've selected the maximum of 6 benefits. Deselect one to choose a different option.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}