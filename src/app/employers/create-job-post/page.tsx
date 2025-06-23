'use client';

import { useState, useEffect } from 'react';
// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Heart,
  TrendingUp,
  Gift,
  MessageSquare,
  Upload,
  Eye,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Check,
} from 'lucide-react';
// Removed upsell and modal imports - Job Post Optimizer is now streamlined

interface JobPostForm {
  // Basic Info
  jobTitle: string;
  companyName: string;
  location: string;
  pay: string;
  schedule: string;

  // Role + Culture Details
  companyDescription: string;
  idealFit: string;
  culture: string;
  growthPath: string;
  perks: string;

  // Call to Action
  applicationCTA: string;

  // Media
  mediaUrls: string[];

  // New job post enhancements
  degreeRequired: boolean;
  salaryRangeMin: string;
  salaryRangeMax: string;
  internalTags: string[];

  // Supplemental Questions
  supplementalQuestions: string[];

  // Upsells
  socialMediaShoutout: boolean;
  placementBump: boolean;
  upsellBundle: boolean;
  upsellTotal: number;
}

export default function CreateJobPostPage() {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin', name: 'Mock User', id: 'mock-user-id' } };
  const status = 'authenticated';
  const router = useRouter();

  const [form, setForm] = useState<JobPostForm>({
    jobTitle: '',
    companyName: '',
    location: '',
    pay: '',
    schedule: '',
    companyDescription: '',
    idealFit: '',
    culture: '',
    growthPath: '',
    perks: '',
    applicationCTA: '',
    mediaUrls: [],
    degreeRequired: false,
    salaryRangeMin: '',
    salaryRangeMax: '',
    internalTags: [],
    supplementalQuestions: [],
    socialMediaShoutout: false,
    placementBump: false,
    upsellBundle: false,
    upsellTotal: 0,
  });

  // Auto-fill company data from onboarding
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch('/api/employers/onboarding');
        if (response.ok) {
          const data = await response.json();
          if (data.onboardingCompleted && data.data) {
            setForm(prev => ({
              ...prev,
              companyName: data.data.companyName || prev.companyName,
              location: data.data.businessLocation || prev.location,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    if (true) {
      fetchCompanyData();
    }
  }, [status]);

  // Job Post Optimizer is now accessible to all employers without credit requirements

  // Clean up URL parameters if any
  useEffect(() => {
    // Skip during build or if environment is not ready
    if (typeof window === 'undefined' || (process.env.NODE_ENV === 'production' && process.env.NETLIFY)) {
      return;
    }
    
    try {
      // Only access window in browser environment
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('purchase_success') === 'true') {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (error) {
      console.error('Error cleaning up URL parameters:', error);
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedListing, setGeneratedListing] = useState<string>('');
  const [editedListing, setEditedListing] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [skipAI, setSkipAI] = useState(false);
  const [optimizerJobId, setOptimizerJobId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAutofilling, setIsAutofilling] = useState(false);

  // Check authentication
  if (false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user || (session!.user as any).role !== 'employer') {
    router.push('/employers/signin');
    return null;
  }

  const handleInputChange = (field: keyof JobPostForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation for manual job posts
  const validateManualJobPost = (content: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!content.trim()) {
      errors.push('Job post content cannot be empty');
      return { isValid: false, errors };
    }

    if (content.trim().length < 100) {
      errors.push('Job post content should be at least 100 characters long');
    }

    // Check for basic required sections
    const lowerContent = content.toLowerCase();
    const hasJobTitle = lowerContent.includes(form.jobTitle.toLowerCase()) ||
                       lowerContent.includes('position') ||
                       lowerContent.includes('role') ||
                       lowerContent.includes('job');

    const hasCompany = lowerContent.includes(form.companyName.toLowerCase()) ||
                      lowerContent.includes('company') ||
                      lowerContent.includes('we are') ||
                      lowerContent.includes('our team');

    const hasLocation = lowerContent.includes(form.location.toLowerCase()) ||
                       lowerContent.includes('location') ||
                       lowerContent.includes('209') ||
                       lowerContent.includes('stockton') ||
                       lowerContent.includes('modesto') ||
                       lowerContent.includes('tracy');

    const hasResponsibilities = lowerContent.includes('responsibilities') ||
                               lowerContent.includes('duties') ||
                               lowerContent.includes('will') ||
                               lowerContent.includes('you will') ||
                               lowerContent.includes('role involves');

    const hasRequirements = lowerContent.includes('requirements') ||
                           lowerContent.includes('qualifications') ||
                           lowerContent.includes('experience') ||
                           lowerContent.includes('skills') ||
                           lowerContent.includes('must have');

    if (!hasJobTitle) {
      errors.push('Consider mentioning the job title or position in your content');
    }

    if (!hasCompany) {
      errors.push('Consider mentioning your company name or describing your organization');
    }

    if (!hasLocation) {
      errors.push('Consider mentioning the job location or 209 area');
    }

    if (!hasResponsibilities) {
      errors.push('Consider describing job responsibilities or what the role involves');
    }

    if (!hasRequirements) {
      errors.push('Consider listing job requirements, qualifications, or desired skills');
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleAutofill = async () => {
    if (!form.jobTitle.trim()) {
      setErrors({ jobTitle: 'Please enter a job title first' });
      return;
    }

    setIsAutofilling(true);
    try {
      const response = await fetch('/api/job-post-optimizer/autofill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: form.jobTitle,
          companyName: form.companyName,
          location: form.location,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const template = data.templateContent;

        setForm(prev => ({
          ...prev,
          schedule: template.schedule || prev.schedule,
          companyDescription: template.companyDescription || prev.companyDescription,
          idealFit: template.idealFit || prev.idealFit,
          culture: template.culture || prev.culture,
          growthPath: template.growthPath || prev.growthPath,
          perks: template.perks || prev.perks,
          applicationCTA: template.applicationCTA || prev.applicationCTA,
        }));
      } else {
        const errorData = await response.json();
        setErrors({ autofill: errorData.error || 'Failed to generate template' });
      }
    } catch (error) {
      setErrors({ autofill: 'Failed to generate template. Please try again.' });
    } finally {
      setIsAutofilling(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!form.companyName.trim())
      newErrors.companyName = 'Company name is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';

    // Note: degreeRequired is a boolean, so we don't need to validate it as it defaults to false

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // If user chose to skip AI, go directly to manual editing
    if (skipAI) {
      setGeneratedListing('');
      setEditedListing('');
      setIsEditing(true);
      setShowPreview(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/job-post-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          salaryRangeMin: form.salaryRangeMin ? parseInt(form.salaryRangeMin) : undefined,
          salaryRangeMax: form.salaryRangeMax ? parseInt(form.salaryRangeMax) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedListing(data.aiGeneratedOutput);
        setEditedListing(data.aiGeneratedOutput); // Initialize edited content with AI output
        setOptimizerJobId(data.id);
        setIsEditing(false); // Start in preview mode, not editing mode
        setShowPreview(true);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to optimize job post' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to create job post. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // If user skipped AI, create a new optimizer record first
      if (skipAI) {
        // Validate manual job post content
        const validation = validateManualJobPost(editedListing);
        if (!validation.isValid) {
          setErrors({
            publish: `Please improve your job post:\n• ${validation.errors.join('\n• ')}`
          });
          setIsPublishing(false);
          return;
        }

        // Create optimizer record for manual job post
        const createResponse = await fetch('/api/job-post-optimizer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            salaryRangeMin: form.salaryRangeMin ? parseInt(form.salaryRangeMin) : undefined,
            salaryRangeMax: form.salaryRangeMax ? parseInt(form.salaryRangeMax) : undefined,
            manualContent: editedListing, // Send manual content
            skipAI: true, // Flag to indicate this is manual
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          setErrors({ publish: errorData.error || 'Failed to create job post' });
          setIsPublishing(false);
          return;
        }

        const createData = await createResponse.json();
        setOptimizerJobId(createData.id);
      }

      // If we have edited content, update the optimizer record
      if (editedListing && editedListing !== generatedListing && optimizerJobId) {
        await fetch(`/api/job-post-optimizer/${optimizerJobId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            editedContent: editedListing,
          }),
        });
      }

      // Now publish the job
      const publishResponse = await fetch(
        `/api/job-post-optimizer/${optimizerJobId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            useEditedContent: !!editedListing,
          }),
        }
      );

      if (publishResponse.ok) {
        const publishData = await publishResponse.json();
        // Redirect to the published job or employer dashboard
        router.push(`/employers/my-jobs?published=${publishData.jobId}`);
      } else {
        const errorData = await publishResponse.json();

        // Handle specific error codes
        if (publishResponse.status === 402) {
          if (errorData.code === 'CREDITS_REQUIRED') {
            setErrors({
              publish: 'Job posting credits required to publish. Please purchase credits to continue.'
            });
            // Optionally redirect to dashboard after a delay
            setTimeout(() => {
              router.push('/employers/dashboard');
            }, 3000);
            return;
          } else if (errorData.code === 'CREDIT_USAGE_FAILED') {
            setErrors({
              publish: 'Failed to process credit payment. Please try again or contact support if the issue persists.'
            });
            return;
          }
        } else if (publishResponse.status === 400) {
          if (errorData.code === 'INVALID_DESCRIPTION') {
            setErrors({
              publish: 'Please add more content to your job description. It should be at least 50 characters long and include details about the position.'
            });
            return;
          } else if (errorData.code === 'MISSING_TITLE') {
            setErrors({
              publish: 'Job title is required. Please add a job title and try again.'
            });
            return;
          } else if (errorData.code === 'MISSING_COMPANY') {
            setErrors({
              publish: 'Company name is required. Please add a company name and try again.'
            });
            return;
          } else if (errorData.code === 'MISSING_LOCATION') {
            setErrors({
              publish: 'Location is required. Please add a location and try again.'
            });
            return;
          }
        }

        setErrors({
          publish: errorData.error || 'Failed to publish job post. Please check your content and try again.'
        });
      }
    } catch (error) {
      console.error('Publish error:', error);
      setErrors({ publish: 'Failed to publish job post. Please try again.' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Simple markdown-like renderer for preview
  const renderJobPost = (content: string) => {
    return content
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-3xl font-bold text-gray-900 mb-4">$1</h1>'
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-2xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-xl font-medium text-gray-900 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^\- \*\*(.*?):\*\* (.*$)/gm,
        '<div class="flex items-start mb-2"><span class="font-semibold text-gray-900 mr-2">$1:</span><span class="text-gray-700">$2</span></div>'
      )
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/gm, '<p class="mb-4">$1</p>')
      .replace(/<p class="mb-4"><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Job Post Optimizer
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Transform your basic job info into a compelling, high-converting job
            listing that attracts the right candidates
          </p>
        </div>

        {!showPreview ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center">
                <Briefcase className="mr-3 h-6 w-6 text-[#2d4a3e]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Basic Info
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Title *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={e =>
                        handleInputChange('jobTitle', e.target.value)
                      }
                      placeholder="e.g., Customer Service Representative"
                      className={`flex-1 rounded-lg border px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/20 ${
                        errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAutofill}
                      disabled={isAutofilling || !form.jobTitle.trim()}
                      className="rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] px-6 py-3 text-white font-medium hover:from-[#1d3a2e] hover:to-[#8fcf8f] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAutofilling ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2 inline-block"></div>
                          Filling...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 inline-block" />
                          Auto-Fill
                        </>
                      )}
                    </button>
                  </div>
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.jobTitle}
                    </p>
                  )}
                  {errors.autofill && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.autofill}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a job title and click "Auto-Fill" to generate template content for all sections below
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={e =>
                      handleInputChange('companyName', e.target.value)
                    }
                    placeholder="e.g., Acme Corp"
                    className={`w-full rounded-lg border px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                      errors.companyName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={e =>
                        handleInputChange('location', e.target.value)
                      }
                      placeholder="e.g., Stockton, CA"
                      className={`w-full rounded-lg border py-3 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                        errors.location ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Pay Rate
                    <span className="ml-1 text-xs text-gray-500">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.pay}
                      onChange={e => handleInputChange('pay', e.target.value)}
                      placeholder="e.g., $20-$25/hr or $45K/year"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Schedule
                    <span className="ml-1 text-xs text-gray-500">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.schedule}
                      onChange={e =>
                        handleInputChange('schedule', e.target.value)
                      }
                      placeholder="e.g., Mon-Fri, 8am-4pm"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Degree Requirement */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="degreeRequired"
                      checked={form.degreeRequired}
                      onChange={e => setForm(prev => ({ ...prev, degreeRequired: e.target.checked }))}
                      className="h-4 w-4 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300 rounded"
                    />
                    <label htmlFor="degreeRequired" className="text-sm font-medium text-gray-700">
                      Is a 4-year college degree required for this job? *
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This information helps candidates understand requirements and supports regional education insights
                  </p>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Salary Range Min
                    <span className="ml-1 text-xs text-gray-500">(optional, encouraged)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={form.salaryRangeMin}
                      onChange={e => setForm(prev => ({ ...prev, salaryRangeMin: e.target.value }))}
                      placeholder="35000"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Salary Range Max
                    <span className="ml-1 text-xs text-gray-500">(optional, encouraged)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={form.salaryRangeMax}
                      onChange={e => setForm(prev => ({ ...prev, salaryRangeMax: e.target.value }))}
                      placeholder="55000"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#ff6b35]">
                    💡 Including a salary range can boost applicant interest by up to 30%
                  </p>
                </div>
              </div>
            </div>

            {/* Role + Culture Details Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center">
                <Users className="mr-3 h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Role + Culture Details
                </h2>
                <div className="ml-auto">
                  <div className="flex items-center text-sm text-gray-500">
                    <HelpCircle className="mr-1 h-4 w-4" />
                    These help create compelling job descriptions
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What does your company do?
                    <span className="ml-1 text-xs text-gray-500">
                      (helps candidates understand your business)
                    </span>
                  </label>
                  <textarea
                    value={form.companyDescription}
                    onChange={e =>
                      handleInputChange('companyDescription', e.target.value)
                    }
                    placeholder="e.g., We're a family-owned medical practice serving the Stockton community for over 20 years..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What kind of person succeeds in this role?
                    <span className="ml-1 text-xs text-gray-500">
                      (personality traits, skills, experience)
                    </span>
                  </label>
                  <textarea
                    value={form.idealFit}
                    onChange={e =>
                      handleInputChange('idealFit', e.target.value)
                    }
                    placeholder="e.g., Someone who loves helping people, stays calm under pressure, and has great communication skills..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What's it like working there?
                    <span className="ml-1 text-xs text-gray-500">
                      (work environment, team culture)
                    </span>
                  </label>
                  <textarea
                    value={form.culture}
                    onChange={e => handleInputChange('culture', e.target.value)}
                    placeholder="e.g., Friendly team environment, supportive management, work-life balance is important to us..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What growth opportunities exist?
                    <span className="ml-1 text-xs text-gray-500">
                      (career advancement, training, development)
                    </span>
                  </label>
                  <textarea
                    value={form.growthPath}
                    onChange={e =>
                      handleInputChange('growthPath', e.target.value)
                    }
                    placeholder="e.g., Opportunities to advance to senior roles, paid training programs, tuition reimbursement..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What perks/benefits do you offer?
                    <span className="ml-1 text-xs text-gray-500">
                      (health insurance, PTO, flexible schedule, etc.)
                    </span>
                  </label>
                  <textarea
                    value={form.perks}
                    onChange={e => handleInputChange('perks', e.target.value)}
                    placeholder="e.g., Health insurance, 2 weeks PTO, flexible scheduling, employee discounts..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center">
                <MessageSquare className="mr-3 h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Call to Action
                </h2>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  What do you want applicants to do next?
                  <span className="ml-1 text-xs text-gray-500">
                    (how to apply, what to include)
                  </span>
                </label>
                <textarea
                  value={form.applicationCTA}
                  onChange={e =>
                    handleInputChange('applicationCTA', e.target.value)
                  }
                  placeholder="e.g., Send your resume to jobs@company.com or call (209) 555-0123 to schedule an interview..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Supplemental Questions Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center">
                <HelpCircle className="mr-3 h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Supplemental Questions
                </h2>
                <div className="ml-auto">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-1">📝</span>
                    Ask up to 10 custom questions
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Add custom questions that applicants will answer when they apply.
                  This helps you screen candidates and get the information you need upfront.
                </p>

                <div className="space-y-3">
                  {form.supplementalQuestions.map((question, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={question}
                        onChange={e => {
                          const newQuestions = [...form.supplementalQuestions];
                          newQuestions[index] = e.target.value;
                          setForm(prev => ({ ...prev, supplementalQuestions: newQuestions }));
                        }}
                        placeholder="e.g., What interests you most about this position?"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newQuestions = form.supplementalQuestions.filter((_, i) => i !== index);
                          setForm(prev => ({ ...prev, supplementalQuestions: newQuestions }));
                        }}
                        className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {form.supplementalQuestions.length < 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (form.supplementalQuestions.length < 10) {
                          setForm(prev => ({
                            ...prev,
                            supplementalQuestions: [...prev.supplementalQuestions, '']
                          }));
                        }
                      }}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <span className="w-8 h-8 border-2 border-dashed border-indigo-300 rounded-full flex items-center justify-center">
                        +
                      </span>
                      <span>Add Question ({form.supplementalQuestions.length}/10)</span>
                    </button>
                  )}
                </div>

                {form.supplementalQuestions.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">💡</span>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Pro tip:</p>
                        <p>Good questions help you find the right fit faster. Ask about experience, availability, motivations, or specific skills relevant to your role.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Optimization Choice */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Choose Your Approach
                </h3>
                <p className="text-sm text-gray-600">
                  How would you like to create your job post?
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="useAI"
                    name="optimizationChoice"
                    checked={!skipAI}
                    onChange={() => setSkipAI(false)}
                    className="mt-1 h-4 w-4 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300"
                  />
                  <div className="flex-1">
                    <label htmlFor="useAI" className="text-sm font-medium text-gray-900 cursor-pointer">
                      🤖 Use AI Optimization (Recommended)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Our AI will transform your job information into a compelling, professional job listing
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="skipAI"
                    name="optimizationChoice"
                    checked={skipAI}
                    onChange={() => setSkipAI(true)}
                    className="mt-1 h-4 w-4 text-[#2d4a3e] focus:ring-[#2d4a3e] border-gray-300"
                  />
                  <div className="flex-1">
                    <label htmlFor="skipAI" className="text-sm font-medium text-gray-900 cursor-pointer">
                      ✏️ Write Manually
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Skip AI optimization and write your job post content from scratch
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {skipAI ? 'Ready to create your job post?' : 'Ready to optimize your job post?'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {skipAI
                      ? 'You\'ll be able to write your job post content manually'
                      : 'Our AI will transform your info into a compelling job listing'
                    }
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-8 py-3 text-lg font-medium text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#ff5722] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                      {skipAI ? 'Creating...' : 'Optimizing...'}
                    </>
                  ) : (
                    <>
                      {skipAI ? (
                        <>
                          <MessageSquare className="mr-2 h-5 w-5" />
                          Create Job Post
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Optimize Job Post
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

              {errors.submit && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          </form>
        ) : (
          // Preview Section
          <div className="space-y-6">
            {/* Success Message */}
            <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-orange-50 p-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-[#9fdf9f] p-2">
                  {skipAI ? (
                    <MessageSquare className="h-6 w-6 text-[#2d4a3e]" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-[#2d4a3e]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2d4a3e]">
                    {skipAI ? 'Ready to Write Your Job Post!' : 'Job Post Optimized!'}
                  </h3>
                  <p className="text-gray-700">
                    {skipAI
                      ? 'Create your job post content manually using the editor below.'
                      : 'Your job listing has been transformed into a compelling, professional post using 209 Works AI optimization.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Preview/Editor */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    {isEditing ? 'Edit Your Job Post' : (skipAI ? 'Create Your Job Post' : 'Your Optimized Job Post')}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
                    >
                      ← Back to Form
                    </button>
                    {!skipAI && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
                      >
                        ✏️ Edit Content
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
                      >
                        👁️ Preview
                      </button>
                    )}
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || (skipAI && !editedListing.trim())}
                      className="rounded-lg bg-white px-6 py-2 font-medium text-[#2d4a3e] transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Job'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isEditing || skipAI ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Job Post Content
                      </label>
                      <div className="text-xs text-gray-500">
                        You can use basic markdown formatting (# for headers, ** for bold, etc.)
                      </div>
                    </div>

                    {skipAI && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          📝 Writing Tips for Effective Job Posts
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• <strong>Job Title:</strong> Include "{form.jobTitle}" and key responsibilities</li>
                          <li>• <strong>Company:</strong> Mention "{form.companyName}" and what makes you unique</li>
                          <li>• <strong>Location:</strong> Highlight "{form.location}" and 209 area benefits</li>
                          <li>• <strong>Responsibilities:</strong> List 3-5 main duties and expectations</li>
                          <li>• <strong>Requirements:</strong> Include skills, experience, and qualifications</li>
                          <li>• <strong>Benefits:</strong> Mention salary range, perks, and growth opportunities</li>
                          <li>• <strong>Call to Action:</strong> Clear instructions on how to apply</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2">
                          <strong>Minimum:</strong> 100+ characters. <strong>Recommended:</strong> 300-800 characters for best results.
                        </p>
                      </div>
                    )}

                    <textarea
                      value={editedListing}
                      onChange={(e) => setEditedListing(e.target.value)}
                      placeholder={skipAI
                        ? `Write your job post content here...\n\nExample:\n# ${form.jobTitle} at ${form.companyName}\n\n## About the Role\nWe're looking for a ${form.jobTitle.toLowerCase()} to join our team in ${form.location}...\n\n## What You'll Do\n- Handle customer inquiries and support\n- Collaborate with team members\n- Maintain accurate records\n\n## Requirements\n- Excellent communication skills\n- Previous experience preferred\n- Reliable and professional\n\n## Benefits\n- ${form.pay || 'Competitive salary'}\n- ${form.perks || 'Great benefits package'}\n- Growth opportunities\n\n## How to Apply\n${form.applicationCTA || 'Send your resume and cover letter to apply!'}`
                        : "Edit the AI-generated content here..."
                      }
                      rows={20}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/20 resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {editedListing.length} characters
                        {editedListing.length < 100 && (
                          <span className="text-amber-600 ml-2">
                            (Minimum 100 characters recommended)
                          </span>
                        )}
                      </div>

                      {skipAI && editedListing.length > 0 && (
                        <div className="text-xs">
                          {(() => {
                            const validation = validateManualJobPost(editedListing);
                            return validation.isValid ? (
                              <span className="text-green-600">✓ Ready to publish</span>
                            ) : (
                              <span className="text-amber-600">
                                {validation.errors.length} suggestion{validation.errors.length !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {skipAI && editedListing.length > 0 && (() => {
                      const validation = validateManualJobPost(editedListing);
                      return !validation.isValid && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <h5 className="text-sm font-medium text-amber-900 mb-1">
                            💡 Suggestions to improve your job post:
                          </h5>
                          <ul className="text-xs text-amber-800 space-y-1">
                            {validation.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <div
                      className="job-post-preview"
                      dangerouslySetInnerHTML={{
                        __html: renderJobPost(editedListing || generatedListing),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ready to publish?
                  </h3>
                  <p className="text-gray-600">
                    {skipAI && !editedListing.trim()
                      ? 'Please write your job post content before publishing.'
                      : 'Your job post is ready to be published and start receiving applications.'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    ← Back to Form
                  </button>
                  {!skipAI && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg border border-[#2d4a3e] px-6 py-3 text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e] hover:text-white"
                    >
                      ✏️ Edit Content
                    </button>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || (skipAI && !editedListing.trim())}
                    className="rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#ff5722] disabled:opacity-50"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Job Post'}
                  </button>
                </div>
              </div>

              {errors.publish && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-red-600">{errors.publish}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Removed all modal components - Job Post Optimizer is now streamlined without upsells */}
    </div>
  );
}
