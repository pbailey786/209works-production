import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard';
import { AdvancedAnalyticsService, AnalyticsTimeRange } from '@/lib/analytics/advanced-analytics';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Users, Brain } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advanced Analytics | 209 Works Admin',
  description: 'Comprehensive analytics and business intelligence dashboard for 209 Works platform',
};

// Loading component for analytics dashboard
function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['Overview', 'Users', 'Jobs', 'Business', 'AI'].map((tab) => (
            <Skeleton key={tab} className="h-8 w-20" />
          ))}
        </div>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Server component to fetch initial analytics data
async function AnalyticsContent() {
  // Get default time range (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const timeRange: AnalyticsTimeRange = {
    startDate: thirtyDaysAgo,
    endDate: now,
    period: 'day'
  };

  try {
    // Fetch initial analytics data on the server
    const analyticsData = await AdvancedAnalyticsService.generateComprehensiveReport(timeRange);

    return (
      <AdvancedAnalyticsDashboard
        initialData={analyticsData}
        userRole="admin"
      />
    );
  } catch (error) {
    console.error('Failed to fetch initial analytics data:', error);

    // Fallback to client-side loading if server-side fails
    return (
      <AdvancedAnalyticsDashboard
        userRole="admin"
      />
    );
  }
}

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // TODO: Add proper admin role check
  // For now, assume all authenticated users can access admin analytics
  // In production, check if user has admin role

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600">
              Comprehensive insights and business intelligence for 209 Works platform
            </p>
          </div>
        </div>

        {/* Quick stats banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">User Analytics</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Behavior, engagement, retention</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Business Intelligence</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Revenue, growth, performance</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <span className="text-sm font-medium">AI Analytics</span>
            </div>
            <p className="text-xs mt-1 opacity-90">JobsGPT, recommendations, insights</p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Regional Performance</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Multi-domain insights</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}


