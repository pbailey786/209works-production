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

// Icon options for employers to choose from
const ICON_OPTIONS = [
  '🏥', '🌴', '💰', '🚗', '📚', '⏰', '🍽️', '👔', '🔧', '⏱️', '🎯', '🚌',
  '💊', '🏋️', '🎓', '📱', '🏠', '✈️', '🎉', '🌟', '🤝', '📈', '🎪', '🎭',
  '🏆', '💡', '🎨', '🎮', '☕', '🌱', '🔥', '⚡', '🚀', '🎊', '💎', '🎈'
];

// Default benefit structure for new benefits
const createEmptyBenefit = (id: string): BenefitOption => ({
  key: id,
  icon: '🌟',
  title: '',
  description: '',
  value: true
});

export default function JobAdBuilder({ initialData, onBack, onContinue }: JobAdBuilderProps) {
  const [jobData, setJobData] = useState<JobData>({
    ...initialData,
    company: initialData.company || '', // Default if not set
    benefitOptions: initialData.benefitOptions || []
  });
  const [isPreview, setIsPreview] = useState(false);

  const handleFieldChange = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const addBenefit = () => {
    const newId = `benefit_${Date.now()}`;
    const newBenefit = createEmptyBenefit(newId);
    setJobData(prev => ({
      ...prev,
      benefitOptions: [...(prev.benefitOptions || []), newBenefit]
    }));
  };

  const removeBenefit = (benefitKey: string) => {
    setJobData(prev => ({
      ...prev,
      benefitOptions: prev.benefitOptions?.filter(b => b.key !== benefitKey)
    }));
  };

  const updateBenefit = (benefitKey: string, updates: Partial<BenefitOption>) => {
    setJobData(prev => ({
      ...prev,
      benefitOptions: prev.benefitOptions?.map(benefit => 
        benefit.key === benefitKey ? { ...benefit, ...updates } : benefit
      )
    }));
  };

  const getActiveBenefitsCount = () => {
    return jobData.benefitOptions?.length || 0;
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

          {/* Benefits Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">What We Offer</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getActiveBenefitsCount()}/6 benefits
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Add up to 6 benefits with custom titles and descriptions. Choose from 36 icons.
            </p>
            
            <div className="space-y-4">
              {jobData.benefitOptions?.map((benefit, index) => (
                <div key={benefit.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon Selector */}
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Icon</label>
                      <div className="relative">
                        <select
                          value={benefit.icon}
                          onChange={(e) => updateBenefit(benefit.key, { icon: e.target.value })}
                          className="w-16 h-16 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                        >
                          {ICON_OPTIONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Text Fields */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Benefit Title *
                        </label>
                        <input
                          type="text"
                          value={benefit.title}
                          onChange={(e) => updateBenefit(benefit.key, { title: e.target.value })}
                          placeholder="e.g. Health Insurance, Free Lunch, Flexible Hours"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={benefit.description}
                          onChange={(e) => updateBenefit(benefit.key, { description: e.target.value })}
                          placeholder="e.g. Medical, dental, vision coverage"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit.key)}
                      className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
                      title="Remove benefit"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Benefit Button */}
              {getActiveBenefitsCount() < 6 && (
                <button
                  type="button"
                  onClick={addBenefit}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  + Add Benefit ({getActiveBenefitsCount()}/6)
                </button>
              )}
              
              {getActiveBenefitsCount() === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎁</div>
                  <p className="mb-3">No benefits added yet</p>
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Benefit
                  </button>
                </div>
              )}
              
              {getActiveBenefitsCount() >= 6 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    💡 You've reached the maximum of 6 benefits. Remove one to add a different benefit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}