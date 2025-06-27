'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { MapPin, DollarSign, Briefcase, User, Sparkles, Eye } from 'lucide-react';

interface JobData {
  title: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  contactMethod: string;
}

export default function PostJobPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [jobData, setJobData] = useState<JobData>({
    title: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    contactMethod: ''
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);

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

  // Smart autofill suggestions based on job title
  const getSalaryAutofill = (title: string): string => {
    const lowTitle = title.toLowerCase();
    if (lowTitle.includes('cashier') || lowTitle.includes('retail')) return '$14-16/hr';
    if (lowTitle.includes('warehouse') || lowTitle.includes('driver')) return '$17-20/hr';
    if (lowTitle.includes('janitor') || lowTitle.includes('cleaner')) return '$15-18/hr';
    if (lowTitle.includes('cook') || lowTitle.includes('kitchen')) return '$16-19/hr';
    if (lowTitle.includes('receptionist') || lowTitle.includes('office')) return '$15-18/hr';
    if (lowTitle.includes('mechanic')) return '$20-25/hr';
    if (lowTitle.includes('server') || lowTitle.includes('waitress')) return '$12/hr + tips';
    return '';
  };

  // Auto-suggest location based on common Central Valley cities
  const getLocationSuggestions = (input: string): string[] => {
    const cities = ['Stockton, CA', 'Modesto, CA', 'Fresno, CA', 'Merced, CA', 'Turlock, CA', 'Tracy, CA', 'Manteca, CA', 'Lodi, CA'];
    return cities.filter(city => city.toLowerCase().includes(input.toLowerCase())).slice(0, 3);
  };

  // Handle input changes
  const handleInputChange = (field: keyof JobData, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    setLastTypingTime(Date.now());
    
    // Smart autofill for salary when title changes
    if (field === 'title' && value && !jobData.salary) {
      const suggestedSalary = getSalaryAutofill(value);
      if (suggestedSalary) {
        setJobData(prev => ({ ...prev, salary: suggestedSalary }));
      }
    }
    
    // Show AI help after pause on description
    if (field === 'description' && !value) {
      setTimeout(() => {
        if (Date.now() - lastTypingTime > 2000 && jobData.title && !jobData.description) {
          setShowAIHelp(true);
        }
      }, 2500);
    }
  };

  // Generate AI description
  const generateAIDescription = async () => {
    if (!jobData.title) return;
    
    setShowAIHelp(false);
    try {
      const response = await fetch('/api/employers/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: jobData.title, 
          location: jobData.location,
          salary: jobData.salary 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobData(prev => ({ 
          ...prev, 
          description: data.description,
          requirements: data.requirements || prev.requirements
        }));
      }
    } catch (error) {
      console.error('Failed to generate AI description:', error);
    }
  };

  // Publish job
  const handlePublish = async () => {
    if (!jobData.title || !jobData.location || !jobData.salary) {
      alert('Please fill in job title, location, and salary');
      return;
    }
    
    setIsPublishing(true);
    try {
      const response = await fetch('/api/employers/publish-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (response.ok) {
        const data = await response.json();
        router.push(`/employers/jobs/${data.jobId}?published=true`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to publish job');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish job. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Check if form is ready
  const isReady = jobData.title && jobData.location && jobData.salary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Job</h1>
          <p className="text-gray-600 mt-2">Reach thousands of job seekers in the Central Valley</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Cashier, Warehouse Associate, Driver"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={jobData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. Stockton, CA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Salary *
                </label>
                <input
                  type="text"
                  value={jobData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="e.g. $15/hr, $16-18/hr, $35,000/year"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                  {showAIHelp && (
                    <button
                      onClick={generateAIDescription}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Need help? Generate one!
                    </button>
                  )}
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the main duties and responsibilities..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements (Optional)
                </label>
                <textarea
                  value={jobData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="e.g. Must be 18+, Valid driver's license, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  How to Apply *
                </label>
                <input
                  type="text"
                  value={jobData.contactMethod}
                  onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                  placeholder="email@company.com or (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Publish Button */}
            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handlePublish}
                disabled={!isReady || isPublishing}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium text-lg transition-all ${
                  isReady && !isPublishing
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isPublishing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>🚀 Post Job - 1 Credit</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {isReady ? 'Ready to publish!' : 'Fill in required fields to continue'}
              </p>
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-600" />
              Live Preview
            </h3>

            {!jobData.title ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Start typing to see your job post preview</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6">
                {/* Job Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{jobData.title}</h2>
                  <div className="flex items-center space-x-4 text-gray-600 mt-2">
                    {jobData.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {jobData.location}
                      </span>
                    )}
                    {jobData.salary && (
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {jobData.salary}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {jobData.description && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{jobData.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {jobData.requirements && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{jobData.requirements}</p>
                  </div>
                )}

                {/* Contact */}
                {jobData.contactMethod && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-1">How to Apply</h4>
                    <p className="text-green-800">{jobData.contactMethod}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}