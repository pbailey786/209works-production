'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from 'lucide-react';

interface ApplicantAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  overview: {
    totalApplications: number;
    newThisWeek: number;
    averageTimeToHire: number;
    conversionRate: number;
    topPerformingJobs: Array<{
      jobTitle: string;
      applications: number;
      hireRate: number;
    }>;
  };
  demographics: {
    locations: Array<{ location: string; count: number; percentage: number }>;
    experienceLevels: Array<{ level: string; count: number; percentage: number }>;
    skills: Array<{ skill: string; count: number; percentage: number }>;
    sources: Array<{ source: string; count: number; percentage: number }>;
  };
  pipeline: {
    stages: Array<{
      stage: string;
      count: number;
      percentage: number;
      averageTime: number;
    }>;
    conversionRates: Array<{
      from: string;
      to: string;
      rate: number;
    }>;
  };
  trends: {
    applicationsByWeek: Array<{ week: string; applications: number; hires: number }>;
    qualityScore: {
      current: number;
      trend: 'up' | 'down' | 'stable';
      change: number;
    };
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    action?: string;
  }>;
}

export function ApplicantAnalytics({ className }: ApplicantAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/employers/applicant-analytics?range=${timeRange}`);
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Mock data for now
          setAnalytics({
            overview: {
              totalApplications: 127,
              newThisWeek: 23,
              averageTimeToHire: 14,
              conversionRate: 12.5,
              topPerformingJobs: [
                { jobTitle: 'Software Engineer', applications: 45, hireRate: 15.6 },
                { jobTitle: 'Product Manager', applications: 32, hireRate: 12.5 },
                { jobTitle: 'UX Designer', applications: 28, hireRate: 10.7 },
              ]
            },
            demographics: {
              locations: [
                { location: 'Stockton, CA', count: 35, percentage: 27.6 },
                { location: 'Modesto, CA', count: 28, percentage: 22.0 },
                { location: 'Tracy, CA', count: 22, percentage: 17.3 },
                { location: 'Manteca, CA', count: 18, percentage: 14.2 },
                { location: 'Lodi, CA', count: 15, percentage: 11.8 },
                { location: 'Other', count: 9, percentage: 7.1 },
              ],
              experienceLevels: [
                { level: 'Mid-level (3-5 years)', count: 48, percentage: 37.8 },
                { level: 'Entry-level (0-2 years)', count: 35, percentage: 27.6 },
                { level: 'Senior (5+ years)', count: 32, percentage: 25.2 },
                { level: 'Executive (10+ years)', count: 12, percentage: 9.4 },
              ],
              skills: [
                { skill: 'JavaScript', count: 42, percentage: 33.1 },
                { skill: 'React', count: 38, percentage: 29.9 },
                { skill: 'Python', count: 35, percentage: 27.6 },
                { skill: 'Node.js', count: 28, percentage: 22.0 },
                { skill: 'SQL', count: 25, percentage: 19.7 },
              ],
              sources: [
                { source: 'Direct Application', count: 52, percentage: 40.9 },
                { source: 'LinkedIn', count: 31, percentage: 24.4 },
                { source: 'Indeed', count: 24, percentage: 18.9 },
                { source: 'Google Jobs', count: 15, percentage: 11.8 },
                { source: 'Referral', count: 5, percentage: 3.9 },
              ]
            },
            pipeline: {
              stages: [
                { stage: 'Applied', count: 127, percentage: 100, averageTime: 0 },
                { stage: 'Screening', count: 78, percentage: 61.4, averageTime: 2 },
                { stage: 'Interview', count: 34, percentage: 26.8, averageTime: 7 },
                { stage: 'Offer', count: 18, percentage: 14.2, averageTime: 12 },
                { stage: 'Hired', count: 12, percentage: 9.4, averageTime: 16 },
              ],
              conversionRates: [
                { from: 'Applied', to: 'Screening', rate: 61.4 },
                { from: 'Screening', to: 'Interview', rate: 43.6 },
                { from: 'Interview', to: 'Offer', rate: 52.9 },
                { from: 'Offer', to: 'Hired', rate: 66.7 },
              ]
            },
            trends: {
              applicationsByWeek: [
                { week: 'Week 1', applications: 28, hires: 3 },
                { week: 'Week 2', applications: 32, hires: 2 },
                { week: 'Week 3', applications: 25, hires: 4 },
                { week: 'Week 4', applications: 42, hires: 3 },
              ],
              qualityScore: {
                current: 78,
                trend: 'up',
                change: 5.2
              }
            },
            insights: [
              {
                type: 'positive',
                title: 'Strong Conversion Rate',
                description: 'Your interview-to-offer conversion rate of 52.9% is above industry average.',
                action: 'Continue current interview process'
              },
              {
                type: 'negative',
                title: 'Low Application Volume',
                description: 'Applications decreased by 15% compared to last month.',
                action: 'Consider expanding job posting reach'
              },
              {
                type: 'neutral',
                title: 'Geographic Concentration',
                description: '67% of applications come from Stockton and Modesto areas.',
                action: 'Evaluate if this aligns with your hiring goals'
              },
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching applicant analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

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
        <h2 className="text-2xl font-bold text-gray-900">Applicant Analytics</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.newThisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Time to Hire</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageTimeToHire}d</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'positive' 
                    ? 'bg-green-50 border-green-200' 
                    : insight.type === 'negative'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <h4 className={`font-medium ${
                  insight.type === 'positive' 
                    ? 'text-green-800' 
                    : insight.type === 'negative'
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {insight.title}
                </h4>
                <p className={`text-sm mt-1 ${
                  insight.type === 'positive' 
                    ? 'text-green-700' 
                    : insight.type === 'negative'
                    ? 'text-red-700'
                    : 'text-blue-700'
                }`}>
                  {insight.description}
                </p>
                {insight.action && (
                  <p className={`text-xs mt-2 font-medium ${
                    insight.type === 'positive' 
                      ? 'text-green-600' 
                      : insight.type === 'negative'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    Recommendation: {insight.action}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.demographics.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{location.location}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{location.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Experience Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.demographics.experienceLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{level.level}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${level.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{level.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.pipeline.stages.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{stage.count} candidates</span>
                    <span className="text-sm text-gray-600">{stage.percentage.toFixed(1)}%</span>
                    {stage.averageTime > 0 && (
                      <span className="text-xs text-gray-500">{stage.averageTime}d avg</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
