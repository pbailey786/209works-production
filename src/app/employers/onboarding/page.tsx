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
  // Step 1: Company Info & Contact Person
  companyName: string;
  businessLocation: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyLogo?: string;

  // Step 2: Hiring Goals
  urgentlyHiring: boolean;
  seasonalHiring: boolean;
  alwaysHiring: boolean;
}

export default function EmployerOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    businessLocation: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    urgentlyHiring: false,
    seasonalHiring: false,
    alwaysHiring: false,
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

    // Pre-fill data if available
    if ((session!.user as any).companyName) {
      setData(prev => ({ ...prev, companyName: (session!.user as any).companyName }));
    }
    if ((session!.user as any).name) {
      setData(prev => ({ ...prev, contactName: (session!.user as any).name }));
    }
    if ((session!.user as any).email) {
      setData(prev => ({ ...prev, contactEmail: (session!.user as any).email }));
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
      if (!data.businessLocation.trim()) newErrors.businessLocation = 'Business location is required';
      if (!data.industry.trim()) newErrors.industry = 'Please tell us what your company does';
      if (!data.contactName.trim()) newErrors.contactName = 'Contact name is required';
      if (!data.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    } else if (step === 2) {
      // At least one hiring goal must be selected
      if (!data.urgentlyHiring && !data.seasonalHiring && !data.alwaysHiring) {
        newErrors.hiringGoals = 'Please select at least one hiring goal';
      }
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
        <h2 className="text-2xl font-bold text-gray-900">Tell us about your company</h2>
        <p className="text-gray-600 mt-2 italic">"Tell me, who are you? (who who, who who)"</p>
        <p className="text-gray-600 mt-1">Let's get to know the business behind the job.</p>
      </div>

      <div className="space-y-6">
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
            Business Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={data.businessLocation}
              onChange={e => handleInputChange('businessLocation', e.target.value)}
              placeholder="e.g., Stockton, Modesto, Tracy"
              className={`w-full rounded-lg border py-3 pl-10 pr-4 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
                errors.businessLocation ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.businessLocation && (
            <p className="mt-1 text-sm text-red-600">{errors.businessLocation}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">City only — we know you're in California!</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry / What Do You Do? *
          </label>
          <input
            type="text"
            value={data.industry}
            onChange={e => handleInputChange('industry', e.target.value)}
            placeholder="e.g., Restaurant, Construction, Healthcare, Retail"
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.industry ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Keep it simple — we'll help categorize it later.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name *
          </label>
          <input
            type="text"
            value={data.contactName}
            onChange={e => handleInputChange('contactName', e.target.value)}
            placeholder="Person managing hiring"
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.contactName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.contactName && (
            <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={e => handleInputChange('contactEmail', e.target.value)}
            placeholder="hiring@yourcompany.com"
            className={`w-full rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] ${
              errors.contactEmail ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.contactEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
            <span className="text-xs text-gray-500 ml-1">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.contactPhone}
            onChange={e => handleInputChange('contactPhone', e.target.value)}
            placeholder="(209) 555-0123"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2d4a3e] transition-colors">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Upload a square logo for your company profile
            </p>
            <p className="text-xs text-gray-500">
              We use your logo to personalize job ads and create cool AI-generated visuals.
            </p>
            <button
              type="button"
              className="mt-2 text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
            >
              Upload Logo (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6b35]">
          <TrendingUp className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">What are your hiring goals?</h2>
        <p className="text-gray-600 mt-2">Select all that apply — we'll tailor tools and tips to your pace.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="urgentlyHiring"
              checked={data.urgentlyHiring}
              onChange={e => setData(prev => ({ ...prev, urgentlyHiring: e.target.checked }))}
              className="mt-1 h-5 w-5 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300 rounded"
            />
            <div>
              <label htmlFor="urgentlyHiring" className="text-lg font-medium text-gray-900 cursor-pointer">
                Urgently hiring
              </label>
              <p className="text-sm text-gray-600">Need to fill positions quickly</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="seasonalHiring"
              checked={data.seasonalHiring}
              onChange={e => setData(prev => ({ ...prev, seasonalHiring: e.target.checked }))}
              className="mt-1 h-5 w-5 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300 rounded"
            />
            <div>
              <label htmlFor="seasonalHiring" className="text-lg font-medium text-gray-900 cursor-pointer">
                Seasonal hiring
              </label>
              <p className="text-sm text-gray-600">Hiring for specific seasons or periods</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="alwaysHiring"
              checked={data.alwaysHiring}
              onChange={e => setData(prev => ({ ...prev, alwaysHiring: e.target.checked }))}
              className="mt-1 h-5 w-5 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300 rounded"
            />
            <div>
              <label htmlFor="alwaysHiring" className="text-lg font-medium text-gray-900 cursor-pointer">
                Always hiring
              </label>
              <p className="text-sm text-gray-600">Continuously looking for good candidates</p>
            </div>
          </div>
        </div>

        {errors.hiringGoals && (
          <p className="text-sm text-red-600">{errors.hiringGoals}</p>
        )}

        <div className="mt-6 p-4 bg-[#2d4a3e]/5 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>Pro tip:</strong> Many companies are in multiple modes — select all that apply to get the best recommendations!
          </p>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d4a3e]/5 via-white to-[#9fdf9f]/5">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of 2</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 2) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>

            {currentStep === 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center bg-[#2d4a3e] text-white px-6 py-2 rounded-lg hover:bg-[#1d3a2e] transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] text-white font-medium px-6 py-3 rounded-lg hover:from-[#1d3a2e] hover:to-[#8fcf8f] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Post Your First Job
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>

          {errors.submit && (
            <p className="mt-3 text-sm text-red-600 text-center">{errors.submit}</p>
          )}
        </div>
      </div>
    </div>
  );
}
