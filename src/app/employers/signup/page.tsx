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
  Target
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
  plan: string;
  agreeToTerms: boolean;
  subscribeToUpdates: boolean;
}

// Component that uses search params - needs to be wrapped in Suspense
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'professional';

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
    plan: selectedPlan,
    agreeToTerms: false,
    subscribeToUpdates: true
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ];

  const industries = [
    'Agriculture', 'Healthcare', 'Manufacturing', 'Retail', 'Technology',
    'Education', 'Construction', 'Transportation', 'Finance', 'Food Service',
    'Government', 'Non-profit', 'Real Estate', 'Professional Services', 'Other'
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Perfect for small businesses',
      features: [
        '5 active job listings',
        '30-day listing duration',
        'Basic company profile',
        'Email support',
        'Basic analytics'
      ],
      badge: 'Great for Local Business'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Unlimited job listings',
        '45-day listing duration',
        'Enhanced company profile',
        'AI-powered matching',
        'Priority support',
        'Advanced analytics',
        'Up to 10 team members'
      ],
      badge: 'Most Popular',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: [
        'Unlimited job listings',
        '60-day listing duration',
        'Premium branded profile',
        'Advanced AI matching',
        'Dedicated account manager',
        'Custom analytics',
        'Unlimited team members',
        'API access'
      ],
      badge: 'Custom Solutions'
    }
  ];

  const steps = [
    { number: 1, title: 'Account Info', description: 'Basic account details' },
    { number: 2, title: 'Company Details', description: 'Company information' },
    { number: 3, title: 'Choose Plan', description: 'Select your plan' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';
      if (!form.password) newErrors.password = 'Password is required';
      if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 2) {
      if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!form.companySize) newErrors.companySize = 'Company size is required';
      if (!form.industry) newErrors.industry = 'Industry is required';
      if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    }

    if (step === 3) {
      if (!form.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms of service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
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
        setErrors({ submit: data.message || 'Registration failed. Please try again.' });
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
      <div className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto mb-6 text-[#9fdf9f]" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Start Hiring Today
            </h1>
            <p className="text-xl text-[#9fdf9f]/80 max-w-3xl mx-auto">
              Join hundreds of Central Valley employers who trust 209 Works to find qualified candidates.
            </p>
            <div className="mt-8 flex items-center justify-center text-[#9fdf9f]/70">
              <Star className="w-5 h-5 mr-2" />
              <span>14-day free trial • No credit card required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Benefits Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Why Choose 209.works?</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Local Focus</h4>
                    <p className="text-sm text-gray-600">Exclusively serving the Central Valley with deep local market knowledge.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">AI-Powered Matching</h4>
                    <p className="text-sm text-gray-600">Advanced algorithms help you find the right candidates faster.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Trusted Platform</h4>
                    <p className="text-sm text-gray-600">Secure, reliable platform trusted by 500+ local employers.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Quality Candidates</h4>
                    <p className="text-sm text-gray-600">Access to 10,000+ pre-screened job seekers in your area.</p>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Registration Progress</h4>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div key={step.number} className={`flex items-center ${
                      currentStep === step.number ? 'text-blue-600' : 
                      currentStep > step.number ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === step.number ? 'bg-blue-100 text-blue-600' :
                        currentStep > step.number ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {currentStep > step.number ? <CheckCircle className="w-4 h-4" /> : step.number}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Step 1: Account Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                    <p className="text-gray-600">Let's start with your basic account information.</p>
                  </div>

                  {/* Social Signup Options */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSocialSignup('google')}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google Workspace
                    </button>

                    <button
                      onClick={() => handleSocialSignup('linkedin')}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="#0077B5" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Continue with LinkedIn
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="John Smith"
                      />
                      {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="john@company.com"
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Minimum 8 characters"
                      />
                      {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
                    <p className="text-gray-600">Tell us about your company to help us serve you better.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.companyName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Your Company Name"
                      />
                      {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size *
                      </label>
                      <select
                        value={form.companySize}
                        onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.companySize ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select company size</option>
                        {companySizes.map((size) => (
                          <option key={size.value} value={size.value}>{size.label}</option>
                        ))}
                      </select>
                      {errors.companySize && <p className="text-red-600 text-sm mt-1">{errors.companySize}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.industry ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      {errors.industry && <p className="text-red-600 text-sm mt-1">{errors.industry}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Job Title *
                      </label>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g. HR Manager, CEO, Recruiter"
                      />
                      {errors.jobTitle && <p className="text-red-600 text-sm mt-1">{errors.jobTitle}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Choose Plan */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                    <p className="text-gray-600">Select the plan that best fits your hiring needs. You can change this later.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                          form.plan === plan.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setForm({ ...form, plan: plan.id })}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Most Popular
                            </span>
                          </div>
                        )}

                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                            <span className="text-gray-500">{plan.period}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                        </div>

                        <ul className="mt-6 space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-6">
                          <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                            form.plan === plan.id
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {form.plan === plan.id && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={form.agreeToTerms}
                        onChange={(e) => setForm({ ...form, agreeToTerms: e.target.checked })}
                        className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                          Privacy Policy
                        </a>
                        *
                      </span>
                    </label>
                    {errors.agreeToTerms && <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>}

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={form.subscribeToUpdates}
                        onChange={(e) => setForm({ ...form, subscribeToUpdates: e.target.checked })}
                        className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Send me updates about new features and hiring tips
                      </span>
                    </label>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{errors.submit}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex space-x-4">
                  {currentStep < 3 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-6 border-t border-gray-200 mt-8">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <a href="/employers/signin" className="text-blue-600 hover:underline font-medium">
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
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading signup form...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}