/**
 * Analytics Tracking Demo
 * Comprehensive demo of job board analytics tracking system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import { useJobBoardAnalytics } from '@/lib/analytics/job-board-analytics';
import { useSessionTracker } from '@/lib/analytics/session-tracker';
import { 
  Search, 
  Eye, 
  Send, 
  UserPlus, 
  Briefcase,
  Bell,
  Save,
  Activity,
  BarChart3,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

const DEMO_JOBS = [
  {
    id: 'job-001',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'Stockton, CA',
    jobType: 'full_time',
    salaryMin: 120000,
    salaryMax: 160000,
    categories: ['Engineering', 'Software'],
    postedAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'job-002',
    title: 'Marketing Manager',
    company: 'GrowthCo',
    location: 'Modesto, CA',
    jobType: 'full_time',
    salaryMin: 80000,
    salaryMax: 110000,
    categories: ['Marketing', 'Management'],
    postedAt: '2024-05-21T14:30:00Z',
  },
  {
    id: 'job-003',
    title: 'Data Analyst',
    company: 'DataDriven Inc',
    location: 'Fresno, CA',
    jobType: 'contract',
    salaryMin: 70000,
    salaryMax: 95000,
    categories: ['Data', 'Analytics'],
    postedAt: '2024-05-22T09:15:00Z',
  },
];

function AnalyticsTrackingDemo() {
  const analytics = useJobBoardAnalytics();
  const sessionTracker = useSessionTracker('demo-user-123');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [eventLog, setEventLog] = useState<Array<{ type: string; timestamp: string; data: any }>>([]);

  // Log events for demo purposes
  const logEvent = (type: string, data: any) => {
    setEventLog(prev => [...prev, {
      type,
      timestamp: new Date().toISOString(),
      data,
    }].slice(-10)); // Keep last 10 events
  };

  // Demo: Job Search
  const handleJobSearch = () => {
    const searchEvent = {
      searchQuery,
      filters: {
        location: selectedLocation || undefined,
        jobType: selectedJobType || undefined,
        categories: ['Engineering', 'Marketing'],
      },
      results: {
        totalCount: DEMO_JOBS.length,
        hasMore: false,
        searchTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        page: 1,
      },
      source: 'jobs_page' as const,
    };

    analytics.trackJobSearch(searchEvent);
    sessionTracker.trackJobSearch(searchQuery);
    logEvent('job_search', searchEvent);
  };

  // Demo: Job View
  const handleJobView = (job: typeof DEMO_JOBS[0]) => {
    const viewEvent = {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      categories: job.categories,
      postedAt: job.postedAt,
      viewSource: 'search_results' as const,
      timeOnPage: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
    };

    analytics.trackJobView(viewEvent);
    sessionTracker.trackJobView(job.id);
    logEvent('job_view', viewEvent);
  };

  // Demo: Job Application
  const handleJobApplication = (job: typeof DEMO_JOBS[0]) => {
    const applicationEvent = {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      applicationMethod: 'direct' as const,
      hasResume: true,
      hasCoverLetter: Math.random() > 0.5,
      applicationSource: 'job_detail' as const,
      timeToApply: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
    };

    analytics.trackJobApplication(applicationEvent);
    sessionTracker.trackApplicationStart(job.id);
    
    // Simulate application completion after a delay
    setTimeout(() => {
      sessionTracker.trackApplicationComplete(job.id);
      logEvent('job_application_complete', { jobId: job.id });
    }, 2000);

    logEvent('job_application', applicationEvent);
  };

  // Demo: User Registration
  const handleUserRegistration = () => {
    const registrationEvent = {
      userType: 'jobseeker' as const,
      registrationMethod: 'email' as const,
      source: 'job_application' as const,
      hasResume: true,
      profileCompleteness: Math.floor(Math.random() * 40) + 60, // 60-100%
    };

    analytics.trackUserRegistration(registrationEvent);
    logEvent('user_registration', registrationEvent);
  };

  // Demo: Job Posting (Employer)
  const handleJobPosting = () => {
    const postingEvent = {
      jobId: `job-${Date.now()}`,
      employerId: 'employer-123',
      jobTitle: 'Product Manager',
      jobType: 'full_time' as const,
      location: 'Stockton, CA',
      salaryMin: 90000,
      salaryMax: 130000,
      categories: ['Product', 'Management'],
      postingMethod: 'manual' as const,
      isPromoted: Math.random() > 0.7,
      timeToPost: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
    };

    analytics.trackJobPosting(postingEvent);
    logEvent('job_posting', postingEvent);
  };

  // Demo: Email Alert
  const handleEmailAlert = () => {
    const alertEvent = {
      alertId: `alert-${Date.now()}`,
      userId: 'demo-user-123',
      alertType: 'job_search' as const,
      frequency: 'weekly' as const,
      filters: {
        keywords: ['software engineer', 'developer'],
        location: 'Central Valley, CA',
        jobType: 'full_time',
        categories: ['Engineering', 'Technology'],
      },
      source: 'job_search' as const,
    };

    analytics.trackEmailAlert(alertEvent);
    logEvent('email_alert', alertEvent);
  };

  // Demo: Job Save
  const handleJobSave = (job: typeof DEMO_JOBS[0]) => {
    analytics.trackJobSave(job.id, 'save', {
      jobTitle: job.title,
      company: job.company,
      jobType: job.jobType,
      location: job.location,
    });
    logEvent('job_save', { jobId: job.id, action: 'save' });
  };

  // Demo: User Identification
  const handleUserIdentification = () => {
    analytics.identifyJobBoardUser('demo-user-123', {
      userType: 'jobseeker',
      email: 'demo@example.com',
      name: 'Demo User',
      location: 'Stockton, CA',
      industry: 'Technology',
      experienceLevel: 'senior',
      profileCompleteness: 85,
      registrationDate: '2024-01-15T10:00:00Z',
      lastActiveDate: new Date().toISOString(),
    });
    logEvent('user_identification', { userId: 'demo-user-123' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Tracking Demo</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive job board analytics tracking system
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Session: {sessionTracker.sessionId?.slice(-8)}
              </Badge>
              <Badge variant={analytics.isInitialized ? "default" : "secondary"}>
                {analytics.isInitialized ? 'Analytics Active' : 'Analytics Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tracking">Event Tracking</TabsTrigger>
            <TabsTrigger value="jobs">Job Interactions</TabsTrigger>
            <TabsTrigger value="user">User Events</TabsTrigger>
            <TabsTrigger value="logs">Event Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-6">
            {/* Job Search Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Job Search Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Query</label>
                    <Input
                      placeholder="e.g., software engineer"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Type</label>
                    <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stockton">Stockton, CA</SelectItem>
                        <SelectItem value="modesto">Modesto, CA</SelectItem>
                        <SelectItem value="fresno">Fresno, CA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleJobSearch} className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Perform Search (Track Event)
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <Button onClick={handleUserRegistration} className="w-full flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Track Registration
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <Button onClick={handleJobPosting} variant="outline" className="w-full flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Track Job Posting
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <Button onClick={handleEmailAlert} variant="outline" className="w-full flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Track Email Alert
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <Button onClick={handleUserIdentification} variant="outline" className="w-full flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Identify User
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="grid gap-4">
              {DEMO_JOBS.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company} • {job.location}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{job.jobType.replace('_', ' ')}</Badge>
                          <Badge variant="outline">
                            ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                          </Badge>
                          {job.categories.map((category) => (
                            <Badge key={category} variant="secondary">{category}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleJobView(job)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleJobSave(job)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          onClick={() => handleJobApplication(job)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="user">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Session ID:</span>
                    <span className="text-sm font-mono">{sessionTracker.sessionId?.slice(-12) || 'Not started'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={sessionTracker.isActive ? "default" : "secondary"}>
                      {sessionTracker.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Analytics:</span>
                    <Badge variant={analytics.isInitialized ? "default" : "secondary"}>
                      {analytics.isInitialized ? 'Initialized' : 'Not initialized'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => sessionTracker.endSession()}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    End Session Manually
                  </Button>
                  <p className="text-xs text-gray-500">
                    Sessions automatically end after 30 minutes of inactivity or when the page is closed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recent Events (Last 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventLog.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No events tracked yet. Try interacting with the demo above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eventLog.map((event, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{event.type}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AnalyticsTrackingDemoPage() {
  return (
    <PostHogProvider 
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      host={process.env.NEXT_PUBLIC_POSTHOG_HOST}
      region="209"
    >
      <AnalyticsTrackingDemo />
    </PostHogProvider>
  );
} 