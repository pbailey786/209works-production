'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Filter, Briefcase, Clock, DollarSign } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  description: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    jobType: '',
    salaryRange: '',
    datePosted: ''
  });

  // Initialize search from URL parameters
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const locationParam = searchParams.get('location');
    const typeParam = searchParams.get('type');
    const salaryParam = searchParams.get('salary');
    const postedParam = searchParams.get('posted');

    if (queryParam) setSearchQuery(queryParam);
    if (locationParam) setLocation(locationParam);
    if (typeParam || salaryParam || postedParam) {
      setFilters({
        jobType: typeParam || '',
        salaryRange: salaryParam || '',
        datePosted: postedParam || ''
      });
    }
  }, [searchParams]);

  const searchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        location: location,
        ...(filters.jobType && { type: filters.jobType }),
        ...(filters.salaryRange && { salary: filters.salaryRange }),
        ...(filters.datePosted && { posted: filters.datePosted })
      });

      const response = await fetch(`/api/jobs/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial jobs when search params are loaded
    if (searchQuery || location || filters.jobType || filters.salaryRange || filters.datePosted) {
      searchJobs();
    }
  }, [searchQuery, location, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchJobs();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">209</span>
              </div>
              <span className="text-xl font-bold">Works</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/jobs" className="text-foreground/80 hover:text-foreground">
                Find Jobs
              </Link>
              <Link href="/employers" className="text-foreground/80 hover:text-foreground">
                Post Jobs
              </Link>
              <Link href="/chat" className="text-foreground/80 hover:text-foreground">
                JobsGPT
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Find Your Dream Job in Central Valley
            </h1>
            <p className="text-lg text-muted-foreground">
              Search thousands of local jobs in the 209 area
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  placeholder="City or zip code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 pt-4">
              <select
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>

              <select
                value={filters.salaryRange}
                onChange={(e) => setFilters(prev => ({ ...prev, salaryRange: e.target.value }))}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Any Salary</option>
                <option value="30000-50000">$30k - $50k</option>
                <option value="50000-75000">$50k - $75k</option>
                <option value="75000-100000">$75k - $100k</option>
                <option value="100000+">$100k+</option>
              </select>

              <select
                value={filters.datePosted}
                onChange={(e) => setFilters(prev => ({ ...prev, datePosted: e.target.value }))}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Any Date</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last week</option>
                <option value="30">Last month</option>
              </select>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {jobs.length > 0 ? `${jobs.length} Jobs Found` : 'Search Results'}
            </h2>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select className="px-3 py-1 border border-border rounded focus:ring-2 focus:ring-primary">
                <option>Most Recent</option>
                <option>Salary: High to Low</option>
                <option>Salary: Low to High</option>
                <option>Company A-Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Searching for jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground hover:text-primary">
                          <Link href={`/jobs/${job.id}`}>
                            {job.title}
                          </Link>
                        </h3>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {job.type}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.postedAt}</span>
                        </div>
                      </div>

                      <p className="text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                        Save Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-muted-foreground mb-4">
                <Search className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or browse all available jobs
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/jobs"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Browse All Jobs
                </Link>
                <Link
                  href="/chat"
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Try JobsGPT
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {jobs.length > 0 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
                  Previous
                </button>
                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">1</span>
                <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  2
                </button>
                <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  3
                </button>
                <button className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
