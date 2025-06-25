'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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

interface TraditionalJobForm {
  title: string;
  company: string;
  location: string;
  customLocation: string;
  type: string;
  description: string;
  requirements: string;
  salaryMin: string;
  salaryMax: string;
  contactEmail: string;
  contactMethod: string;
  dealBreakers: string;
  priorities: string;
  urgency: string;
}

export default function TraditionalJobPostPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [form, setForm] = useState<TraditionalJobForm>({
    title: '',
    company: '',
    location: '',
    customLocation: '',
    type: 'full_time',
    description: '',
    requirements: '',
    salaryMin: '',
    salaryMax: '',
    contactEmail: '',
    contactMethod: 'email',
    dealBreakers: '',
    priorities: '',
    urgency: 'normal',
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

  // Authentication check
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Auto-fill user email
  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      setForm(prev => ({
        ...prev,
        contactEmail: user.emailAddresses[0]?.emailAddress || '',
      }));
    }
  }, [user]);

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
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        salary: form.salaryMin && form.salaryMax 
          ? `$${form.salaryMin}-${form.salaryMax}` 
          : form.salaryMin 
            ? `$${form.salaryMin}+` 
            : form.salaryMax 
              ? `Up to $${form.salaryMax}` 
              : 'Competitive',
        location: finalLocation,
        jobType: form.type,
        contactMethod: form.contactMethod,
        urgency: form.urgency,
        dealBreakers: form.dealBreakers.split(',').map(s => s.trim()).filter(s => s.length > 0),
        priorities: form.priorities.split(',').map(s => s.trim()).filter(s => s.length > 0),
      };

      // Return to main job posting flow with this data
      const params = new URLSearchParams({
        method: 'traditional-form',
        data: JSON.stringify(jobData)
      });
      
      router.push(`/employers/create-job-post?${params.toString()}`);

    } catch (error) {
      console.error('Form processing error:', error);
      setErrors({ submit: 'Failed to process form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/employers/create-job-post')}
              className="mr-4 p-2 text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Traditional Job Form</h1>
              <p className="mt-1 text-gray-600">Create your job post with our detailed form</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                {/* Company */}
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
              </div>

              {/* Location */}
              <div className="mt-6">
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

                {/* Custom location input */}
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
                  </div>
                )}
              </div>
            </div>

            {/* Job Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              
              {/* Job Type and Salary */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
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
                    onChange={e => setForm({ ...form, salaryMin: e.target.value })}
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
                    onChange={e => setForm({ ...form, salaryMax: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="60000"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
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
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Requirements (optional)
                </label>
                <textarea
                  value={form.requirements}
                  onChange={e => setForm({ ...form, requirements: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="List the specific skills, experience, or qualifications needed..."
                />
              </div>
            </div>

            {/* Application Preferences Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                {/* Contact Method */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred Contact Method
                  </label>
                  <select
                    value={form.contactMethod}
                    onChange={e => setForm({ ...form, contactMethod: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="both">Email and Phone</option>
                    <option value="apply_in_person">Apply in Person</option>
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Hiring Urgency
                  </label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal (within 30 days)</option>
                    <option value="urgent">Urgent (within 2 weeks)</option>
                    <option value="asap">ASAP (within 1 week)</option>
                    <option value="flexible">Flexible timeline</option>
                  </select>
                </div>
              </div>

              {/* Deal Breakers */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Deal Breakers (optional)
                </label>
                <input
                  type="text"
                  value={form.dealBreakers}
                  onChange={e => setForm({ ...form, dealBreakers: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., No weekends, Must have car, No remote work (separate with commas)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Things that would automatically disqualify a candidate
                </p>
              </div>

              {/* Priorities */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Top Priorities (optional)
                </label>
                <input
                  type="text"
                  value={form.priorities}
                  onChange={e => setForm({ ...form, priorities: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customer service experience, Bilingual, Team player (separate with commas)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  What you're looking for most in candidates
                </p>
              </div>

              {/* Contact Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="hiring@company.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
                )}
              </div>
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Continue to Preview
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}