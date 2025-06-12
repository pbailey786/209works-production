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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#2d4a3e] to-[#9fdf9f] rounded-2xl mb-6 shadow-lg">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Let's get to know your business
        </h1>
        <p className="text-lg text-gray-600">
          Just the basics — we'll make your job posts shine ✨
        </p>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Company Name *
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={e => handleInputChange('companyName', e.target.value)}
            placeholder="Your awesome company"
            className={`w-full h-14 rounded-xl border-2 px-4 text-lg transition-all duration-200 ${
              errors.companyName
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10'
            }`}
          />
          {errors.companyName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Business Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Where are you located? *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={data.businessLocation}
              onChange={e => handleInputChange('businessLocation', e.target.value)}
              placeholder="Stockton, Modesto, Tracy..."
              className={`w-full h-14 rounded-xl border-2 pl-12 pr-4 text-lg transition-all duration-200 ${
                errors.businessLocation
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10'
              }`}
            />
          </div>
          {errors.businessLocation && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.businessLocation}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">Just the city — we know you're in the 209! 🌴</p>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            What do you do? *
          </label>
          <input
            type="text"
            value={data.industry}
            onChange={e => handleInputChange('industry', e.target.value)}
            placeholder="Restaurant, Tech, Healthcare..."
            className={`w-full h-14 rounded-xl border-2 px-4 text-lg transition-all duration-200 ${
              errors.industry
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10'
            }`}
          />
          {errors.industry && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.industry}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">Keep it simple — our AI will help categorize! 🤖</p>
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Who's hiring? *
          </label>
          <input
            type="text"
            value={data.contactName}
            onChange={e => handleInputChange('contactName', e.target.value)}
            placeholder="Your name"
            className={`w-full h-14 rounded-xl border-2 px-4 text-lg transition-all duration-200 ${
              errors.contactName
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10'
            }`}
          />
          {errors.contactName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.contactName}
            </p>
          )}
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Best email to reach you? *
          </label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={e => handleInputChange('contactEmail', e.target.value)}
            placeholder="you@company.com"
            className={`w-full h-14 rounded-xl border-2 px-4 text-lg transition-all duration-200 ${
              errors.contactEmail
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10'
            }`}
          />
          {errors.contactEmail && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.contactEmail}
            </p>
          )}
        </div>

        {/* Contact Phone */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Phone number
            <span className="text-sm font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.contactPhone}
            onChange={e => handleInputChange('contactPhone', e.target.value)}
            placeholder="(209) 555-0123"
            className="w-full h-14 rounded-xl border-2 border-gray-200 px-4 text-lg transition-all duration-200 focus:border-[#2d4a3e] focus:ring-4 focus:ring-[#2d4a3e]/10"
          />
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-4">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Company Logo</h3>
          <p className="text-gray-600 mb-4">
            Upload your logo to make your job posts look professional and trustworthy
          </p>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Logo (Coming Soon)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            We'll use your logo for job ads and cool AI-generated social graphics! 🎨
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-2xl mb-6 shadow-lg">
          <TrendingUp className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          What's your hiring vibe?
        </h1>
        <p className="text-lg text-gray-600">
          Pick all that fit — we'll customize everything to match your pace 🚀
        </p>
      </div>

      {/* Hiring Goals Cards */}
      <div className="space-y-4">
        {/* Urgently Hiring */}
        <div
          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
            data.urgentlyHiring
              ? 'border-[#ff6b35] bg-gradient-to-r from-[#ff6b35]/5 to-[#ff8c42]/5 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          onClick={() => setData(prev => ({ ...prev, urgentlyHiring: !prev.urgentlyHiring }))}
        >
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              data.urgentlyHiring ? 'border-[#ff6b35] bg-[#ff6b35]' : 'border-gray-300'
            }`}>
              {data.urgentlyHiring && <span className="text-white text-sm">✓</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🔥</span>
                <h3 className="text-xl font-bold text-gray-900">Urgently hiring</h3>
              </div>
              <p className="text-gray-600">
                Need to fill positions ASAP — we'll prioritize speed and visibility
              </p>
            </div>
          </div>
        </div>

        {/* Seasonal Hiring */}
        <div
          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
            data.seasonalHiring
              ? 'border-[#ff6b35] bg-gradient-to-r from-[#ff6b35]/5 to-[#ff8c42]/5 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          onClick={() => setData(prev => ({ ...prev, seasonalHiring: !prev.seasonalHiring }))}
        >
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              data.seasonalHiring ? 'border-[#ff6b35] bg-[#ff6b35]' : 'border-gray-300'
            }`}>
              {data.seasonalHiring && <span className="text-white text-sm">✓</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🌟</span>
                <h3 className="text-xl font-bold text-gray-900">Seasonal hiring</h3>
              </div>
              <p className="text-gray-600">
                Hiring for holidays, summer, or specific busy periods
              </p>
            </div>
          </div>
        </div>

        {/* Always Hiring */}
        <div
          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
            data.alwaysHiring
              ? 'border-[#ff6b35] bg-gradient-to-r from-[#ff6b35]/5 to-[#ff8c42]/5 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
          onClick={() => setData(prev => ({ ...prev, alwaysHiring: !prev.alwaysHiring }))}
        >
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              data.alwaysHiring ? 'border-[#ff6b35] bg-[#ff6b35]' : 'border-gray-300'
            }`}>
              {data.alwaysHiring && <span className="text-white text-sm">✓</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">♾️</span>
                <h3 className="text-xl font-bold text-gray-900">Always hiring</h3>
              </div>
              <p className="text-gray-600">
                Building a talent pipeline — always looking for great people
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.hiringGoals && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            {errors.hiringGoals}
          </p>
        </div>
      )}

      {/* Pro Tip */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Pro tip</h4>
            <p className="text-gray-700">
              Most successful companies are in multiple modes! Select all that apply —
              we'll give you tools and tips for each situation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {Math.round((currentStep / 2) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-[#2d4a3e] via-[#ff6b35] to-[#9fdf9f] h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 rounded-xl hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>

            {currentStep === 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] text-white font-semibold px-8 py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <span>Next Step</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white font-semibold px-8 py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-3"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-5 w-5 mr-3" />
                    <span>Let's Post a Job!</span>
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-center flex items-center justify-center">
                <span className="mr-2">⚠️</span>
                {errors.submit}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
