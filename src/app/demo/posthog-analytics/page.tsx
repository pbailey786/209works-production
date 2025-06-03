/**
 * PostHog Analytics Demo
 * Demonstrates PostHog integration with regional tracking and GDPR compliance
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostHogProvider, usePostHog } from '@/lib/analytics/posthog-provider';
import ConsentBanner from '@/components/analytics/ConsentBanner';
import RegionalAnalyticsDashboard from '@/components/analytics/RegionalAnalyticsDashboard';
import { Search, Shield, Settings, Play, Eye, MapPin } from 'lucide-react';

const DEMO_REGIONS = [
  { value: '209', label: 'Central Valley (209)' },
  { value: '916', label: 'Sacramento Metro (916)' },
  { value: '510', label: 'East Bay (510)' },
  { value: 'norcal', label: 'Northern California' },
];

function SimpleAnalyticsDemo({ region }: { region: string }) {
  const { trackEvent, isInitialized } = usePostHog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');

  const handleTrackJobSearch = () => {
    trackEvent('job_search_performed', {
      search_query: searchQuery,
      search_region: region,
      search_job_type: selectedJobType,
      search_source: 'demo_page',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTrackJobView = () => {
    trackEvent('job_viewed', {
      job_id: 'demo-job-123',
      job_title: 'Senior Software Engineer',
      job_company: 'TechCorp',
      job_region: region,
      view_source: 'demo_page',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTrackJobApplication = () => {
    trackEvent('job_application_started', {
      job_id: 'demo-job-123',
      job_title: 'Senior Software Engineer',
      job_company: 'TechCorp',
      job_region: region,
      application_method: 'direct',
      application_source: 'demo_page',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTrackRegionalNavigation = () => {
    trackEvent('regional_navigation', {
      from_region: '209',
      to_region: '916',
      navigation_method: 'demo_navigation',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Interactive Analytics Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Search Query
              </label>
              <Input
                placeholder="e.g., software engineer"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Job Type</label>
              <Select
                value={selectedJobType}
                onValueChange={setSelectedJobType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Button
              onClick={handleTrackJobSearch}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Track Search
            </Button>
            <Button
              onClick={handleTrackJobView}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Track View
            </Button>
            <Button
              onClick={handleTrackJobApplication}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Track Apply
            </Button>
            <Button
              onClick={handleTrackRegionalNavigation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Track Navigation
            </Button>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Analytics Status:</strong>{' '}
              {isInitialized ? '✅ Initialized' : '❌ Not initialized'}
              <br />
              <strong>Current Region:</strong> {region || 'None'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Tracking Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold">Job Board Events</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Job Search</span>
                  <Badge variant="outline">job_search_performed</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Job View</span>
                  <Badge variant="outline">job_viewed</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Job Application</span>
                  <Badge variant="outline">job_application_started</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Regional Events</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Regional Navigation</span>
                  <Badge variant="outline">regional_navigation</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Page View</span>
                  <Badge variant="outline">page_viewed</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PostHogAnalyticsDemoContent() {
  const [selectedRegion, setSelectedRegion] = useState('209');
  const [showConsentBanner, setShowConsentBanner] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                PostHog Analytics Demo
              </h1>
              <p className="mt-2 text-gray-600">
                Regional analytics tracking with GDPR compliance for 209jobs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_REGIONS.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowConsentBanner(!showConsentBanner)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Toggle Consent
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="dashboard">Analytics Dashboard</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>

          <TabsContent value="demo">
            <SimpleAnalyticsDemo region={selectedRegion} />
          </TabsContent>

          <TabsContent value="dashboard">
            <RegionalAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="implementation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Implementation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3 font-semibold">PostHog Configuration</h4>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <pre className="overflow-x-auto text-sm">
                      {`// Environment Variables
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

// Provider Setup
<PostHogProvider 
  apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
  host={process.env.NEXT_PUBLIC_POSTHOG_HOST}
  region={currentRegion}
>
  <App />
</PostHogProvider>`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold">Basic Event Tracking</h4>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <pre className="overflow-x-auto text-sm">
                      {`// Direct event tracking
const { trackEvent } = usePostHog();

trackEvent('job_search_performed', {
  search_query: 'software engineer',
  search_region: '209',
  timestamp: new Date().toISOString(),
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold">
                    GDPR Compliance Features
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Consent management with localStorage persistence</li>
                    <li>• Opt-out by default until consent is granted</li>
                    <li>
                      • Regional privacy law compliance (CCPA for California)
                    </li>
                    <li>• Data minimization and anonymization</li>
                    <li>
                      • User-friendly consent banner with detailed information
                    </li>
                    <li>• Easy consent revocation and preference management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Consent Banner */}
      {showConsentBanner && <ConsentBanner region={selectedRegion} />}
    </div>
  );
}

export default function PostHogAnalyticsDemo() {
  return (
    <PostHogProvider
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      host={process.env.NEXT_PUBLIC_POSTHOG_HOST}
      region="209"
    >
      <PostHogAnalyticsDemoContent />
    </PostHogProvider>
  );
}
