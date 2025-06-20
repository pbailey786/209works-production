'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Calendar,
  Target,
  Activity,
  Download,
  RefreshCw,
} from 'lucide-react';

interface JobAnalyticsProps {
  jobId: string;
  className?: string;
}

interface AnalyticsData {
  overview: {
    views: number;
    applications: number;
    conversionRate: number;
    averageTimeToApply: number;
    uniqueVisitors: number;
  };
  trends: {
    viewsThisWeek: number[];
    applicationsThisWeek: number[];
    labels: string[];
  };
  demographics: {
    topLocations: Array<{ location: string; count: number }>;
    experienceLevels: Array<{ level: string; count: number }>;
    applicationSources: Array<{ source: string; count: number }>;
  };
  performance: {
    score: number;
    ranking: string;
    suggestions: string[];
  };
}

export function JobAnalytics({ jobId, className }: JobAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${jobId}/analytics?range=${timeRange}`);
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Mock data for now
          setAnalytics({
            overview: {
              views: Math.floor(Math.random() * 500) + 100,
              applications: Math.floor(Math.random() * 50) + 10,
              conversionRate: Math.random() * 10 + 2,
              averageTimeToApply: Math.floor(Math.random() * 5) + 1,
              uniqueVisitors: Math.floor(Math.random() * 300) + 80,
            },
            trends: {
              viewsThisWeek: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10),
              applicationsThisWeek: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 1),
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            demographics: {
              topLocations: [
                { location: 'Stockton, CA', count: 15 },
                { location: 'Modesto, CA', count: 12 },
                { location: 'Tracy, CA', count: 8 },
                { location: 'Manteca, CA', count: 6 },
                { location: 'Lodi, CA', count: 4 },
              ],
              experienceLevels: [
                { level: 'Mid-level', count: 18 },
                { level: 'Entry-level', count: 12 },
                { level: 'Senior', count: 8 },
                { level: 'Executive', count: 3 },
              ],
              applicationSources: [
                { source: 'Direct', count: 25 },
                { source: 'Google', count: 12 },
                { source: 'LinkedIn', count: 8 },
                { source: 'Indeed', count: 6 },
              ],
            },
            performance: {
              score: Math.floor(Math.random() * 40) + 60,
              ranking: 'Top 25%',
              suggestions: [
                'Add more specific requirements to attract qualified candidates',
                'Consider increasing salary range to be more competitive',
                'Add company benefits to make the position more attractive',
              ],
            },
          });
        }
      } catch (error) {
        console.error('Error fetching job analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [jobId, timeRange]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Job Analytics</h2>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.views.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.applications}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Time to Apply</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageTimeToApply}d</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.uniqueVisitors}</p>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">{analytics.performance.score}/100</div>
              <div className="text-sm text-gray-600">{analytics.performance.ranking} of similar jobs</div>
            </div>
            <div className="w-24 h-24 relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${analytics.performance.score}, 100`}
                />
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Suggestions for Improvement:</h4>
            <ul className="space-y-1">
              {analytics.performance.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.demographics.topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{location.location}</span>
                  <Badge variant="outline">{location.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Experience Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.demographics.experienceLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{level.level}</span>
                  <Badge variant="outline">{level.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Application Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.demographics.applicationSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{source.source}</span>
                  <Badge variant="outline">{source.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
