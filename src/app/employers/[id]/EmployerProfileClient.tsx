'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Globe, 
  Calendar, 
  Users, 
  Briefcase, 
  Heart,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import EnhancedJobCard from '../../../components/job-search/EnhancedJobCard';

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

export default function EmployerProfileClient({ employer }: EmployerProfileClientProps) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <div className="flex items-start space-x-6">
            <div className="text-6xl" role="img" aria-label={employer.industry}>
              {employer.logo}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {employer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {employer.location}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {employer.industry}
                </div>
                {employer.founded && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Founded {employer.founded}
                  </div>
                )}
                {employer.size && (
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
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
                  <Globe className="w-4 h-4 mr-1" />
                  Visit Website
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
            <div className="text-right">
              <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {employer.activeJobs} Open Positions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About {employer.name}</h2>
              <p className="text-gray-700 leading-relaxed">
                {employer.description}
              </p>
            </motion.div>

            {/* Culture */}
            {employer.culture && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Our Culture
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {employer.culture}
                </p>
              </motion.div>
            )}

            {/* Open Positions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Open Positions ({employer.activeJobs})
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading positions...</p>
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <EnhancedJobCard
                      key={job.id}
                      {...job}
                      applyUrl={`/jobs/${job.id}`}
                      onSave={() => console.log('Save job:', job.id)}
                      onViewDetails={() => window.location.href = `/jobs/${job.id}`}
                      saved={job.saved || false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No open positions at this time.</p>
                  <p className="text-sm text-gray-500 mt-1">
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
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                <ul className="space-y-2">
                  {employer.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{benefit}</span>
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
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/jobs?company=${encodeURIComponent(employer.name)}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Jobs
                </Link>
                {employer.website && (
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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
