'use client';

import React, { useState } from 'react';
import JobCard from '@/components/JobCard';
import EnhancedJobModal from '@/components/EnhancedJobModal';

// Sample job data for testing
const sampleJobs = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    type: 'Full-time',
    location: 'San Francisco, CA',
    postedAt: '2024-01-15',
    description:
      'We are looking for a talented Senior Software Engineer to join our dynamic team. You will be responsible for developing high-quality software solutions and leading technical initiatives.',
    url: 'https://example.com/apply/1',
    salaryMin: 120000,
    salaryMax: 180000,
    categories: ['Technology', 'Engineering'],
  },
  {
    id: 2,
    title: 'Product Marketing Manager',
    company: 'InnovateLabs',
    type: 'Full-time',
    location: 'New York, NY',
    postedAt: '2024-01-10',
    description:
      'Join our marketing team to drive product adoption and create compelling marketing campaigns. Experience with B2B marketing and analytics required.',
    url: 'https://example.com/apply/2',
    salaryMin: 90000,
    salaryMax: 130000,
    categories: ['Marketing', 'Product'],
  },
  {
    id: 3,
    title: 'Data Analyst',
    company: 'DataFlow Analytics',
    type: 'Contract',
    location: 'Remote',
    postedAt: '2024-01-12',
    description:
      'Analyze large datasets to provide actionable insights for business decisions. Strong SQL and Python skills required.',
    url: 'https://example.com/apply/3',
    salaryMin: 70000,
    salaryMax: 95000,
    categories: ['Data', 'Analytics'],
  },
  {
    id: 4,
    title: 'UX Designer',
    company: 'DesignStudio Pro',
    type: 'Part-time',
    location: 'Austin, TX',
    postedAt: '2024-01-08',
    description:
      'Create beautiful and intuitive user experiences for our digital products. Portfolio showcasing mobile and web design required.',
    url: 'https://example.com/apply/4',
    salaryMin: 60000,
    salaryMax: 85000,
    categories: ['Design', 'UX/UI'],
  },
];

export default function EnhancedJobModalDemo() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [isAuthenticated] = useState(true); // For demo purposes

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Handle opening modal with selected job
  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedJob(null);
  };

  // Handle saving job
  const handleSaveJob = (jobId: number) => {
    setSavedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  // Modal handlers
  const handleModalSave = async () => {
    if (selectedJob) {
      setSavedJobs(prev =>
        prev.includes(selectedJob.id)
          ? prev.filter(id => id !== selectedJob.id)
          : [...prev, selectedJob.id]
      );
    }
  };

  const handleModalShare = async () => {
    console.log('Sharing job:', selectedJob?.title);
  };

  const handleModalApply = async () => {
    console.log('Applying to job:', selectedJob?.title);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Enhanced Job Modal Demo
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Click "View Details" on any job card below to experience the
            enhanced job modal with comprehensive job information, tabbed
            navigation, and improved user experience.
          </p>
        </div>

        {/* Features Overview */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Enhanced Modal Features
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Tabbed Navigation (Overview, Details, Company, Apply)</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Rich Company Information & Testimonials</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Detailed Skills & Requirements Breakdown</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Salary Details & Benefits Breakdown</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Social Proof (Views, Applicants Count)</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Application Deadlines & Tips</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Save & Share Functionality</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Responsive Design & Accessibility</span>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sampleJobs.map(job => (
            <JobCard
              key={job.id}
              title={job.title}
              company={job.company}
              type={job.type}
              postedAt={formatDate(job.postedAt)}
              description={job.description}
              applyUrl={job.url}
              isFeatured={job.id === 1} // Make first job featured for demo
              onSave={() => handleSaveJob(job.id)}
              saved={savedJobs.includes(job.id)}
              onViewDetails={() => handleViewDetails(job)}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">
            Try These Features:
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Click "View Details" to open the enhanced modal with rich job
              information
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Navigate between tabs: Overview, Job Details, Company Info, and
              Apply
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Test the Save and Share functionality in the modal header
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Close the modal using the X button, clicking outside, or pressing
              Escape
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Notice the responsive design on different screen sizes
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-semibold">•</span>
              Experience smooth animations and transitions throughout
            </li>
          </ul>
        </div>

        {/* Enhanced Job Modal */}
        <EnhancedJobModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          job={selectedJob}
          onSave={handleModalSave}
          onApply={handleModalApply}
          onShare={handleModalShare}
          saved={selectedJob ? savedJobs.includes(selectedJob.id) : false}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
