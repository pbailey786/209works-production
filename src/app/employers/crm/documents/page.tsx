'use client';

import { useState } from 'react';

import {
  Download,
  FileText,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function DocumentVaultPage() {
  const [expandedJobs, setExpandedJobs] = useState<string[]>([]);

  // Mock data for job posts with applications
  const jobPosts = [
    {
      id: 'job-1',
      title: 'Senior Frontend Developer',
      location: 'Modesto, CA',
      postedDate: '2024-01-15',
      applicantCount: 24,
      resumeCount: 22,
      lastApplication: '2 hours ago',
      applications: [
        {
          id: 'app-1',
          name: 'Sarah Johnson',
          appliedDate: '2024-01-20',
          resumeUrl: '/resumes/sarah-johnson.pdf',
          hasResume: true,
        },
        {
          id: 'app-2',
          name: 'Mike Chen',
          appliedDate: '2024-01-19',
          resumeUrl: '/resumes/mike-chen.pdf',
          hasResume: true,
        },
        {
          id: 'app-3',
          name: 'Lisa Rodriguez',
          appliedDate: '2024-01-18',
          resumeUrl: '/resumes/lisa-rodriguez.pdf',
          hasResume: true,
        },
        {
          id: 'app-4',
          name: 'David Kim',
          appliedDate: '2024-01-17',
          resumeUrl: null,
          hasResume: false,
        },
        {
          id: 'app-5',
          name: 'Emma Wilson',
          appliedDate: '2024-01-16',
          resumeUrl: '/resumes/emma-wilson.pdf',
          hasResume: true,
        },
      ],
    },
    {
      id: 'job-2',
      title: 'Marketing Manager',
      location: 'Stockton, CA',
      postedDate: '2024-01-10',
      applicantCount: 18,
      resumeCount: 16,
      lastApplication: '1 day ago',
      applications: [
        {
          id: 'app-6',
          name: 'Jennifer Martinez',
          appliedDate: '2024-01-19',
          resumeUrl: '/resumes/jennifer-martinez.pdf',
          hasResume: true,
        },
        {
          id: 'app-7',
          name: 'Robert Taylor',
          appliedDate: '2024-01-18',
          resumeUrl: '/resumes/robert-taylor.pdf',
          hasResume: true,
        },
        {
          id: 'app-8',
          name: 'Amanda Brown',
          appliedDate: '2024-01-17',
          resumeUrl: null,
          hasResume: false,
        },
      ],
    },
    {
      id: 'job-3',
      title: 'Customer Service Representative',
      location: 'Fresno, CA',
      postedDate: '2024-01-08',
      applicantCount: 31,
      resumeCount: 28,
      lastApplication: '3 hours ago',
      applications: [
        {
          id: 'app-9',
          name: 'Carlos Gonzalez',
          appliedDate: '2024-01-20',
          resumeUrl: '/resumes/carlos-gonzalez.pdf',
          hasResume: true,
        },
        {
          id: 'app-10',
          name: 'Maria Lopez',
          appliedDate: '2024-01-19',
          resumeUrl: '/resumes/maria-lopez.pdf',
          hasResume: true,
        },
      ],
    },
  ];

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBulkDownload = (jobId: string, jobTitle: string) => {
    // In a real app, this would trigger a server-side zip creation and download
    console.log(`Downloading all resumes for: ${jobTitle}`);
    alert(
      `Starting bulk download of resumes for "${jobTitle}". This would create a ZIP file with all resumes organized by applicant name.`
    );
  };

  const handleIndividualDownload = (
    resumeUrl: string,
    candidateName: string
  ) => {
    // In a real app, this would download the individual resume
    console.log(`Downloading resume for: ${candidateName}`);
    alert(`Downloading resume for ${candidateName}`);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <FileText className="h-8 w-8 text-[#2d4a3e]" />
          <h1 className="text-3xl font-bold text-[#2d4a3e]">
            Resume Downloads
          </h1>
        </div>
        <p className="max-w-3xl text-lg text-gray-600">
          Download resumes and applications organized by job post. Bulk download
          all resumes for a position or download individual resumes.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-[#2d4a3e]/10 p-2">
              <Users className="h-6 w-6 text-[#2d4a3e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Applications
              </p>
              <p className="text-2xl font-bold text-[#2d4a3e]">
                {jobPosts.reduce((sum, job) => sum + job.applicantCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-[#ff6b35]/10 p-2">
              <FileText className="h-6 w-6 text-[#ff6b35]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Resumes Available
              </p>
              <p className="text-2xl font-bold text-[#ff6b35]">
                {jobPosts.reduce((sum, job) => sum + job.resumeCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-[#9fdf9f]/20 p-2">
              <Download className="h-6 w-6 text-[#2d4a3e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Job Posts
              </p>
              <p className="text-2xl font-bold text-[#2d4a3e]">
                {jobPosts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Posts with Applications */}
      <div className="space-y-6">
        <h2 className="mb-4 text-xl font-semibold text-[#2d4a3e]">
          Job Posts & Applications
        </h2>

        {jobPosts.map(job => (
          <div key={job.id} className="rounded-lg border bg-white shadow-sm">
            {/* Job Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleJobExpansion(job.id)}
                      className="flex items-center space-x-2 text-left"
                    >
                      {expandedJobs.includes(job.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <h3 className="text-lg font-semibold text-[#2d4a3e]">
                        {job.title}
                      </h3>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{job.applicantCount} applications</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{job.resumeCount} resumes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Posted {job.postedDate}</span>
                    </span>
                    <span>📍 {job.location}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    Last application: {job.lastApplication}
                  </span>
                  <button
                    onClick={() => handleBulkDownload(job.id, job.title)}
                    className="flex items-center space-x-2 rounded-lg bg-[#2d4a3e] px-4 py-2 text-white transition-colors hover:bg-[#1d3a2e]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download All ({job.resumeCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Applications List */}
            {expandedJobs.includes(job.id) && (
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-sm font-medium text-gray-600">
                    <span>Candidate Name</span>
                    <span>Applied Date</span>
                    <span>Resume</span>
                    <span>Action</span>
                  </div>

                  {job.applications.map(application => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {application.name}
                        </span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-sm text-gray-600">
                          {application.appliedDate}
                        </span>
                      </div>
                      <div className="flex-1 text-center">
                        {application.hasResume ? (
                          <span className="inline-flex items-center rounded-full bg-[#9fdf9f]/20 px-2 py-1 text-xs font-medium text-[#2d4a3e]">
                            <FileText className="mr-1 h-3 w-3" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            No Resume
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        {application.hasResume ? (
                          <button
                            onClick={() =>
                              handleIndividualDownload(
                                application.resumeUrl!,
                                application.name
                              )
                            }
                            className="inline-flex items-center rounded px-3 py-1 text-sm text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/5 hover:text-[#1d3a2e]"
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Download
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
