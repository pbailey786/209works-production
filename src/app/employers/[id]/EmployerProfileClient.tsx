'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
// import { EnhancedJobCard } from '@/components/jobs/enhanced-job-card';

import {
  MapPin,
  Globe,
  Calendar,
  Users,
  Briefcase,
  Heart,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

interface Employer {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  logo: string;
  website?: string;
  founded?: string;
  size?: string;
  benefits?: string[];
  culture?: string;
  activeJobs: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  postedAt: string;
  saved?: boolean;
}

interface EmployerProfileClientProps {
  employer: Employer;
}

export default function EmployerProfileClient({
  employer,
}: EmployerProfileClientProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployerJobs = async () => {
      try {
        // In production, this would fetch real jobs from the API
        const response = await fetch(`/api/employers/${employer.id}/jobs`);
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        } else {
          // Mock jobs for demonstration
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching employer jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerJobs();
  }, [employer.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center">
            <Link
              href="/"
              className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </div>

          <div className="flex items-start space-x-6">
            <div className="text-6xl" role="img" aria-label={employer.industry}>
              {employer.logo}
            </div>
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {employer.name}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {employer.location}
                </div>
                <div className="flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" />
                  {employer.industry}
                </div>
                {employer.founded && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Founded {employer.founded}
                  </div>
                )}
                {employer.size && (
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {employer.size}
                  </div>
                )}
              </div>
              {employer.website && (
                <a
                  href={employer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Globe className="mr-1 h-4 w-4" />
                  Visit Website
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
            <div className="text-right">
              <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {employer.activeJobs} Open Positions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Company Info */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-white p-6 shadow-sm"
            >
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                About {employer.name}
              </h2>
              <p className="leading-relaxed text-gray-700">
                {employer.description}
              </p>
            </motion.div>

            {/* Culture */}
            {employer.culture && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                  <Heart className="mr-2 h-5 w-5 text-red-500" />
                  Our Culture
                </h2>
                <p className="leading-relaxed text-gray-700">
                  {employer.culture}
                </p>
              </motion.div>
            )}

            {/* Open Positions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg bg-white p-6 shadow-sm"
            >
              <h2 className="mb-6 text-xl font-semibold text-gray-900">
                Open Positions ({employer.activeJobs})
              </h2>

              {loading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading positions...</p>
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-gray-600">{job.location}</p>
                      <p className="text-sm text-gray-500">{job.type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">
                    No open positions at this time.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new opportunities!
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Benefits & Quick Info */}
          <div className="space-y-6">
            {/* Benefits */}
            {employer.benefits && employer.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Benefits & Perks
                </h3>
                <ul className="space-y-2">
                  {employer.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg bg-white p-6 shadow-sm"
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/jobs?company=${encodeURIComponent(employer.name)}`}
                  className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
                >
                  View All Jobs
                </Link>
                {employer.website && (
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
