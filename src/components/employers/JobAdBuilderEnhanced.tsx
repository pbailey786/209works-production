'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Eye, Edit3, DollarSign, MapPin, Clock, Briefcase, Users, Sparkles, Palette } from 'lucide-react';
import LogoUpload from './LogoUpload';
import JobPreviewModern from './JobPreviewModern';
import { extractColorFromLogo } from '@/lib/utils/colorExtractor';

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
  companyLogo?: string;
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

interface JobAdBuilderEnhancedProps {
  initialData: JobData;
  onBack: () => void;
  onContinue: (jobData: JobData) => void;
}

// Central Valley specific benefits
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

export default function JobAdBuilderEnhanced({ initialData, onBack, onContinue }: JobAdBuilderEnhancedProps) {
  const [jobData, setJobData] = useState<JobData>({
    ...initialData,
    company: initialData.company || '',
    benefitOptions: initialData.benefitOptions || BENEFIT_OPTIONS.map(b => ({ ...b })),
  });
  const [isPreview, setIsPreview] = useState(false);
  const [headerColor, setHeaderColor] = useState<string>('#1a202c');
  const [isModernPreview, setIsModernPreview] = useState(true);

  // Extract color when logo changes
  useEffect(() => {
    if (jobData.companyLogo && typeof window !== 'undefined') {
      extractColorFromLogo(jobData.companyLogo).then(color => {
        setHeaderColor(color);
      });
    }
  }, [jobData.companyLogo]);

  const handleFieldChange = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const handleBenefitToggle = (index: number) => {
    const newBenefits = [...(jobData.benefitOptions || [])];
    newBenefits[index] = { ...newBenefits[index], value: !newBenefits[index].value };
    setJobData(prev => ({ ...prev, benefitOptions: newBenefits }));
  };

  const handleContinue = () => {
    onContinue(jobData);
  };

  if (isPreview) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Job Post Preview</h2>
            <p className="text-gray-600">This is how your job post will appear to job seekers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModernPreview(!isModernPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Palette className="w-4 h-4" />
              {isModernPreview ? 'Simple View' : 'Modern View'}
            </button>
            <button
              onClick={() => setIsPreview(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
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

        {isModernPreview ? (
          <JobPreviewModern jobData={jobData} headerColor={headerColor} />
        ) : (
          // Original simple preview here
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-4">{jobData.title}</h1>
            {/* ... rest of simple preview ... */}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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
          {/* Company Info with Logo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            
            {/* Logo Upload */}
            <div className="mb-6">
              <LogoUpload
                currentLogo={jobData.companyLogo}
                onLogoChange={(logo) => handleFieldChange('companyLogo', logo)}
                companyName={jobData.company}
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
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Job Details</h2>
            
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
            <div className="mb-4">
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
              </select>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <input
                type="text"
                value={jobData.schedule || ''}
                onChange={(e) => handleFieldChange('schedule', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Monday-Friday, 8am-5pm"
              />
            </div>
          </div>

          {/* Benefits Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Benefits & Perks</h2>
            <p className="text-sm text-gray-600 mb-4">Select all benefits you offer</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobData.benefitOptions?.map((benefit, index) => (
                <label
                  key={benefit.key}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-all
                    ${benefit.value 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={benefit.value}
                    onChange={() => handleBenefitToggle(index)}
                    className="sr-only"
                  />
                  <span className="text-2xl mr-3">{benefit.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{benefit.title}</div>
                    <div className="text-xs text-gray-600">{benefit.description}</div>
                  </div>
                </label>
              ))}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
              placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
            />
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Requirements</h2>
            <textarea
              value={jobData.requirements || ''}
              onChange={(e) => handleFieldChange('requirements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              placeholder="List the skills, experience, and qualifications needed..."
            />
          </div>

          {/* How to Apply */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">How to Apply</h2>
            <textarea
              value={jobData.contactMethod || ''}
              onChange={(e) => handleFieldChange('contactMethod', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Explain how candidates should apply (email, phone, in-person, etc.)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}