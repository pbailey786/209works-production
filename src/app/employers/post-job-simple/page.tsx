'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';

import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Send,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface SimpleJobForm {
  title: string;
  company: string;
  location: string;
  customLocation: string;
  type: string;
  description: string;
  salaryMin: string;
  salaryMax: string;
  contactEmail: string;
}

export default function SimplePostJobPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [form, setForm] = useState<SimpleJobForm>({
    title: '',
    company: '',
    location: '',
    customLocation: '',
    type: 'full_time',
    description: '',
    salaryMin: '',
    salaryMax: '',
    contactEmail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const jobTypes = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
  ];

  const centralValleyLocations = [
    'Stockton, CA',
    'Modesto, CA',
    'Fresno, CA',
    'Visalia, CA',
    'Bakersfield, CA',
    'Tracy, CA',
    'Manteca, CA',
    'Lodi, CA',
    'Turlock, CA',
    'Merced, CA',
    'Ceres, CA',
    'Patterson, CA',
    'Newman, CA',
    'Gustine, CA',
    'Los Banos, CA',
    'Atwater, CA',
    'Livingston, CA',
    'Winton, CA',
    'Hilmar, CA',
    'Riverbank, CA',
  ];

  // Auto-fill user email
  useEffect(() => {
    if (user?.email) {
      setForm(prev => ({
        ...prev,
        contactEmail: user?.email || '',
      }));
    }
  }, [session]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = 'Job title is required';
    if (!form.company.trim()) newErrors.company = 'Company name is required';

    // Validate location - either dropdown selection or custom location
    if (!form.location) {
      newErrors.location = 'Location is required';
    } else if (form.location === 'other' && !form.customLocation.trim()) {
      newErrors.customLocation = 'Please specify the location';
    }

    if (!form.description.trim() || form.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }
    if (!form.contactEmail.trim())
      newErrors.contactEmail = 'Contact email is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Use custom location if "other" is selected, otherwise use dropdown value
      const finalLocation = form.location === 'other' ? form.customLocation : form.location;

      const jobData = {
        ...form,
        location: finalLocation, // Use the final location value
        categories: ['Other'], // Default category
        isRemote: false,
        url: undefined, // Don't send empty URL - let it be optional
        requirements: '',
        benefits: '',
        urgent: false,
        featured: false,
        source: 'free_basic_post', // Mark as free basic post
      };

      // Remove customLocation from the data sent to API since it's not needed
      const { customLocation, ...finalJobData } = jobData;

      console.log('🔍 DEBUG: Submitting job with data:', finalJobData);
      console.log('🔍 DEBUG: Session data:', session);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalJobData),
      });

      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('🔍 DEBUG: Response data:', responseData);

      if (response.ok) {
        console.log('✅ Job posted successfully!');
        router.push('/employers/dashboard?posted=true');
      } else {
        console.error('❌ Job posting failed:', responseData);

        // Handle specific error cases
        if (responseData.code === 'FREE_POST_LIMIT') {
          setErrors({
            submit: `${responseData.error} Your current job "${responseData.existingJobTitle}" is still active.`
          });
        } else if (responseData.code === 'CREDITS_REQUIRED') {
          // Redirect to upgrade page for credit-based posting
          router.push('/employers/upgrade?reason=job-posting');
          return;
        } else {
          setErrors({ submit: responseData.error || 'Failed to post job' });
        }
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setErrors({ submit: 'Failed to post job. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/employers/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
              <p className="mt-1 text-gray-600">Quick and simple job posting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. Customer Service Representative"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Company and Location */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Your company name"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <select
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value, customLocation: '' })}
                  className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select location</option>
                  {centralValleyLocations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                  <option value="other">Other (specify below)</option>
                </select>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}

                {/* Custom location input - only show when "other" is selected */}
                {form.location === 'other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={form.customLocation}
                      onChange={e => setForm({ ...form, customLocation: e.target.value })}
                      className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                        errors.customLocation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter city, state (e.g., Sacramento, CA)"
                    />
                    {errors.customLocation && (
                      <p className="mt-1 text-sm text-red-600">{errors.customLocation}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      💡 We focus on Central Valley jobs, but welcome nearby areas too!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Job Type and Salary */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job Type *
                </label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Min Salary (optional)
                </label>
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={e =>
                    setForm({ ...form, salaryMin: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="40000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Max Salary (optional)
                </label>
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={e =>
                    setForm({ ...form, salaryMax: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="60000"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Description *
              </label>
              <textarea
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={6}
                className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the job responsibilities, requirements, and what makes this role great..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {form.description.length} characters (minimum 50)
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                  errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="hiring@company.com"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactEmail}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              {errors.submit && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    Posting Job...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Post Job - FREE
                  </>
                )}
              </button>

              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-center text-sm text-blue-800">
                  📋 <strong>Free Plan:</strong> 1 active job post at a time, live for 7 days
                </p>
                <p className="mt-1 text-center text-xs text-blue-600">
                  ✨ Want multiple jobs or AI optimization? <a href="/employers/create-job-post" className="underline">Upgrade your plan</a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
