'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  Zap
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

export default function OnboardingWizard({ userRole, onComplete }: OnboardingWizardProps) {
  const { data: session } = useSession();
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
      required: false
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your basic information to help employers find you',
      icon: User,
      required: true
    },
    {
      id: 'location',
      title: 'Set Your Location',
      description: 'Tell us where you\'re looking for work',
      icon: MapPin,
      required: true
    },
    {
      id: 'experience',
      title: 'Add Your Experience',
      description: 'Share your skills and work history',
      icon: Briefcase,
      required: true
    },
    {
      id: 'preferences',
      title: 'Job Preferences',
      description: 'Set up job alerts and preferences',
      icon: Bell,
      required: false
    }
  ];

  const employerSteps: OnboardingStep[] = [
    {
      id: 'company',
      title: 'Company Information',
      description: 'Tell job seekers about your company',
      icon: Building2,
      required: true
    },
    {
      id: 'location',
      title: 'Company Location',
      description: 'Where is your business located?',
      icon: MapPin,
      required: true
    },
    {
      id: 'details',
      title: 'Company Details',
      description: 'Industry, size, and other details',
      icon: Users,
      required: true
    },
    {
      id: 'first-job',
      title: 'Post Your First Job',
      description: 'Start attracting candidates right away',
      icon: Target,
      required: false
    }
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
        return formData.name && formData.name.trim().length > 0;
      case 'location':
        return formData.location && formData.location.trim().length > 0;
      case 'experience':
        return userRole === 'jobseeker' ? 
          (formData.skills && formData.skills.length > 0) :
          (formData.industry && formData.industry.trim().length > 0);
      case 'company':
        return formData.companyName && formData.companyName.trim().length > 0;
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
            resume: file // Keep the original file
          }));
          alert('Resume parsed successfully! Your information has been pre-filled in the next steps.');
        }
      } else {
        const errorData = await response.json();
        console.error('Resume parsing failed:', errorData);
        alert(errorData.error || 'Failed to parse resume. You can continue filling out the form manually.');
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      alert('Failed to parse resume. You can continue filling out the form manually.');
    } finally {
      setIsParsingResume(false);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save all form data
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          onboardingCompleted: true,
          completedSteps: Array.from(completedSteps)
        })
      });

      if (response.ok) {
        onComplete();
        // Redirect to appropriate dashboard
        router.push(userRole === 'employer' ? '/employers/dashboard' : '/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Onboarding completion failed:', errorData);
        alert('Failed to complete onboarding. Please try again.');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            {userRole === 'jobseeker' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={formData.currentJobTitle || ''}
                  onChange={(e) => setFormData({...formData, currentJobTitle: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {userRole === 'jobseeker' ? 'Where are you looking for work?' : 'Where is your company located?'} *
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City (e.g., Modesto, Stockton, Fresno)"
              />
            </div>
          </div>
        );

      case 'experience':
        return userRole === 'jobseeker' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Skills *
              </label>
              <textarea
                value={formData.skills?.join(', ') || ''}
                onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="e.g., JavaScript, Project Management, Customer Service"
              />
              <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <select
                value={formData.experienceLevel || ''}
                onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry *
              </label>
              <select
                value={formData.industry || ''}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Website
              </label>
              <input
                type="url"
                value={formData.companyWebsite || ''}
                onChange={(e) => setFormData({...formData, companyWebsite: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <select
                value={formData.companySize || ''}
                onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Save time with resume upload</h4>
                  <p className="text-sm text-blue-800">
                    Upload your resume and we'll automatically extract your name, location, skills, and experience to fill out the next steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload your resume</p>
              <p className="text-sm text-gray-500 mb-4">DOCX or DOC files (max 5MB) - PDF support coming soon!</p>
              <input
                type="file"
                accept=".doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({...formData, resume: file});
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
                className={`inline-flex items-center px-6 py-3 rounded-lg transition-colors ${
                  isParsingResume
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                } text-white`}
              >
                {isParsingResume ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Parsing Resume...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </label>
              {formData.resume && !isParsingResume && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ {formData.resume.name} uploaded and parsed
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Don't have a resume ready? No problem! You can skip this step and fill out your information manually.
              </p>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Types You're Interested In
              </label>
              <div className="space-y-2">
                {['full-time', 'part-time', 'contract'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={type}
                      checked={formData.preferredJobTypes?.includes(type) || false}
                      onChange={(e) => {
                        const current = formData.preferredJobTypes || [];
                        const updated = e.target.checked
                          ? [...current, type]
                          : current.filter((t: string) => t !== type);
                        setFormData({...formData, preferredJobTypes: updated});
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={type} className="ml-2 text-sm text-gray-700 capitalize">
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
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Ready to post your first job?</h3>
            <p className="text-gray-600">
              Start attracting qualified candidates by posting your first job listing.
            </p>
            <button
              onClick={() => router.push('/employers/create-job-post')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post a Job
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to 209.works!
            </h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              {React.createElement(steps[currentStep].icon, {
                className: "w-6 h-6 text-blue-600"
              })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
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
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  'Saving...'
                ) : currentStep === steps.length - 1 ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start">
            <Zap className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                {userRole === 'jobseeker' ? 'Complete your profile to:' : 'Complete setup to:'}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
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