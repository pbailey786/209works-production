'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import JobPostingMethodSelector from '@/components/employers/JobPostingMethodSelector';
import AIJobCreationChat from '@/components/employers/AIJobCreationChat';
import CSVBulkUpload from '@/components/employers/CSVBulkUpload';
import JobAdBuilder from '@/components/employers/JobAdBuilder';

interface JobData {
  title?: string;
  company?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
  schedule?: string;
  benefits?: string;
}

type JobPostingStep = 'method-selection' | 'ai-chat' | 'csv-upload' | 'traditional-form' | 'job-builder' | 'preview' | 'credits' | 'published';

export default function CreateJobPostPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<JobPostingStep>('method-selection');
  const [selectedMethod, setSelectedMethod] = useState<'ai-chat' | 'traditional-form' | 'bulk-csv' | null>(null);
  const [jobData, setJobData] = useState<JobData>({});
  const [bulkJobs, setBulkJobs] = useState<any[]>([]);

  // Check for returning data from traditional form or other sources
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const method = params.get('method');
    const data = params.get('data');
    
    if (method === 'traditional-form' && data) {
      try {
        const parsedData = JSON.parse(data);
        setJobData(parsedData);
        setSelectedMethod('traditional-form');
        setCurrentStep('job-builder');
        // Clean up URL
        router.replace('/employers/create-job-post', { scroll: false });
      } catch (error) {
        console.error('Error parsing traditional form data:', error);
      }
    }
  }, [router]);

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

  // Handle method selection
  const handleMethodSelect = (method: 'ai-chat' | 'traditional-form' | 'bulk-csv') => {
    setSelectedMethod(method);
    
    switch (method) {
      case 'ai-chat':
        setCurrentStep('ai-chat');
        break;
      case 'bulk-csv':
        setCurrentStep('csv-upload');
        break;
      case 'traditional-form':
        // Redirect to the existing traditional form
        router.push('/employers/create-job-post/traditional');
        break;
    }
  };

  // Handle AI chat completion
  const handleAIJobComplete = (data: JobData) => {
    setJobData(data);
    setCurrentStep('job-builder');
  };

  // Handle CSV bulk upload completion
  const handleCSVJobsProcessed = (jobs: any[]) => {
    setBulkJobs(jobs);
    setCurrentStep('preview');
  };

  // Handle job builder completion
  const handleJobBuilderComplete = (finalJobData: JobData) => {
    setJobData(finalJobData);
    setCurrentStep('preview');
  };

  // Handle job builder back
  const handleJobBuilderBack = () => {
    if (selectedMethod === 'ai-chat') {
      setCurrentStep('ai-chat');
    } else {
      setCurrentStep('method-selection');
    }
  };

  // Handle job preview completion (individual job)
  const handleJobPreviewComplete = (finalJobData: JobData) => {
    // Check credits and either proceed to payment or publish
    setCurrentStep('credits');
  };

  // Handle bulk preview completion
  const handleBulkPreviewComplete = (finalJobs: any[]) => {
    // Check credits for bulk posting
    setCurrentStep('credits');
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'method-selection':
        return <JobPostingMethodSelector onSelectMethod={handleMethodSelect} />;
      
      case 'ai-chat':
        return <AIJobCreationChat onJobComplete={handleAIJobComplete} />;
      
      case 'csv-upload':
        return <CSVBulkUpload onJobsProcessed={handleCSVJobsProcessed} />;
      
      case 'job-builder':
        return (
          <JobAdBuilder 
            initialData={jobData}
            onBack={handleJobBuilderBack}
            onContinue={handleJobBuilderComplete}
          />
        );
      
      case 'preview':
        if (bulkJobs.length > 0) {
          return (
            <div className="max-w-6xl mx-auto p-6">
              <h2 className="text-3xl font-bold mb-6">Review Your {bulkJobs.length} Job Posts</h2>
              <div className="grid gap-6">
                {bulkJobs.map((job, index) => (
                  <div key={index} className="bg-white border rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                    <p className="text-gray-600 mb-2">{job.location} • {job.salary}</p>
                    <p className="text-gray-700 mb-4">{job.description?.substring(0, 200)}...</p>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 border rounded text-sm">Edit</button>
                      <button className="px-4 py-2 border rounded text-sm">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={() => handleBulkPreviewComplete(bulkJobs)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue to Payment ({bulkJobs.length} jobs)
                </button>
              </div>
            </div>
          );
        } else {
          return (
            <div className="max-w-4xl mx-auto p-6">
              <h2 className="text-3xl font-bold mb-6">Review Your Job Post</h2>
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4">{jobData.title}</h3>
                <div className="space-y-4">
                  <div><strong>Location:</strong> {jobData.location}</div>
                  <div><strong>Salary:</strong> {jobData.salary}</div>
                  <div><strong>Job Type:</strong> {jobData.jobType}</div>
                  <div><strong>Urgency:</strong> {jobData.urgency}</div>
                  <div><strong>Contact Method:</strong> {jobData.contactMethod}</div>
                  {jobData.description && (
                    <div>
                      <strong>Description:</strong>
                      <p className="mt-2 text-gray-700">{jobData.description}</p>
                    </div>
                  )}
                  {jobData.requirements && (
                    <div>
                      <strong>Requirements:</strong>
                      <p className="mt-2 text-gray-700">{jobData.requirements}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 text-center space-x-4">
                <button
                  onClick={() => setCurrentStep('job-builder')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back to Edit
                </button>
                <button
                  onClick={() => handleJobPreviewComplete(jobData)}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          );
        }
      
      case 'credits':
        return (
          <div className="max-w-3xl mx-auto p-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Almost Ready to Publish!</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                {bulkJobs.length > 0 ? `${bulkJobs.length} Job Posts` : '1 Job Post'}
              </h3>
              <p className="text-blue-700">
                Cost: {bulkJobs.length > 0 ? `${bulkJobs.length} credits` : '1 credit'}
              </p>
            </div>
            <div className="space-x-4">
              <button className="px-6 py-3 border border-gray-300 rounded-lg">
                Buy Credits
              </button>
              <button 
                onClick={() => setCurrentStep('published')}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Use Existing Credits & Publish
              </button>
            </div>
          </div>
        );
      
      case 'published':
        return (
          <div className="max-w-3xl mx-auto p-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="text-green-600 text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-green-900 mb-4">
                {bulkJobs.length > 0 ? 'Jobs Published!' : 'Job Published!'}
              </h2>
              <p className="text-green-700 mb-6">
                {bulkJobs.length > 0 
                  ? `Your ${bulkJobs.length} job posts are now live and candidates can start applying.`
                  : 'Your job post is now live and candidates can start applying.'
                }
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/employers/my-jobs')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  View My Jobs
                </button>
                <button
                  onClick={() => router.push('/employers/dashboard')}
                  className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return <JobPostingMethodSelector onSelectMethod={handleMethodSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {renderStep()}
    </div>
  );
}