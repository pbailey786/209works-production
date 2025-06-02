/**
 * Business Dashboard Demo
 * Comprehensive demo of business metrics and KPI tracking
 */

'use client';

import React from 'react';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import { BusinessDashboard } from '@/components/analytics/business-dashboard';

export default function BusinessDashboardDemoPage() {
  return (
    <PostHogProvider 
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      host={process.env.NEXT_PUBLIC_POSTHOG_HOST}
      region="209"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Business Dashboard Demo</h1>
                <p className="text-gray-600 mt-2">
                  Comprehensive business intelligence and KPI tracking for job board analytics
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Demo Mode - Data is simulated for demonstration purposes
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <BusinessDashboard />
        </div>
      </div>
    </PostHogProvider>
  );
} 