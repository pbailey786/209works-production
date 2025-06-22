import { Metadata } from 'next';
import { FEATURES } from '@/lib/feature-flags';
import { DisabledFeature } from '@/lib/feature-flags-ui';

export const metadata: Metadata = {
  title: 'Admin Dashboard | 209 Works',
  description: 'Administrative dashboard for managing the 209 Works platform.',
};

// Force dynamic rendering for admin dashboard
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default async function AdminDashboard() {
  // Phase 1: Show disabled feature page if admin is not enabled
  if (!FEATURES.ADMIN_DASHBOARD) {
    return (
      <DisabledFeature 
        featureName="Admin Dashboard"
        description="The admin dashboard is temporarily disabled while we improve the core platform."
        expectedReturn="Admin features will be restored in Phase 2 of our rebuild."
      />
    );
  }

  // Phase 2+: This is where the full admin dashboard will be loaded
  // For now, just return a simple placeholder since admin is disabled in Phase 1
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-4">
          Admin features are being rebuilt. Check back in Phase 2.
        </p>
        <a 
          href="/"
          className="inline-block bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}