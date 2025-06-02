"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
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
  XCircle
} from "lucide-react";

export default function EmployerJobDetailsPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock job data - in real app this would come from API
  const jobData = {
    id: params.id,
    title: "Senior Software Engineer",
    company: "TechCorp Solutions",
    location: "Stockton, CA",
    type: "Full-time",
    salary: "$85,000 - $120,000",
    posted: "2024-01-15",
    expires: "2024-02-15",
    status: "active",
    views: 1247,
    applications: 23,
    shortlisted: 8,
    interviewed: 3,
    hired: 0,
    description: "We are seeking a Senior Software Engineer to join our growing development team...",
    requirements: [
      "5+ years of software development experience",
      "Proficiency in React, Node.js, and TypeScript",
      "Experience with cloud platforms (AWS/Azure)",
      "Strong problem-solving skills"
    ],
    benefits: [
      "Health, dental, and vision insurance",
      "401(k) with company matching",
      "Flexible work arrangements",
      "Professional development budget"
    ]
  };

  const applicantStats = [
    { label: "Total Applications", value: jobData.applications, change: "+5", trend: "up" },
    { label: "Views", value: jobData.views, change: "+127", trend: "up" },
    { label: "Shortlisted", value: jobData.shortlisted, change: "+2", trend: "up" },
    { label: "Interviewed", value: jobData.interviewed, change: "0", trend: "neutral" }
  ];

  const recentApplicants = [
    { id: 1, name: "Sarah Johnson", score: 92, applied: "2 hours ago", status: "new" },
    { id: 2, name: "Michael Chen", score: 88, applied: "1 day ago", status: "reviewed" },
    { id: 3, name: "Emily Rodriguez", score: 85, applied: "2 days ago", status: "shortlisted" },
    { id: 4, name: "David Kim", score: 82, applied: "3 days ago", status: "interviewed" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "reviewed": return "bg-yellow-100 text-yellow-800";
      case "shortlisted": return "bg-purple-100 text-purple-800";
      case "interviewed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link 
              href="/employers/my-jobs"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to My Jobs
            </Link>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                jobData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {jobData.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">Job ID: {jobData.id}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </button>
            <Link 
              href={`/employers/job/${jobData.id}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Job</span>
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobData.title}</h1>
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
              <span>Posted {new Date(jobData.posted).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {applicantStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(stat.trend)}
                <span className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "applicants", label: "Applicants", icon: Users },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "settings", label: "Settings", icon: Edit }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Job Description</h3>
              <p className="text-gray-700 mb-6">{jobData.description}</p>
              
              <h4 className="font-semibold mb-3">Requirements</h4>
              <ul className="list-disc list-inside space-y-1 mb-6">
                {jobData.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>

              <h4 className="font-semibold mb-3">Benefits</h4>
              <ul className="list-disc list-inside space-y-1">
                {jobData.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Job Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Application Rate</span>
                  <span className="font-semibold">1.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold">8.2/10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Time to Fill</span>
                  <span className="font-semibold">18 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Source Performance</span>
                  <span className="font-semibold">Direct: 65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Public Listing</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Listing</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Pause className="h-4 w-4" />
                  <span>Pause Job</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  <Archive className="h-4 w-4" />
                  <span>Archive Job</span>
                </button>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Applicants</h3>
                <Link 
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{applicant.name}</p>
                      <p className="text-sm text-gray-500">{applicant.applied}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium">{applicant.score}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(applicant.status)}`}>
                        {applicant.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Status */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Job Status</h3>
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
                  <span className="text-gray-900">{new Date(jobData.expires).toLocaleDateString()}</span>
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

      {activeTab === "applicants" && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Applicants for this Job</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <Link 
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentApplicants.map((applicant) => (
                    <tr key={applicant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {applicant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">{applicant.score}/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applicant.applied}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(applicant.status)}`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Message</button>
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

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Performance Analytics</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Analytics charts would be displayed here</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4">Traffic Sources</h4>
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
            
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4">Application Timeline</h4>
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

      {activeTab === "settings" && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-6">Job Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Status
              </label>
              <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>Active</option>
                <option>Paused</option>
                <option>Archived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-renewal
              </label>
              <div className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                <label className="ml-2 block text-sm text-gray-900">
                  Automatically renew this job posting
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Notifications
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 block text-sm text-gray-900">
                    Email me when someone applies
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">
                    Daily application summary
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 