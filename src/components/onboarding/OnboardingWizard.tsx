import React, { useState, useEffect } from '@/components/ui/card';
import { useRouter } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

'use client';

import {
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
  const { user, isLoaded } = useUser();
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
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            {userRole === 'jobseeker' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                />
              </div>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="City (e.g., Modesto, Stockton, Fresno)"
              />
            </div>
          </div>
        );

      case 'experience':
        return userRole === 'jobseeker' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="e.g., JavaScript, Project Management, Customer Service"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate skills with commas
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <select
                value={formData.experienceLevel || ''}
                onChange={e =>
                  setFormData({ ...formData, experienceLevel: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Industry *
              </label>
              <select
                value={formData.industry || ''}
                onChange={e =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={e =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your company name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company Website
              </label>
              <input
                type="url"
                value={formData.companyWebsite || ''}
                onChange={e =>
                  setFormData({ ...formData, companyWebsite: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company Size
              </label>
              <select
                value={formData.companySize || ''}
                onChange={e =>
                  setFormData({ ...formData, companySize: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start">
                <FileText className="mr-2 mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="mb-1 font-medium text-blue-900">
                    Save time with resume upload
                  </h4>
                  <p className="text-sm text-blue-800">
                    Upload your resume and we'll automatically extract your
                    name, location, skills, and experience to fill out the next
                    steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-blue-400">
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
                className={`inline-flex items-center rounded-lg px-6 py-3 transition-colors ${
                  isParsingResume
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                } text-white`}
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
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
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
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Ready to post your first job?
            </h3>
            <p className="text-gray-600">
              Start attracting qualified candidates by posting your first job
              listing.
            </p>
            <button
              onClick={() => router.push('/employers/create-job-post')}
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Post a Job
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to 209.works!
            </h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              {React.createElement(steps[currentStep].icon, {
                className: 'w-6 h-6 text-blue-600',
              })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </button>

            <div className="flex space-x-3">
              {!steps[currentStep].required && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  'Saving...'
                ) : currentStep === steps.length - 1 ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <div className="flex items-start">
            <Zap className="mr-3 mt-1 h-6 w-6 text-blue-600" />
            <div>
              <h4 className="mb-2 font-medium text-blue-900">
                {userRole === 'jobseeker'
                  ? 'Complete your profile to:'
                  : 'Complete setup to:'}
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {userRole === 'jobseeker' ? (
                  <>
                    <li>• Get better job recommendations</li>
                    <li>• Save and track job applications</li>
                    <li>• Apply to jobs faster</li>
                  </>
                ) : (
                  <>
                    <li>• Start posting job listings</li>
                    <li>• Access candidate database</li>
                    <li>• Use AI-powered matching</li>
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
