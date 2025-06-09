'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Users,
  Clock,
  Star,
  Mail,
  Eye,
  MoreHorizontal,
  Settings,
  BarChart3,
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    skills?: string[];
  };
}

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  headerColor: string;
  applications: Application[];
}

const statusConfig = {
  pending: { title: 'New Applications', color: 'bg-blue-50 border-blue-200', headerColor: 'bg-blue-100 text-blue-800' },
  reviewing: { title: 'In Review', color: 'bg-yellow-50 border-yellow-200', headerColor: 'bg-yellow-100 text-yellow-800' },
  interview: { title: 'Interview', color: 'bg-purple-50 border-purple-200', headerColor: 'bg-purple-100 text-purple-800' },
  offer: { title: 'Offer Extended', color: 'bg-indigo-50 border-indigo-200', headerColor: 'bg-indigo-100 text-indigo-800' },
  rejected: { title: 'Rejected', color: 'bg-red-50 border-red-200', headerColor: 'bg-red-100 text-red-800' },
  withdrawn: { title: 'Withdrawn', color: 'bg-gray-50 border-gray-200', headerColor: 'bg-gray-100 text-gray-800' },
};

export default function PipelineViewPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employers/applications?limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);

      // Group applications by status
      const stages = Object.entries(statusConfig).map(([status, config]) => ({
        id: status,
        title: config.title,
        color: config.color,
        headerColor: config.headerColor,
        applications: (data.applications || []).filter((app: Application) => app.status === status),
      }));

      setPipelineStages(stages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/employers/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh the pipeline
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-4 shadow">
                <div className="mb-4 h-6 w-3/4 rounded bg-gray-200"></div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="mb-2 h-16 rounded bg-gray-100"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalApplications = applications.length;

  return (
    <div className="mx-auto max-w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/employers/applicants"
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <BarChart3 className="mr-3 h-8 w-8 text-blue-500" />
            Pipeline View
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/employers/applicants"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Table View
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
            </div>
          </div>
        </div>
        {pipelineStages.slice(0, 3).map((stage) => (
          <div key={stage.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${stage.color.split(' ')[0]}`}></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stage.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stage.applications.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-6">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="rounded-lg border border-gray-200 bg-white">
            {/* Stage Header */}
            <div className={`rounded-t-lg border-b p-4 ${stage.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${stage.headerColor}`}>
                  {stage.applications.length}
                </span>
              </div>
            </div>

            {/* Applications List */}
            <div className="max-h-96 space-y-3 overflow-y-auto p-4">
              {stage.applications.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm">No candidates</p>
                </div>
              ) : (
                stage.applications.map((application) => (
                  <div
                    key={application.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-shadow hover:shadow-md"
                  >
                    {/* Candidate Info */}
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {application.user.name || application.user.email}
                      </h4>
                      <p className="text-xs text-gray-600">{application.job.title}</p>
                      <p className="text-xs text-gray-500">
                        at {application.job.company}
                      </p>
                    </div>

                    {/* Applied Time */}
                    <div className="mb-3 flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                    </div>

                    {/* Skills */}
                    {application.user.skills && application.user.skills.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {application.user.skills.slice(0, 2).map((skill, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {application.user.skills.length > 2 && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              +{application.user.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <div className="flex space-x-1">
                        <Link
                          href={`/employers/applicants/${application.id}`}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                        >
                          <Eye className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => {
                            window.location.href = `mailto:${application.user.email}`;
                          }}
                          className="rounded bg-gray-600 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-700"
                        >
                          <Mail className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={application.status}
                        onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

