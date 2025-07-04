'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Users,
  Gift,
  Settings,
  Eye,
  Sparkles,
  Save,
  CreditCard,
  AlertCircle,
  Clock
} from 'lucide-react';

interface JobData {
  title: string;
  location: string;
  salary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  contactMethod: string;
  schedule?: string;
  benefits?: string;
  requiresDegree?: boolean;
  customQuestions?: string[];
  company?: string;
  companyLogo?: string;
  benefitOptions?: BenefitOption[];
}

interface BenefitOption {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  key: string;
}

interface PostJobWizardProps {
  onComplete: (jobData: JobData) => void;
  onCancel: () => void;
  initialData?: Partial<JobData>;
  credits?: { universal: number; total: number };
  isPublishing?: boolean;
}

const STEPS = [
  {
    id: 'basics',
    title: 'Job Basics',
    subtitle: 'Title, location, and compensation',
    icon: Building2,
    fields: ['title', 'location', 'salary', 'company']
  },
  {
    id: 'content',
    title: 'Job Details',
    subtitle: 'Description and daily responsibilities',
    icon: FileText,
    fields: ['description', 'responsibilities']
  },
  {
    id: 'requirements',
    title: 'Requirements',
    subtitle: 'Skills and qualifications needed',
    icon: Users,
    fields: ['requirements', 'requiresDegree']
  },
  {
    id: 'benefits',
    title: 'Benefits & Perks',
    subtitle: 'What you offer employees',
    icon: Gift,
    fields: ['benefits', 'schedule']
  },
  {
    id: 'settings',
    title: 'Application Settings',
    subtitle: 'How candidates should apply',
    icon: Settings,
    fields: ['contactMethod', 'customQuestions']
  },
  {
    id: 'preview',
    title: 'Preview & Publish',
    subtitle: 'Review and publish your job',
    icon: Eye,
    fields: []
  }
];

const PRESET_BENEFITS = [
  { icon: '🏥', title: 'Health Insurance', description: 'Medical, dental, and vision coverage' },
  { icon: '🌴', title: 'Paid Time Off', description: 'Vacation days and sick leave' },
  { icon: '💰', title: 'Competitive Pay', description: 'Above-market compensation' },
  { icon: '🚗', title: 'Transportation', description: 'Company vehicle or gas allowance' },
  { icon: '📚', title: 'Training & Development', description: 'Professional growth opportunities' },
  { icon: '⏰', title: 'Flexible Schedule', description: 'Work-life balance options' },
  { icon: '🍽️', title: 'Meal Benefits', description: 'Free meals or food allowance' },
  { icon: '👔', title: 'Uniform Provided', description: 'Work clothes and equipment' },
  { icon: '🔧', title: 'Tool Allowance', description: 'Equipment and supplies provided' },
  { icon: '🎯', title: 'Performance Bonuses', description: 'Merit-based incentives' },
];

export default function PostJobWizard({
  onComplete,
  onCancel,
  initialData = {},
  credits,
  isPublishing = false
}: PostJobWizardProps) {
  const { user } = useUser();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [jobData, setJobData] = useState<JobData>({
    title: '',
    location: '',
    salary: '',
    description: '',
    responsibilities: '',
    requirements: '',
    contactMethod: user?.emailAddresses?.[0]?.emailAddress || '',
    schedule: '',
    benefits: '',
    requiresDegree: false,
    customQuestions: [],
    company: '',
    companyLogo: '',
    benefitOptions: [],
    ...initialData
  });
  
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft on component mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('draft_job_posting');
      if (draft && !initialData.title) {
        const parsedDraft = JSON.parse(draft);
        const draftAge = Date.now() - new Date(parsedDraft.lastSaved).getTime();
        // Only restore if draft is less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setJobData(prev => ({ ...prev, ...parsedDraft }));
          setCurrentStep(parsedDraft.currentStep || 0);
          setLastSaved(new Date(parsedDraft.lastSaved));
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (currentStep > 0 && jobData.title) {
        setIsAutoSaving(true);
        // Save to localStorage as backup
        try {
          localStorage.setItem('draft_job_posting', JSON.stringify({
            ...jobData,
            lastSaved: new Date().toISOString(),
            currentStep
          }));
          setTimeout(() => {
            setIsAutoSaving(false);
            setLastSaved(new Date());
          }, 300);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setIsAutoSaving(false);
        }
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [jobData, currentStep]);

  const updateJobData = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const currentStepData = STEPS[currentStep];
    const errors: Record<string, string> = {};
    
    currentStepData.fields.forEach(field => {
      if (field === 'title' && !jobData.title.trim()) {
        errors.title = 'Job title is required';
      }
      if (field === 'location' && !jobData.location.trim()) {
        errors.location = 'Location is required';
      }
      if (field === 'description' && !jobData.description.trim()) {
        errors.description = 'Job description is required';
      }
      if (field === 'contactMethod' && !jobData.contactMethod.trim()) {
        errors.contactMethod = 'Contact method is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      // Clear draft from localStorage when submitting
      try {
        localStorage.removeItem('draft_job_posting');
      } catch (error) {
        console.error('Failed to clear draft:', error);
      }
      onComplete(jobData);
    }
  };

  const addBenefit = (benefit: { icon: string; title: string; description: string }) => {
    const newBenefit: BenefitOption = {
      ...benefit,
      value: true,
      key: `benefit_${Date.now()}`
    };
    updateJobData('benefitOptions', [...(jobData.benefitOptions || []), newBenefit]);
  };

  const removeBenefit = (key: string) => {
    updateJobData(
      'benefitOptions',
      jobData.benefitOptions?.filter(b => b.key !== key) || []
    );
  };

  const getStepCompletion = (stepIndex: number): 'complete' | 'current' | 'incomplete' => {
    if (stepIndex < currentStep) return 'complete';
    if (stepIndex === currentStep) return 'current';
    return 'incomplete';
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobData.title}
                onChange={(e) => updateJobData('title', e.target.value)}
                placeholder="e.g., Warehouse Associate, Customer Service Rep"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  validationErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={jobData.location}
                onChange={(e) => updateJobData('location', e.target.value)}
                placeholder="e.g., Stockton, CA or Modesto, CA"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  validationErrors.location ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                value={jobData.salary}
                onChange={(e) => updateJobData('salary', e.target.value)}
                placeholder="e.g., $18-22/hour or $45,000-55,000/year"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Jobs with salary ranges get 3x more applications
              </p>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <div className="relative">
                <textarea
                  value={jobData.description}
                  onChange={(e) => updateJobData('description', e.target.value)}
                  placeholder="Tell candidates about this role, your company, and what makes it great..."
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {jobData.description.length}/2000
                </div>
              </div>
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Responsibilities
              </label>
              <textarea
                value={jobData.responsibilities}
                onChange={(e) => updateJobData('responsibilities', e.target.value)}
                placeholder="• Process orders and shipments&#10;• Maintain inventory accuracy&#10;• Collaborate with team members..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                List 3-5 key daily tasks. Use bullet points for clarity.
              </p>
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements & Qualifications
              </label>
              <textarea
                value={jobData.requirements}
                onChange={(e) => updateJobData('requirements', e.target.value)}
                placeholder="• High school diploma or equivalent&#10;• 1+ years customer service experience&#10;• Ability to lift 50 lbs..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                List must-have qualifications. Keep it realistic to attract more candidates.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresDegree"
                  checked={jobData.requiresDegree}
                  onChange={(e) => updateJobData('requiresDegree', e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresDegree" className="text-sm font-medium text-gray-700">
                  Requires college degree
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-7">
                Jobs without degree requirements get 25% more applications
              </p>
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Benefits & Perks
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_BENEFITS.map((benefit, index) => {
                  const isSelected = jobData.benefitOptions?.some(b => b.title === benefit.title);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (isSelected) {
                          removeBenefit(jobData.benefitOptions?.find(b => b.title === benefit.title)?.key || '');
                        } else {
                          addBenefit(benefit);
                        }
                      }}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">{benefit.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                          <p className="text-xs text-gray-500 truncate">{benefit.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Schedule
              </label>
              <input
                type="text"
                value={jobData.schedule || ''}
                onChange={(e) => updateJobData('schedule', e.target.value)}
                placeholder="e.g., Monday-Friday 8am-5pm, Flexible hours, Weekend shifts available"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Notification Email *
              </label>
              <input
                type="email"
                value={jobData.contactMethod}
                onChange={(e) => updateJobData('contactMethod', e.target.value)}
                placeholder="your-email@company.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  validationErrors.contactMethod ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.contactMethod && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.contactMethod}</p>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Candidates apply directly on your job posting. You'll receive 
                  an email notification at this address when someone applies, and all applications will be 
                  available in your employer dashboard for easy management.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Application Questions (Optional)
              </label>
              <textarea
                value={jobData.customQuestions?.join('\n') || ''}
                onChange={(e) => updateJobData('customQuestions', e.target.value.split('\n').filter(q => q.trim()))}
                placeholder="What experience do you have with warehouse equipment?&#10;Why are you interested in this role?&#10;What's your availability for shifts?"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>Add your own questions</strong> - one per line, 3-4 questions max
                </p>
                <p className="text-xs text-gray-500">
                  These questions will be asked when candidates apply, in addition to uploading their resume.
                </p>
              </div>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{jobData.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  {jobData.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {jobData.company}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {jobData.location}
                  </div>
                  {jobData.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {jobData.salary}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">About This Role</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{jobData.description}</p>
                </div>

                {jobData.responsibilities && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What You'll Do</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{jobData.responsibilities}</p>
                  </div>
                )}

                {jobData.requirements && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What We're Looking For</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{jobData.requirements}</p>
                  </div>
                )}

                {jobData.benefitOptions && jobData.benefitOptions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What We Offer</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {jobData.benefitOptions.map((benefit) => (
                        <div key={benefit.key} className="flex items-center space-x-2 text-sm text-gray-700">
                          <span>{benefit.icon}</span>
                          <span>{benefit.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Credits warning if needed */}
            {credits && credits.universal < 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      You need 1 credit to publish this job
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      You have {credits.universal} credits remaining. Purchase more credits to publish.
                    </p>
                    <button
                      onClick={() => router.push('/employers/credits')}
                      className="mt-2 text-sm text-amber-800 hover:text-amber-900 font-medium underline"
                    >
                      Buy Credits →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Post a Job</h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save indicator */}
              {isAutoSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Save className="h-4 w-4 animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
              {lastSaved && !isAutoSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              
              {/* Credits display */}
              {credits && (
                <div className="flex items-center space-x-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {credits.universal} credits
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {STEPS.map((step, index) => {
              const status = getStepCompletion(index);
              const StepIcon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 flex-shrink-0 ${
                    index < STEPS.length - 1 ? 'min-w-0' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      status === 'complete'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {status === 'complete' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${
                      status === 'current' ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-gray-200 ml-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {STEPS[currentStep].subtitle}
            </p>
          </div>

          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isPublishing || !credits || credits.universal < 1}
              className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Job...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Publish Job</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}