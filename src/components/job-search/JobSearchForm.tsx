'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Filter, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface JobSearchFormProps {
  initialQuery?: string;
  initialLocation?: string;
  onSearch?: (query: string, location: string, filters: any) => void;
  className?: string;
}

export default function JobSearchForm({
  initialQuery = '',
  initialLocation = '',
  onSearch,
  className = ''
}: JobSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobType: '',
    salaryRange: '',
    datePosted: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(query, location, filters);
    } else {
      // Navigate to search page with parameters
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (location) params.set('location', location);
      if (filters.jobType) params.set('type', filters.jobType);
      if (filters.salaryRange) params.set('salary', filters.salaryRange);
      if (filters.datePosted) params.set('posted', filters.datePosted);

      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Search Fields */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="City in Central Valley"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <Button type="submit" className="px-8 py-3">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Salary Range
                  </label>
                  <select
                    value={filters.salaryRange}
                    onChange={(e) => setFilters({ ...filters, salaryRange: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">Any Salary</option>
                    <option value="30000-40000">$30k - $40k</option>
                    <option value="40000-60000">$40k - $60k</option>
                    <option value="60000-80000">$60k - $80k</option>
                    <option value="80000-100000">$80k - $100k</option>
                    <option value="100000+">$100k+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date Posted
                  </label>
                  <select
                    value={filters.datePosted}
                    onChange={(e) => setFilters({ ...filters, datePosted: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">Any Time</option>
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
