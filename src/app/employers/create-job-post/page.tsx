'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();
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

    if (status === 'authenticated') {
      fetchCompanyData();
    }
  }, [status]);

  // Job Post Optimizer is now accessible to all employers without credit requirements

  // Clean up URL parameters if any
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('purchase_success') === 'true') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedListing, setGeneratedListing] = useState<string>('');
  const [optimizerJobId, setOptimizerJobId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAutofilling, setIsAutofilling] = useState(false);

  // Check authentication
  if (status === 'loading') {
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

  // Removed upsell handling - Job Post Optimizer focuses purely on optimization

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
        setOptimizerJobId(data.id);
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
    if (!optimizerJobId) return;

    setIsPublishing(true);
    try {
      // Publish the job without upsells
      const publishResponse = await fetch(
        `/api/job-post-optimizer/${optimizerJobId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (publishResponse.ok) {
        const publishData = await publishResponse.json();
        // Redirect to the published job or employer dashboard
        router.push(`/employers/my-jobs?published=${publishData.jobId}`);
      } else {
        const errorData = await publishResponse.json();
        setErrors({ publish: errorData.error || 'Failed to publish job post' });
      }
    } catch (error) {
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

            {/* Removed upsell and credit package sections - Job Post Optimizer is now free to use */}

            {/* Submit Button */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ready to optimize your job post?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Our AI will transform your info into a compelling job
                    listing
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
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Optimize Job Post
                      <ArrowRight className="ml-2 h-5 w-5" />
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
                  <Sparkles className="h-6 w-6 text-[#2d4a3e]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2d4a3e]">
                    Job Post Optimized!
                  </h3>
                  <p className="text-gray-700">
                    Your job listing has been transformed into a compelling,
                    professional post using 209 Works AI optimization.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    Your Optimized Job Post
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="rounded-lg bg-white px-6 py-2 font-medium text-[#2d4a3e] transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Job'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="prose prose-lg max-w-none">
                  <div
                    className="job-post-preview"
                    dangerouslySetInnerHTML={{
                      __html: renderJobPost(generatedListing),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    What's next?
                  </h3>
                  <p className="text-gray-600">
                    You can edit your job post or publish it to start receiving
                    applications.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Make Changes
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
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
