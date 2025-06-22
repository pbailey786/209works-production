'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MapPin, Building, DollarSign, Clock, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DOMAIN_CONFIGS } from '@/lib/domain/config';

interface FormData {
  // Step 1: Job Basics
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  
  // Step 2: Job Description
  description: string;
  requirements: string;
  benefits: string;
}

const initialFormData: FormData = {
  title: '',
  company: '',
  location: '',
  jobType: '',
  salaryMin: null,
  salaryMax: null,
  description: '',
  requirements: '',
  benefits: ''
};

const jobTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' }
];

const centralValleyCities = [
  'Stockton',
  'Modesto', 
  'Tracy',
  'Manteca',
  'Lodi',
  'Fresno',
  'Visalia',
  'Clovis',
  'Madera',
  'Merced',
  'Turlock',
  'Salinas',
  'San Jose',
  'Santa Clara',
  'Fremont',
  'Hayward',
  'Oakland',
  'Berkeley',
  'Sacramento',
  'Elk Grove',
  'Roseville'
];

const salaryRanges = [
  { min: 30000, max: 40000, label: '$30k - $40k' },
  { min: 40000, max: 50000, label: '$40k - $50k' },
  { min: 50000, max: 65000, label: '$50k - $65k' },
  { min: 65000, max: 80000, label: '$65k - $80k' },
  { min: 80000, max: 100000, label: '$80k - $100k' },
  { min: 100000, max: 125000, label: '$100k - $125k' },
  { min: 125000, max: 150000, label: '$125k - $150k' },
  { min: 150000, max: null, label: '$150k+' }
];

export default function CreateJobPostPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Job title is required';
      if (!formData.company.trim()) newErrors.company = 'Company name is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.jobType) newErrors.jobType = 'Job type is required';
    }

    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Job description is required';
      if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          postedAt: new Date().toISOString(),
          status: 'active',
          areaCodes: ['209'] // Default to 209 area
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Redirect to dashboard with success message
        router.push('/employers/dashboard?posted=true');
      } else {
        // Handle API errors
        if (data.error === 'Validation failed') {
          setSubmitError('Please check your form data and try again.');
        } else {
          setSubmitError(data.error || 'Failed to create job posting. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="mx-auto h-12 w-12 text-[#ff6b35] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Job Basics</h2>
        <p className="text-gray-600 mt-2">Let's start with the fundamental details about your job opening</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="e.g. Software Engineer, Marketing Coordinator"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => updateFormData('company', e.target.value)}
            placeholder="Your company name"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent ${
              errors.company ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a city</option>
              {centralValleyCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={formData.jobType}
              onChange={(e) => updateFormData('jobType', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent ${
                errors.jobType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select job type</option>
              {jobTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {errors.jobType && <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range (Optional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={formData.salaryMin && formData.salaryMax ? `${formData.salaryMin}-${formData.salaryMax}` : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const range = salaryRanges.find(r => `${r.min}-${r.max}` === value);
                  if (range) {
                    updateFormData('salaryMin', range.min);
                    updateFormData('salaryMax', range.max);
                  }
                } else {
                  updateFormData('salaryMin', null);
                  updateFormData('salaryMax', null);
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
            >
              <option value="">Select salary range</option>
              {salaryRanges.map(range => (
                <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="mx-auto h-12 w-12 text-[#ff6b35] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
        <p className="text-gray-600 mt-2">Tell candidates about the role, requirements, and what you offer</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            rows={6}
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Describe the role, responsibilities, and what a typical day looks like..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requirements *
          </label>
          <textarea
            rows={4}
            value={formData.requirements}
            onChange={(e) => updateFormData('requirements', e.target.value)}
            placeholder="List required skills, experience, education, certifications..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent resize-none ${
              errors.requirements ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Benefits & Perks (Optional)
          </label>
          <textarea
            rows={4}
            value={formData.benefits}
            onChange={(e) => updateFormData('benefits', e.target.value)}
            placeholder="Health insurance, PTO, remote work options, professional development..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Eye className="mx-auto h-12 w-12 text-[#ff6b35] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Preview & Submit</h2>
        <p className="text-gray-600 mt-2">Review your job posting before publishing</p>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-gray-900">{formData.title}</CardTitle>
              <p className="text-[#ff6b35] font-medium mt-1">{formData.company}</p>
              <div className="flex items-center text-gray-600 mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{formData.location}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{formData.jobType.replace('_', ' ')}</span>
                {formData.salaryMin && formData.salaryMax && (
                  <>
                    <span className="mx-2">•</span>
                    <span>${formData.salaryMin.toLocaleString()} - ${formData.salaryMax.toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{formData.requirements}</p>
          </div>
          
          {formData.benefits && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Benefits & Perks</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{formData.benefits}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{submitError}</p>
        </div>
      )}
    </div>
  );

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Job Posting</h1>
          <p className="text-gray-600">Reach qualified candidates in the Central Valley</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#ff6b35] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center px-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="flex items-center px-6 bg-[#ff6b35] hover:bg-[#e55b30]"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center px-6 bg-[#ff6b35] hover:bg-[#e55b30]"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Need help? Contact us at{' '}
          <a href="mailto:hello@209.works" className="text-[#ff6b35] hover:underline">
            hello@209.works
          </a>
        </div>
      </div>
    </div>
  );
}
