import AdDisplay from '@/components/ads/AdDisplay';
import EmailNewsletterAd from '@/components/ads/EmailNewsletterAd';
import InstagramPostAd from '@/components/ads/InstagramPostAd';

export default function AdsShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Local Advertisement Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive advertising solution with intelligent targeting, performance tracking, 
            and multi-platform integration for local businesses.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ 100% Complete
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              🎯 Geographic Targeting
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              📊 Performance Tracking
            </span>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Ad Rotation</h3>
            <p className="text-gray-600 text-sm">
              Intelligent algorithm that optimizes ad display based on performance metrics, 
              bid amounts, and user engagement.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Platform</h3>
            <p className="text-gray-600 text-sm">
              Seamless integration across web, email newsletters, and social media platforms 
              with consistent tracking.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive tracking of impressions, clicks, and conversions with 
              detailed performance metrics.
            </p>
          </div>
        </div>

        {/* Ad Placement Demos */}
        <div className="space-y-12">
          
          {/* Banner Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Banner Advertisements</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Full-width banner ads perfect for header and footer placements with high visibility.
              </p>
              <AdDisplay 
                placement="banner" 
                maxAds={2}
                userLocation="10001"
                className="space-y-4"
              />
            </div>
          </section>

          {/* Sidebar Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sidebar Advertisements</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Main Content Area</h3>
                <p className="text-gray-600 mb-4">
                  Sidebar ads are strategically placed alongside main content to capture user attention 
                  without disrupting the user experience.
                </p>
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                  Main content would appear here (job listings, articles, etc.)
                </div>
              </div>
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold mb-4">Sidebar Ads</h3>
                <AdDisplay 
                  placement="sidebar" 
                  maxAds={3}
                  userLocation="10001"
                  className="space-y-4"
                />
              </div>
            </div>
          </section>

          {/* Native Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Native Advertisements</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Native ads blend seamlessly with content, providing a non-intrusive advertising experience.
              </p>
              <AdDisplay 
                placement="native" 
                maxAds={3}
                userLocation="10001"
                className="space-y-4"
              />
            </div>
          </section>

          {/* Search Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Result Advertisements</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Sponsored search results that appear prominently in search listings with clear labeling.
              </p>
              <AdDisplay 
                placement="search" 
                maxAds={2}
                userLocation="10001"
                className="space-y-4"
              />
            </div>
          </section>

          {/* Featured Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Advertisements</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Premium featured ads with enhanced styling and prominent placement for maximum impact.
              </p>
              <AdDisplay 
                placement="featured" 
                maxAds={2}
                userLocation="10001"
                className="space-y-4"
              />
            </div>
          </section>

          {/* Email Newsletter Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Newsletter Integration</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Email-optimized ads with tracking pixels for comprehensive campaign analytics.
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <EmailNewsletterAd 
                  placement="inline"
                  maxAds={2}
                  userLocation="10001"
                  emailId="demo-email-123"
                  recipientId="demo-user-456"
                />
              </div>
            </div>
          </section>

          {/* Instagram Post Ads */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Integration</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 mb-4">
                Instagram-style post ads with authentic social media appearance and engagement features.
              </p>
              <div className="flex justify-center">
                <InstagramPostAd 
                  maxAds={1}
                  userLocation="10001"
                  showEngagement={true}
                />
              </div>
            </div>
          </section>

          {/* Technical Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Tracking</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ Real-time impression tracking</li>
                  <li>✅ Click-through rate monitoring</li>
                  <li>✅ Conversion tracking</li>
                  <li>✅ Geographic performance analytics</li>
                  <li>✅ Budget management and alerts</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ ZIP code geographic targeting</li>
                  <li>✅ Intelligent ad rotation algorithm</li>
                  <li>✅ Responsive design across devices</li>
                  <li>✅ Email tracking with pixels</li>
                  <li>✅ Social media integration</li>
                </ul>
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Endpoints</h3>
                  <ul className="space-y-2 text-sm font-mono text-gray-600">
                    <li><span className="text-green-600">GET</span> /api/ads/display</li>
                    <li><span className="text-blue-600">POST</span> /api/ads/impression</li>
                    <li><span className="text-blue-600">POST</span> /api/ads/click</li>
                    <li><span className="text-green-600">GET</span> /api/ads</li>
                    <li><span className="text-blue-600">POST</span> /api/ads</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Tracking</h3>
                  <ul className="space-y-2 text-sm font-mono text-gray-600">
                    <li><span className="text-green-600">GET</span> /api/ads/email-impression</li>
                    <li><span className="text-green-600">GET</span> /api/ads/email-click</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Admin Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard Features</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ad Management</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Create and edit advertisements</li>
                    <li>• Upload and manage images</li>
                    <li>• Set targeting parameters</li>
                    <li>• Configure budgets and bidding</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Performance metrics dashboard</li>
                    <li>• Click-through rate analysis</li>
                    <li>• Geographic performance data</li>
                    <li>• Revenue and ROI tracking</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Tools</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Ad preview functionality</li>
                    <li>• Campaign scheduling</li>
                    <li>• Status management</li>
                    <li>• Advertiser dashboard access</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 Local Advertisement Platform Complete!
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              A comprehensive, enterprise-grade advertising solution with intelligent targeting, 
              real-time analytics, and multi-platform integration. Ready for production deployment 
              and immediate revenue generation.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/admin/ads" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Admin Dashboard
              </a>
              <a 
                href="/jobs" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                See Ads in Action
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 