import React, { useState, useEffect } from "react";
import JobCard from './JobCard';
import { Spinner } from './Spinner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  type?: string;
  jobType?: string; // Database field name
  isRemote: boolean;
  postedAt: string;
  description: string;
}

export default function FeaturedJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        // Fetch recent jobs with a limit for featured section
        const response = await fetch('/api/jobs?limit=6&sortBy=createdAt&sortOrder=desc');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data.data?.data || []);
      } catch (err: any) {
        console.error('Error fetching featured jobs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-16 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Latest Jobs in the <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">209 Area</span>
          </h2>
          <div className="flex justify-center">
            <Spinner />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Latest Jobs in the <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">209 Area</span>
          </h2>
          <div className="text-center text-gray-600">
            <p>Unable to load local jobs at the moment. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>🏠</span>
            <span>Local Opportunities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Latest Jobs in the <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">209 Area</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Fresh opportunities from local employers in Stockton, Modesto, Tracy, Manteca, Lodi, and surrounding Central Valley communities.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center text-gray-600">
            <p className="text-lg mb-4">No jobs available at the moment.</p>
            <p>Check back soon for new opportunities!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  {...job}
                  type={job.type || job.jobType || 'full_time'} // Handle both field names
                  applyUrl={`/jobs/${job.id}`}
                />
              ))}
            </div>
            
            <div className="text-center">
              <a
                href="/jobs"
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Explore All Local Jobs
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
} 