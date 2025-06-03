/**
 * Funnel Analysis Demo
 * Comprehensive demo of conversion funnel tracking and optimization
 */

'use client';

import React from 'react';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import { FunnelAnalyticsDashboard } from '@/components/analytics/FunnelAnalyticsDashboard';

export default function FunnelAnalysisDemoPage() {
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
                  Funnel Analysis Demo
                </h1>
                <p className="mt-2 text-gray-600">
                  Comprehensive conversion funnel tracking, drop-off analysis,
                  and optimization recommendations
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Demo Mode - Live funnel analysis with mock data
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <FunnelAnalyticsDashboard />
        </div>
      </div>
    </PostHogProvider>
  );
}
