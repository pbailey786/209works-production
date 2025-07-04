/**
 * Social Proof Section Component
 * 
 * Displays real-time metrics from database
 * Gracefully handles loading and error states
 */

'use client';

import { useHomepageMetrics } from '@/hooks/useHomepageMetrics';

export default function SocialProofSection() {
  const { metrics, isLoading } = useHomepageMetrics();

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K+';
    }
    return num.toLocaleString();
  };

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          
          {/* Active Jobs Metric */}
          <div className="group">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 w-20 mx-auto rounded"></div>
              ) : (
                formatNumber(metrics.activeJobs)
              )}
            </div>
            <div className="text-gray-600 font-medium">
              Active Jobs in the 209
            </div>
          </div>
          
          {/* Recent Hires Metric */}
          <div className="group">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 w-20 mx-auto rounded"></div>
              ) : (
                formatNumber(metrics.recentHires)
              )}
            </div>
            <div className="text-gray-600 font-medium">
              People Hired This Month
            </div>
          </div>
          
          {/* Local Companies Metric */}
          <div className="group">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 w-20 mx-auto rounded"></div>
              ) : (
                `${metrics.localCompanyPercentage}%`
              )}
            </div>
            <div className="text-gray-600 font-medium">
              Local Companies
            </div>
          </div>
        </div>
        
        {/* Local Employer Logos Section - Ready for real logos */}
        <div className="mt-12">
          <p className="text-center text-gray-500 font-medium mb-8">
            Trusted by Central Valley Employers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {/* Placeholder logos - these can be replaced with real company logos */}
            {Array.from({ length: 6 }, (_, i) => (
              <div 
                key={i}
                className="bg-gray-100 h-16 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-400 text-sm">Company Logo</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Data freshness indicator */}
        {!isLoading && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Updated {metrics.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}