'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Edit,
  Share2,
  BarChart3,
  Star,
  MessageSquare,
  Download,
  RefreshCw,
  Pause,
  Play,
  Archive,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function EmployerJobDetailsPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock job data - in real app this would come from API
  const jobData = {
    id: params.id,
    title: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    location: 'Stockton, CA',
    type: 'Full-time',
    salary: '$85,000 - $120,000',
    posted: '2024-01-15',
    expires: '2024-02-15',
    status: 'active',
    views: 1247,
    applications: 23,
    shortlisted: 8,
    interviewed: 3,
    hired: 0,
    description:
      'We are seeking a Senior Software Engineer to join our growing development team...',
    requirements: [
      '5+ years of software development experience',
      'Proficiency in React, Node.js, and TypeScript',
      'Experience with cloud platforms (AWS/Azure)',
      'Strong problem-solving skills',
    ],
    benefits: [
      'Health, dental, and vision insurance',
      '401(k) with company matching',
      'Flexible work arrangements',
      'Professional development budget',
    ],
  };

  const applicantStats = [
    {
      label: 'Total Applications',
      value: jobData.applications,
      change: '+5',
      trend: 'up',
    },
    { label: 'Views', value: jobData.views, change: '+127', trend: 'up' },
    {
      label: 'Shortlisted',
      value: jobData.shortlisted,
      change: '+2',
      trend: 'up',
    },
    {
      label: 'Interviewed',
      value: jobData.interviewed,
      change: '0',
      trend: 'neutral',
    },
  ];

  const recentApplicants = [
    {
      id: 1,
      name: 'Sarah Johnson',
      score: 92,
      applied: '2 hours ago',
      status: 'new',
    },
    {
      id: 2,
      name: 'Michael Chen',
      score: 88,
      applied: '1 day ago',
      status: 'reviewed',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      score: 85,
      applied: '2 days ago',
      status: 'shortlisted',
    },
    {
      id: 4,
      name: 'David Kim',
      score: 82,
      applied: '3 days ago',
      status: 'interviewed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'interviewed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/employers/my-jobs"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to My Jobs
            </Link>
            <div className="flex items-center space-x-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  jobData.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {jobData.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">
                Job ID: {jobData.id}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </button>
            <Link
              href={`/employers/job/${jobData.id}/edit`}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Job</span>
            </Link>
          </div>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {jobData.title}
          </h1>
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{jobData.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{jobData.type}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>{jobData.salary}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                Posted {new Date(jobData.posted).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        {applicantStats.map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(stat.trend)}
                <span
                  className={`text-sm ${
                    stat.trend === 'up'
                      ? 'text-green-600'
                      : stat.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'applicants', label: 'Applicants', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Edit },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Job Details */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Description</h3>
              <p className="mb-6 text-gray-700">{jobData.description}</p>

              <h4 className="mb-3 font-semibold">Requirements</h4>
              <ul className="mb-6 list-inside list-disc space-y-1">
                {jobData.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">
                    {req}
                  </li>
                ))}
              </ul>

              <h4 className="mb-3 font-semibold">Benefits</h4>
              <ul className="list-inside list-disc space-y-1">
                {jobData.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Application Rate</span>
                  <span className="font-semibold">1.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold">8.2/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time to Fill</span>
                  <span className="font-semibold">18 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Source Performance</span>
                  <span className="font-semibold">Direct: 65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-3">
                <button className="flex w-full items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Public Listing</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Listing</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <Pause className="h-4 w-4" />
                  <span>Pause Job</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50">
                  <Archive className="h-4 w-4" />
                  <span>Archive Job</span>
                </button>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Applicants</h3>
                <Link
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentApplicants.map(applicant => (
                  <div
                    key={applicant.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {applicant.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {applicant.applied}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {applicant.score}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusColor(applicant.status)}`}
                      >
                        {applicant.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Status */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-900">
                    {new Date(jobData.expires).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Days Remaining</span>
                  <span className="text-gray-900">12 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Auto-renewal</span>
                  <span className="text-green-600">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Applicants for this Job</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <Link
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage All</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentApplicants.map(applicant => (
                    <tr key={applicant.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-sm font-medium text-gray-600">
                              {applicant.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {applicant.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <Star className="mr-1 h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-900">
                            {applicant.score}/100
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {applicant.applied}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(applicant.status)}`}
                        >
                          {applicant.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Message
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Performance Analytics
            </h3>
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
              <p className="text-gray-500">
                Analytics charts would be displayed here
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h4 className="mb-4 font-semibold">Traffic Sources</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Direct</span>
                  <span>65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Search</span>
                  <span>25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Social</span>
                  <span>10%</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h4 className="mb-4 font-semibold">Application Timeline</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Week 1</span>
                  <span>8 applications</span>
                </div>
                <div className="flex justify-between">
                  <span>Week 2</span>
                  <span>12 applications</span>
                </div>
                <div className="flex justify-between">
                  <span>Week 3</span>
                  <span>3 applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-6 text-lg font-semibold">Job Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Status
              </label>
              <select className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                <option>Active</option>
                <option>Paused</option>
                <option>Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Auto-renewal
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Automatically renew this job posting
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Application Notifications
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Email me when someone applies
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Daily application summary
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
