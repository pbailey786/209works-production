'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Upload,
  Users,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe,
  MapPin,
  GraduationCap,
  Home,
  TrendingUp,
} from 'lucide-react';

interface OnboardingData {
  // Step 1: Company Profile & Branding
  companyLogo?: string;
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  industry: string;

  // Step 2: Hiring Preferences
  hiringPlans: string;
  typicallyRequiresDegree: boolean;
  offersRemoteWork: boolean;
  preferredExperienceLevel: string;
}

export default function EmployerOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    industry: '',
    hiringPlans: '',
    typicallyRequiresDegree: false,
    offersRemoteWork: false,
    preferredExperienceLevel: '',
  });

  // Check authentication and redirect if already completed onboarding
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      router.push('/employers/signin');
      return;
    }

    // Check if onboarding is already completed
    if ((session!.user as any).employerOnboardingCompleted) {
      router.push('/employers/dashboard');
      return;
    }

    // Pre-fill company name if available
    if ((session!.user as any).companyName) {
      setData(prev => ({ ...prev, companyName: (session!.user as any).companyName }));
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
      </div>
    );
  }

  if (!session || !session.user || (session!.user as any).role !== 'employer') {
    return null;
  }

  const industries = [
    'Healthcare',
    'Technology',
    'Retail',
    'Food Service',
    'Manufacturing',
    'Construction',
    'Transportation & Logistics',
    'Education',
    'Finance',
    'Real Estate',
    'Professional Services',
    'Non-profit',
    'Government',
    'Agriculture',
    'Other'
  ];

  const hiringPlanOptions = [
    '1-2 people',
    '3-5 people',
    '6-10 people',
    '11-20 people',
    '20+ people',
    'Not sure yet'
  ];

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Mix of All Levels'
  ];

  const handleInputChange = (field: keyof OnboardingData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!data.companyWebsite.trim()) newErrors.companyWebsite = 'Company website is required';
      if (!data.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
      if (!data.industry) newErrors.industry = 'Industry selection is required';
    } else if (step === 2) {
      if (!data.hiringPlans) newErrors.hiringPlans = 'Hiring plans selection is required';
      if (!data.preferredExperienceLevel) newErrors.preferredExperienceLevel = 'Experience level preference is required';
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
    try {
      const response = await fetch('/api/employers/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Redirect to job posting page
        router.push('/employers/create-job-post?onboarding=complete');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to complete onboarding' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to complete onboarding. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2d4a3e]">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Company Profile & Branding</h2>
        <p className="text-gray-600 mt-2">Tell us about your company to create better job posts</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
            <span className="text-xs text-gray-500 ml-1">(highly encouraged)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2d4a3e] transition-colors">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Logos help build trust and are featured in your social graphics and job ads
            </p>
            <button
              type="button"
              className="mt-2 text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
            >
              Upload Logo (Coming Soon)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={e => handleInputChange('companyName', e.target.value)}
            placeholder="e.g., Acme Corporation"
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.companyName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Website *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={data.companyWebsite}
              onChange={e => handleInputChange('companyWebsite', e.target.value)}
              placeholder="https://www.yourcompany.com"
              className={`w-full rounded-lg border py-3 pl-10 pr-4 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
                errors.companyWebsite ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.companyWebsite && (
            <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brief Company Description *
          </label>
          <textarea
            value={data.companyDescription}
            onChange={e => handleInputChange('companyDescription', e.target.value)}
            placeholder="Tell us what your company does and what makes it special..."
            rows={4}
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.companyDescription ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.companyDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.companyDescription}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry/Category *
          </label>
          <select
            value={data.industry}
            onChange={e => handleInputChange('industry', e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.industry ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select your industry</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6b35]">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Hiring Preferences</h2>
        <p className="text-gray-600 mt-2">Help us understand your hiring needs and preferences</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How many people are you planning to hire in the next 3 months? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {hiringPlanOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleInputChange('hiringPlans', option)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  data.hiringPlans === option
                    ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                    : 'border-gray-300 hover:border-[#2d4a3e]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.hiringPlans && (
            <p className="mt-1 text-sm text-red-600">{errors.hiringPlans}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Do you typically require a 4-year degree?
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange('typicallyRequiresDegree', true)}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                data.typicallyRequiresDegree
                  ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                  : 'border-gray-300 hover:border-[#2d4a3e]'
              }`}
            >
              <GraduationCap className="h-5 w-5 mx-auto mb-1" />
              Yes, usually
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('typicallyRequiresDegree', false)}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                !data.typicallyRequiresDegree
                  ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                  : 'border-gray-300 hover:border-[#2d4a3e]'
              }`}
            >
              <Briefcase className="h-5 w-5 mx-auto mb-1" />
              No, experience matters more
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Do you offer remote or hybrid positions?
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange('offersRemoteWork', true)}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                data.offersRemoteWork
                  ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                  : 'border-gray-300 hover:border-[#2d4a3e]'
              }`}
            >
              <Home className="h-5 w-5 mx-auto mb-1" />
              Yes, we offer remote/hybrid
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('offersRemoteWork', false)}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                !data.offersRemoteWork
                  ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                  : 'border-gray-300 hover:border-[#2d4a3e]'
              }`}
            >
              <MapPin className="h-5 w-5 mx-auto mb-1" />
              On-site only
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred applicant experience level? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {experienceLevels.map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleInputChange('preferredExperienceLevel', level)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  data.preferredExperienceLevel === level
                    ? 'border-[#2d4a3e] bg-[#2d4a3e]/5 text-[#2d4a3e]'
                    : 'border-gray-300 hover:border-[#2d4a3e]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          {errors.preferredExperienceLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredExperienceLevel}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9fdf9f]">
          <TrendingUp className="h-8 w-8 text-[#2d4a3e]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Post Your First Job</h2>
        <p className="text-gray-600 mt-2">Let's get your first job posted — it only takes 2 minutes</p>
      </div>

      <div className="bg-gradient-to-r from-[#2d4a3e]/5 to-[#9fdf9f]/5 rounded-xl p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-[#2d4a3e] mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Great! Your profile is set up
        </h3>
        <p className="text-gray-600 mb-6">
          Now let's create your first job posting using our AI-powered Job Post Optimizer. 
          It will help you create compelling job listings that attract the right candidates.
        </p>
        
        <div className="bg-white rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">What you'll get:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• AI-optimized job descriptions</li>
            <li>• Local 209 area focus</li>
            <li>• Professional formatting</li>
            <li>• Higher applicant engagement</li>
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] text-white font-medium py-4 px-6 rounded-lg hover:from-[#1d3a2e] hover:to-[#8fcf8f] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2 inline-block"></div>
              Setting up...
            </>
          ) : (
            <>
              <Briefcase className="h-5 w-5 mr-2 inline-block" />
              Post a Job
              <ArrowRight className="h-5 w-5 ml-2 inline-block" />
            </>
          )}
        </button>

        {errors.submit && (
          <p className="mt-3 text-sm text-red-600">{errors.submit}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d4a3e]/5 via-white to-[#9fdf9f]/5">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handleNext}
                className="flex items-center bg-[#2d4a3e] text-white px-6 py-2 rounded-lg hover:bg-[#1d3a2e] transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
