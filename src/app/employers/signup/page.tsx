'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Metadata } from 'next';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Users,
  Briefcase,
  CheckCircle,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Target,
} from 'lucide-react';

interface SignupForm {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  companySize: string;
  industry: string;
  jobTitle: string;
  // BILLING REFACTOR: Removed plan field - billing now happens when posting first job
  agreeToTerms: boolean;
  subscribeToUpdates: boolean;
}

// Component that uses search params - needs to be wrapped in Suspense
function SignupContent() {
  const router = useRouter();
  // BILLING REFACTOR: Removed selectedPlan - billing now happens when posting first job

  const [form, setForm] = useState<SignupForm>({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companySize: '',
    industry: '',
    jobTitle: '',
    // BILLING REFACTOR: Removed plan field - billing now happens when posting first job
    agreeToTerms: false,
    subscribeToUpdates: true,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
  ];

  const industries = [
    'Agriculture',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Technology',
    'Education',
    'Construction',
    'Transportation',
    'Finance',
    'Food Service',
    'Government',
    'Non-profit',
    'Real Estate',
    'Professional Services',
    'Other',
  ];

  // BILLING REFACTOR: Removed plans array - billing now happens when posting first job

  const steps = [
    { number: 1, title: 'Account Info', description: 'Basic account details' },
    { number: 2, title: 'Company Details', description: 'Company information' },
    // BILLING REFACTOR: Removed "Choose Plan" step - billing now happens when posting first job
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(form.email))
        newErrors.email = 'Email is invalid';
      if (!form.password) newErrors.password = 'Password is required';
      if (form.password.length < 8)
        newErrors.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 2) {
      if (!form.companyName.trim())
        newErrors.companyName = 'Company name is required';
      if (!form.companySize) newErrors.companySize = 'Company size is required';
      if (!form.industry) newErrors.industry = 'Industry is required';
      if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
      // BILLING REFACTOR: Moved terms agreement check to step 2
      if (!form.agreeToTerms)
        newErrors.agreeToTerms = 'You must agree to the terms of service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // BILLING REFACTOR: Only 2 steps now, submit on step 2
      if (currentStep < 2) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/employers/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        // Sign in the user after successful registration
        const result = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/employers/dashboard?welcome=true');
        } else {
          router.push('/employers/signin?registered=true');
        }
      } else {
        const data = await response.json();
        setErrors({
          submit: data.message || 'Registration failed. Please try again.',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    signIn(provider, { callbackUrl: '/employers/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Building2 className="mx-auto mb-6 h-16 w-16 text-[#9fdf9f]" />
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Start Hiring Today
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-[#9fdf9f]/80">
              Join hundreds of Central Valley employers who trust 209 Works to
              find qualified candidates.
            </p>
            <div className="mt-8 flex items-center justify-center text-[#9fdf9f]/70">
              <Star className="mr-2 h-5 w-5" />
              <span>14-day free trial • No credit card required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Benefits Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-gray-900">
                Why Choose 209.works?
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Local Focus</h4>
                    <p className="text-sm text-gray-600">
                      Exclusively serving the Central Valley with deep local
                      market knowledge.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">
                      AI-Powered Matching
                    </h4>
                    <p className="text-sm text-gray-600">
                      Advanced algorithms help you find the right candidates
                      faster.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">
                      Trusted Platform
                    </h4>
                    <p className="text-sm text-gray-600">
                      Secure, reliable platform trusted by 500+ local employers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">
                      Quality Candidates
                    </h4>
                    <p className="text-sm text-gray-600">
                      Access to 10,000+ pre-screened job seekers in your area.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="mb-4 font-medium text-gray-900">
                  Registration Progress
                </h4>
                <div className="space-y-3">
                  {steps.map(step => (
                    <div
                      key={step.number}
                      className={`flex items-center ${
                        currentStep === step.number
                          ? 'text-blue-600'
                          : currentStep > step.number
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                          currentStep === step.number
                            ? 'bg-blue-100 text-blue-600'
                            : currentStep > step.number
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-gray-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              {/* Step 1: Account Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                      Create Your Account
                    </h2>
                    <p className="text-gray-600">
                      Let's start with your basic account information.
                    </p>
                  </div>

                  {/* Social Signup Options */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSocialSignup('google')}
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google Workspace
                    </button>

                    <button
                      onClick={() => handleSocialSignup('linkedin')}
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <svg
                        className="mr-3 h-5 w-5"
                        fill="#0077B5"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      Continue with LinkedIn
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={e =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.fullName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="John Smith"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="john@company.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e =>
                          setForm({ ...form, password: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Minimum 8 characters"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={e =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="(209) 555-0123"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Company Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                      Company Information
                    </h2>
                    <p className="text-gray-600">
                      Tell us about your company to help us serve you better.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={e =>
                          setForm({ ...form, companyName: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.companyName
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Your Company Name"
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Company Size *
                      </label>
                      <select
                        value={form.companySize}
                        onChange={e =>
                          setForm({ ...form, companySize: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.companySize
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select company size</option>
                        {companySizes.map(size => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                      {errors.companySize && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.companySize}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Industry *
                      </label>
                      <select
                        value={form.industry}
                        onChange={e =>
                          setForm({ ...form, industry: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.industry ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                      {errors.industry && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.industry}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Your Job Title *
                      </label>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={e =>
                          setForm({ ...form, jobTitle: e.target.value })
                        }
                        className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                          errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g. HR Manager, CEO, Recruiter"
                      />
                      {errors.jobTitle && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.jobTitle}
                        </p>
                      )}
                    </div>

                    {/* Terms and Conditions - moved from Step 3 */}
                    <div className="space-y-4 border-t border-gray-200 pt-6">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={form.agreeToTerms}
                          onChange={e =>
                            setForm({ ...form, agreeToTerms: e.target.checked })
                          }
                          className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          I agree to the{' '}
                          <a
                            href="/terms"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                          >
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                            href="/privacy"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                          >
                            Privacy Policy
                          </a>
                          *
                        </span>
                      </label>
                      {errors.agreeToTerms && (
                        <p className="text-sm text-red-600">
                          {errors.agreeToTerms}
                        </p>
                      )}

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={form.subscribeToUpdates}
                          onChange={e =>
                            setForm({
                              ...form,
                              subscribeToUpdates: e.target.checked,
                            })
                          }
                          className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Send me updates about new features and hiring tips
                        </span>
                      </label>
                    </div>

                    {errors.submit && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-red-800">{errors.submit}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BILLING REFACTOR: Removed Step 3 - Plan selection now happens when posting first job */}

              {/* Navigation Buttons */}
              <div className="flex justify-between border-t border-gray-200 pt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="flex space-x-4">
                  {currentStep < 2 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Sign In Link */}
              <div className="mt-8 border-t border-gray-200 pt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <a
                    href="/employers/signin"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function EmployerSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading signup form...</p>
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
