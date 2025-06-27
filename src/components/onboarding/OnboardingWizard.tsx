'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  FileText,
  Bell,
  Star,
  Upload,
  Building2,
  Users,
  Target,
  Zap,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
}

interface OnboardingWizardProps {
  userRole: 'jobseeker' | 'employer';
  onComplete: () => void;
}

export default function OnboardingWizard({
  userRole,
  onComplete,
}: OnboardingWizardProps) {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin', name: 'Mock User', id: 'mock-user-id' } };
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const jobseekerSteps: OnboardingStep[] = [
    {
      id: 'resume',
      title: 'Upload Your Resume',
      description: 'Let us extract your information automatically (optional)',
      icon: FileText,
      required: false,
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your basic information to help employers find you',
      icon: User,
      required: true,
    },
    {
      id: 'location',
      title: 'Set Your Location',
      description: "Tell us where you're looking for work",
      icon: MapPin,
      required: true,
    },
    {
      id: 'experience',
      title: 'Add Your Experience',
      description: 'Share your skills and work history',
      icon: Briefcase,
      required: true,
    },
    {
      id: 'preferences',
      title: 'Job Preferences',
      description: 'Set up job alerts and preferences',
      icon: Bell,
      required: false,
    },
  ];

  const employerSteps: OnboardingStep[] = [
    {
      id: 'company',
      title: 'Company Information',
      description: 'Tell job seekers about your company',
      icon: Building2,
      required: true,
    },
    {
      id: 'location',
      title: 'Company Location',
      description: 'Where is your business located?',
      icon: MapPin,
      required: true,
    },
    {
      id: 'details',
      title: 'Company Details',
      description: 'Industry, size, and other details',
      icon: Users,
      required: true,
    },
    {
      id: 'first-job',
      title: 'Post Your First Job',
      description: 'Start attracting candidates right away',
      icon: Target,
      required: false,
    },
  ];

  const steps = userRole === 'jobseeker' ? jobseekerSteps : employerSteps;

  const handleNext = async () => {
    const currentStepData = steps[currentStep];

    if (currentStepData.required) {
      // Validate required fields for current step
      const isValid = await validateStep(currentStepData.id);
      if (!isValid) return;
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const validateStep = async (stepId: string): Promise<boolean> => {
    // Add validation logic for each step
    switch (stepId) {
      case 'profile':
        if (!formData.name || formData.name.trim().length === 0) {
          alert('Please enter your full name');
          return false;
        }
        return true;
      case 'location':
        if (!formData.location || formData.location.trim().length === 0) {
          alert('Please enter your location');
          return false;
        }
        return true;
      case 'experience':
        if (userRole === 'jobseeker') {
          if (!formData.skills || formData.skills.length === 0) {
            alert('Please enter at least one skill');
            return false;
          }
        } else {
          if (!formData.industry || formData.industry.trim().length === 0) {
            alert('Please select your industry');
            return false;
          }
        }
        return true;
      case 'company':
        if (!formData.companyName || formData.companyName.trim().length === 0) {
          alert('Please enter your company name');
          return false;
        }
        return true;
      case 'details':
        // Company details step - no required fields currently
        return true;
      default:
        return true;
    }
  };

  const parseResume = async (file: File) => {
    setIsParsingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Auto-populate form fields with parsed data
          setFormData((prev: any) => ({
            ...prev,
            ...result.data,
            resume: file, // Keep the original file
          }));
          alert(
            'Resume parsed successfully! Your information has been pre-filled in the next steps.'
          );
        }
      } else {
        const errorData = await response.json();
        console.error('Resume parsing failed:', errorData);

        // Provide more specific error messages based on the error type
        let userMessage = 'Failed to parse resume. You can continue filling out the form manually.';

        if (response.status === 503) {
          userMessage = 'Resume parsing service is temporarily unavailable. Please fill out the form manually or try again later.';
        } else if (response.status === 401) {
          userMessage = 'Please sign in to use resume parsing.';
        } else if (errorData.error) {
          userMessage = errorData.error;
        }

        alert(userMessage);
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      alert(
        'Network error occurred while parsing resume. Please check your connection and try again, or fill out the form manually.'
      );
    } finally {
      setIsParsingResume(false);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Prepare the data to send
      const dataToSend = {
        ...formData,
        onboardingCompleted: true,
        completedSteps: Array.from(completedSteps),
      };

      console.log('🚀 Sending onboarding data:', dataToSend);

      // Save all form data
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Onboarding completed successfully:', result);
        onComplete();
        // Redirect to appropriate dashboard
        router.push(
          userRole === 'employer' ? '/employers/dashboard' : '/dashboard'
        );
      } else {
        const errorData = await response.json();
        console.error('❌ Onboarding completion failed:', errorData);

        // Provide more specific error messages
        let errorMessage = 'Failed to complete onboarding. Please try again.';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = `Validation errors:\n${errorData.details.join('\n')}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error('💥 Error completing onboarding:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                placeholder="Enter your full name"
              />
            </div>
            {userRole === 'jobseeker' && (
              <div>
                <label className="mb-3 block text-base font-semibold text-gray-800">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={formData.currentJobTitle || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      currentJobTitle: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                />
              </div>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                {userRole === 'jobseeker'
                  ? 'Where are you looking for work?'
                  : 'Where is your company located?'}{' '}
                *
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                placeholder="City (e.g., Modesto, Stockton, Fresno)"
              />
            </div>
          </div>
        );

      case 'experience':
        return userRole === 'jobseeker' ? (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Your Skills *
              </label>
              <textarea
                value={formData.skills?.join(', ') || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    skills: e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(s => s.length > 0),
                  })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                rows={3}
                placeholder="e.g., JavaScript, Project Management, Customer Service"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate skills with commas
              </p>
            </div>
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Years of Experience
              </label>
              <select
                value={formData.experienceLevel || ''}
                onChange={e =>
                  setFormData({ ...formData, experienceLevel: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6-10 years)</option>
                <option value="executive">Executive (10+ years)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Industry *
              </label>
              <select
                value={formData.industry || ''}
                onChange={e =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <option value="">Select your industry</option>
                <option value="agriculture">Agriculture</option>
                <option value="healthcare">Healthcare</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="technology">Technology</option>
                <option value="education">Education</option>
                <option value="construction">Construction</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={e =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                placeholder="Enter your company name"
              />
            </div>
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Company Website
              </label>
              <input
                type="url"
                value={formData.companyWebsite || ''}
                onChange={e =>
                  setFormData({ ...formData, companyWebsite: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Company Size
              </label>
              <select
                value={formData.companySize || ''}
                onChange={e =>
                  setFormData({ ...formData, companySize: e.target.value })
                }
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 py-4 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>
        );

      case 'resume':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="mb-2 text-lg font-semibold text-blue-900">
                    Save time with resume upload
                  </h4>
                  <p className="text-blue-800">
                    Upload your resume and we'll automatically extract your
                    name, location, skills, and experience to fill out the next
                    steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12 text-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50">
              <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-gray-600">Upload your resume</p>
              <p className="mb-4 text-sm text-gray-500">
                DOCX or DOC files (max 5MB) - PDF support coming soon!
              </p>
              <input
                type="file"
                accept=".doc,.docx"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, resume: file });
                    // Automatically parse the resume
                    await parseResume(file);
                  }
                }}
                className="hidden"
                id="resume-upload"
                disabled={isParsingResume}
              />
              <label
                htmlFor="resume-upload"
                className={`inline-flex items-center rounded-2xl px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 ${
                  isParsingResume
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
                }`}
              >
                {isParsingResume ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Parsing Resume...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </label>
              {formData.resume && !isParsingResume && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {formData.resume.name} uploaded and parsed
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Don't have a resume ready? No problem! You can skip this step
                and fill out your information manually.
              </p>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Job Types You're Interested In
              </label>
              <div className="space-y-2">
                {['full-time', 'part-time', 'contract'].map(type => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={type}
                      checked={
                        formData.preferredJobTypes?.includes(type) || false
                      }
                      onChange={e => {
                        const current = formData.preferredJobTypes || [];
                        const updated = e.target.checked
                          ? [...current, type]
                          : current.filter((t: string) => t !== type);
                        setFormData({
                          ...formData,
                          preferredJobTypes: updated,
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={type}
                      className="ml-2 text-sm capitalize text-gray-700"
                    >
                      {type.replace('-', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'first-job':
        return (
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                Ready to post your first job?
              </h3>
              <p className="text-lg text-gray-600">
                Start attracting qualified candidates by posting your first job
                listing.
              </p>
            </div>
            <button
              onClick={() => router.push('/employers/post-job')}
              className="group inline-flex items-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl"
            >
              Post Your First Job
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        {/* Apple-style Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
            Welcome to 209 Works
          </h2>
          <p className="text-xl font-medium text-gray-600">
            Let's set up your {userRole === 'jobseeker' ? 'job search' : 'hiring'} profile
          </p>
        </div>

        {/* Apple-style Progress Dots */}
        <div className="mb-12 flex justify-center">
          <div className="flex space-x-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Apple-style Card */}
        <div className="mx-auto rounded-3xl border border-gray-200/60 bg-white/90 p-12 shadow-2xl backdrop-blur-sm">
          {/* Apple-style Step Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              {React.createElement(steps[currentStep].icon, {
                className: 'w-10 h-10 text-white',
              })}
            </div>
            <h3 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">
              {steps[currentStep].title}
            </h3>
            <p className="text-lg text-gray-600">{steps[currentStep].description}</p>
          </div>

          {renderStepContent()}

          {/* Apple-style Navigation */}
          <div className="mt-12 flex items-center justify-between">
            {currentStep > 0 ? (
              <button
                onClick={handlePrevious}
                className="group flex items-center rounded-full px-6 py-3 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800"
              >
                <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex space-x-4">
              {!steps[currentStep].required && (
                <button
                  onClick={handleSkip}
                  className="rounded-full px-6 py-3 font-medium text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      Complete Setup
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Apple-style Benefits Card */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
          <div className="flex items-start">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="mb-3 text-lg font-semibold text-blue-900">
                {userRole === 'jobseeker'
                  ? 'Complete your profile to unlock:'
                  : 'Complete setup to unlock:'}
              </h4>
              <ul className="space-y-2 text-blue-800">
                {userRole === 'jobseeker' ? (
                  <>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Get better job recommendations
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Save and track job applications
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Apply to jobs faster
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Start posting job listings
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Access candidate database
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                      Use AI-powered matching
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
