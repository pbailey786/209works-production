import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import PerformanceDashboard from '@/components/performance/PerformanceDashboard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Zap, Database, Gauge } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Performance Dashboard | 209 Works Admin',
  description: 'Real-time performance monitoring, optimization insights, and system metrics for 209 Works platform',
};

// Loading component for performance dashboard
function PerformanceLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Performance Score Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-0.5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['Database', 'API', 'Cache', 'System'].map((tab) => (
            <Skeleton key={tab} className="h-8 w-20" />
          ))}
        </div>
        
        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Server component to handle auth and setup
async function PerformanceContent() {
  // No server-side data fetching needed - the dashboard component handles it
  return <PerformanceDashboard />;
}

export default async function AdminPerformancePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // TODO: Add proper admin role check
  // For now, assume all authenticated users can access performance dashboard
  // In production, check if user has admin role

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Gauge className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600">
              Real-time performance monitoring and optimization insights for 209 Works platform
            </p>
          </div>
        </div>

        {/* Quick info banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span className="text-sm font-medium">Database Performance</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Query optimization & caching</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">API Monitoring</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Response times & error rates</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">Cache Efficiency</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Hit ratios & optimization</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              <span className="text-sm font-medium">System Health</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Memory, uptime & resources</p>
          </div>
        </div>

        {/* Performance Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Performance Goals</CardTitle>
            <CardDescription>Target metrics for optimal platform performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">&lt; 2s</div>
                <div className="text-sm text-gray-600">Page Load Time</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">&lt; 500ms</div>
                <div className="text-sm text-gray-600">API Response</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">&gt; 80%</div>
                <div className="text-sm text-gray-600">Cache Hit Rate</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">&lt; 2%</div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<PerformanceLoading />}>
        <PerformanceContent />
      </Suspense>
    </div>
  );
}
