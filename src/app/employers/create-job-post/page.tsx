'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import JobUpsellSelector from '@/components/job-posting/JobUpsellSelector';

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
    socialMediaShoutout: false,
    placementBump: false,
    upsellBundle: false,
    upsellTotal: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedListing, setGeneratedListing] = useState<string>('');
  const [optimizerJobId, setOptimizerJobId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'employer') {
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

  const handleUpsellChange = (selection: {
    socialMediaShoutout: boolean;
    placementBump: boolean;
    upsellBundle: boolean;
    total: number;
  }) => {
    setForm(prev => ({
      ...prev,
      socialMediaShoutout: selection.socialMediaShoutout,
      placementBump: selection.placementBump,
      upsellBundle: selection.upsellBundle,
      upsellTotal: selection.total,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!form.companyName.trim())
      newErrors.companyName = 'Company name is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';

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
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedListing(data.aiGeneratedOutput);
        setOptimizerJobId(data.id);
        setShowPreview(true);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to create job post' });
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
      const response = await fetch(
        `/api/job-post-optimizer/${optimizerJobId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Redirect to the published job or employer dashboard
        router.push(`/employers/my-jobs?published=${data.jobId}`);
      } else {
        const errorData = await response.json();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-green-600 p-3">
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
                <Briefcase className="mr-3 h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Basic Info
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={e =>
                      handleInputChange('jobTitle', e.target.value)
                    }
                    placeholder="e.g., Customer Service Representative"
                    className={`w-full rounded-lg border px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                      errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.jobTitle}
                    </p>
                  )}
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

            {/* Upsell Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <JobUpsellSelector
                onSelectionChange={handleUpsellChange}
                className="mb-6"
              />
            </div>

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
                  className="flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-8 py-3 text-lg font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
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
            <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-green-100 p-2">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Job Post Optimized!
                  </h3>
                  <p className="text-green-700">
                    Your job listing has been transformed into a compelling,
                    professional post.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4">
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
                      className="rounded-lg bg-white px-6 py-2 font-medium text-blue-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
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
    </div>
  );
}
