/**
 * Regional Landing Page Component
 * Dynamic landing page for regional domains (209.works, 916.works, 510.works, norcal.works)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Building, 
  DollarSign,
  Search,
  ArrowRight,
  Star,
  Clock,
  Target
} from 'lucide-react';

interface RegionalConfig {
  region: string;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  cities: string[];
  features: string[];
  heroImage?: string;
}

interface RegionalStats {
  region: string;
  totalJobs: number;
  newJobsThisWeek: number;
  topCategories: Array<{ category: string; count: number }>;
  averageSalary: number | null;
  topCompanies: Array<{ company: string; count: number }>;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
}

const REGIONAL_CONFIGS: Record<string, RegionalConfig> = {
  '209': {
    region: '209',
    name: 'Central Valley',
    tagline: 'Where Central Valley Works',
    description: 'Discover career opportunities in California\'s agricultural and logistics hub. From Stockton to Bakersfield, find your next role in the heart of the Golden State.',
    primaryColor: '#2563EB',
    accentColor: '#F59E0B',
    cities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi', 'Turlock', 'Merced', 'Fresno'],
    features: ['Agricultural Innovation', 'Logistics & Distribution', 'Manufacturing', 'Healthcare']
  },
  '916': {
    region: '916',
    name: 'Sacramento Metro',
    tagline: 'Capital Region Careers',
    description: 'Explore opportunities in California\'s capital region. From government positions to tech startups, Sacramento Metro offers diverse career paths.',
    primaryColor: '#1E40AF',
    accentColor: '#D97706',
    cities: ['Sacramento', 'Elk Grove', 'Roseville', 'Folsom', 'Davis', 'Woodland'],
    features: ['Government & Public Service', 'Technology', 'Healthcare', 'Education']
  },
  '510': {
    region: '510',
    name: 'East Bay',
    tagline: 'East Bay Excellence',
    description: 'Join the innovation ecosystem of the East Bay. From Oakland\'s vibrant startup scene to Berkeley\'s research institutions.',
    primaryColor: '#0EA5E9',
    accentColor: '#EA580C',
    cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Richmond', 'Alameda'],
    features: ['Technology & Innovation', 'Biotech & Research', 'Green Energy', 'Creative Industries']
  },
  'norcal': {
    region: 'norcal',
    name: 'Northern California',
    tagline: 'Northern California\'s Work Hub',
    description: 'Your gateway to Northern California\'s diverse job market. Connecting talent across the Bay Area, Central Valley, and Sacramento regions.',
    primaryColor: '#1D4ED8',
    accentColor: '#CA8A04',
    cities: ['San Francisco', 'San Jose', 'Sacramento', 'Oakland', 'Stockton', 'Santa Rosa'],
    features: ['Comprehensive Coverage', 'Cross-Regional Opportunities', 'Diverse Industries', 'Regional Insights']
  }
};

interface RegionalLandingPageProps {
  region: string;
  className?: string;
}

export default function RegionalLandingPage({ region, className = '' }: RegionalLandingPageProps) {
  const [stats, setStats] = useState<RegionalStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = REGIONAL_CONFIGS[region];

  useEffect(() => {
    if (!config) {
      setError('Invalid region specified');
      setLoading(false);
      return;
    }

    fetchRegionalData();
  }, [region]);

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      
      // Fetch regional statistics
      const statsResponse = await fetch(`/api/jobs/regional/stats?region=${region}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch recent jobs
      const jobsResponse = await fetch(`/api/jobs/regional?region=${region}&limit=6&offset=0`);
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setRecentJobs(jobsData.data.jobs);
      }

    } catch (err) {
      console.error('Error fetching regional data:', err);
      setError('Failed to load regional data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedJobType !== 'all') params.set('type', selectedJobType);
    params.set('region', region);
    
    window.location.href = `/jobs?${params.toString()}`;
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
    return 'Competitive';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  if (!config) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Region</h1>
          <p className="text-gray-600">The specified region is not supported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: config.accentColor }}
                >
                  {region.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">{config.name} Jobs</h1>
                  <p className="text-xl opacity-90">{config.tagline}</p>
                </div>
              </div>
              
              <p className="text-lg mb-8 opacity-90 leading-relaxed">
                {config.description}
              </p>

              {/* Search Bar */}
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search jobs, companies, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-bold text-white">
                    {loading ? '...' : stats?.totalJobs || 0}
                  </div>
                  <div className="text-sm text-white/80">Total Jobs</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-bold text-white">
                    {loading ? '...' : stats?.newJobsThisWeek || 0}
                  </div>
                  <div className="text-sm text-white/80">New This Week</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-bold text-white">
                    {loading ? '...' : stats?.averageSalary ? `$${Math.round(stats.averageSalary / 1000)}K` : 'N/A'}
                  </div>
                  <div className="text-sm text-white/80">Avg Salary</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-4 text-center">
                  <Building className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-bold text-white">
                    {loading ? '...' : stats?.topCompanies?.length || 0}
                  </div>
                  <div className="text-sm text-white/80">Companies</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose {config.name}?</h2>
            <p className="text-lg text-gray-600">Discover what makes our region special</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${config.primaryColor}20` }}
                  >
                    <Star className="w-6 h-6" style={{ color: config.primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature}</h3>
                  <p className="text-sm text-gray-600">Growing opportunities in this sector</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Opportunities</h2>
              <p className="text-gray-600">Fresh job postings in {config.name}</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = `/jobs?region=${region}`}>
              View All Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {job.jobType.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(job.postedAt)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => window.location.href = `/jobs/${job.id}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600 mb-4">
                We're working on bringing more opportunities to {config.name}.
              </p>
              <Button onClick={() => window.location.href = '/jobs'}>
                Explore All Regions
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cities We Serve</h2>
            <p className="text-lg text-gray-600">Find opportunities across {config.name}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {config.cities.map((city) => (
              <Badge 
                key={city} 
                variant="outline" 
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                onClick={() => window.location.href = `/jobs?region=${region}&location=${city}`}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 px-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Career in {config.name}?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of professionals who have found their dream jobs through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = `/jobs?region=${region}`}
            >
              Browse All Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => window.location.href = '/signup'}
            >
              Create Job Alert
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 