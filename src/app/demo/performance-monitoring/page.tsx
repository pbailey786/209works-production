/**
 * Performance Monitoring Demo
 * Comprehensive demo of performance monitoring and system health tracking
 */

'use client';

import React from 'react';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard';

export default function PerformanceMonitoringDemoPage() {
  return (
    <PostHogProvider
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      host={process.env.NEXT_PUBLIC_POSTHOG_HOST}
      region="209"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Performance Monitoring Demo
                </h1>
                <p className="mt-2 text-gray-600">
                  Real-time performance tracking, Core Web Vitals monitoring,
                  and system health analytics
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Demo Mode - Live performance data from your browser
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <PerformanceDashboard />
        </div>
      </div>
    </PostHogProvider>
  );
}
