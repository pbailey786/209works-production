import { Metadata } from 'next';
import InstagramAnalyticsDashboard from '@/components/instagram/InstagramAnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Instagram Analytics Dashboard - Demo',
  description:
    'Demo of the Instagram analytics and engagement tracking dashboard',
};

export default function InstagramAnalyticsDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">
          Instagram Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive analytics and engagement tracking for Instagram posts
        </p>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Demo Note:</strong> This dashboard shows the Instagram
            analytics interface. In a production environment, this would display
            real data from your Instagram Business Account via the Meta Graph
            API.
          </p>
        </div>
      </div>

      <InstagramAnalyticsDashboard />
    </div>
  );
}
