/**
 * React UI Components for Feature Flags
 * 
 * Separated from feature-flags.ts to avoid TypeScript JSX issues
 */

import React from 'react';
import { isFeatureEnabled, FEATURES } from './feature-flags';

interface FeatureGateProps {
  feature: keyof typeof FEATURES;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

/**
 * Component to show when a feature is disabled
 */
interface DisabledFeatureProps {
  featureName: string;
  description?: string;
  expectedReturn?: string;
}

export function DisabledFeature({ 
  featureName, 
  description = "This feature is temporarily disabled during maintenance.",
  expectedReturn = "Check back soon!"
}: DisabledFeatureProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md text-center p-8 bg-white rounded-lg shadow-sm border">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{featureName}</h1>
          <p className="text-gray-600 mb-4">{description}</p>
          <p className="text-sm text-gray-500">{expectedReturn}</p>
        </div>
        <div className="space-y-3">
          <a 
            href="/"
            className="block w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return Home
          </a>
          <a 
            href="/jobs"
            className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse Jobs
          </a>
        </div>
      </div>
    </div>
  );
}