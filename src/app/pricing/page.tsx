import { PRICING_CONFIG } from '@/lib/services/subscription';

'use client';


export default function JobSeekerPricingPage() {
  // Job seeker pricing plans with monthly/yearly options
  const jobSeekerPlans = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: 0,
      description: 'Perfect for entry-level job seekers getting started',
      features: [
        'Create basic profile',
        'Unlimited job applications',
        'Standard search filters',
        'Daily email digests',
        'Limited application tracker',
        'Community support',
      ],
      limitations: [
        'No resume visibility to employers',
        'No priority application delivery',
        'Limited search options',
        'No resume/cover letter tools',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: PRICING_CONFIG.premium.price,
      yearlyPrice: PRICING_CONFIG.premium.yearlyPrice,
      yearlyDiscount: 10,
      description: 'For active job seekers who want enhanced features',
      features: [
        'Enhanced profile with portfolio section',
        'Profile visible to employers',
        'Priority application delivery',
        'Advanced search filters',
        'Instant job alerts',
        'Full application tracking',
        'Resume review (4 per year)',
        'Cover letter templates',
        'Priority email support',
      ],
      limitations: [],
      popular: true,
      badge: 'Most Popular',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-4xl font-bold text-transparent">
              Accelerate Your Career in the 209
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Simple, transparent pricing for job seekers. Start free and
              upgrade when you're ready to supercharge your job search with
              premium features.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>
                💡 Save up to 10% with annual billing • 14-day free trial on
                Premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pricing Section */}
      <PricingSection
        plans={jobSeekerPlans}
        title="Job Seeker Plans"
        subtitle="Choose the plan that fits your career goals"
        showChamberToggle={false}
        onPlanSelect={(planId, billingInterval) => {
          console.log('Selected plan:', planId, 'billing:', billingInterval);
          // Handle plan selection - redirect to signup for all plans
          // Note: Premium features will be implemented in a future update
          if (planId === 'free') {
            window.location.href = '/signup/jobseeker?plan=free';
          } else {
            // For now, redirect premium users to free signup with a note
            window.location.href = `/signup/jobseeker?plan=free&note=premium_coming_soon`;
          }
        }}
      />

      {/* Employer Pricing CTA */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Are you an employer?
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Check out our simplified employer pricing plans designed for 209
              area businesses.
            </p>
            <a
              href="/employers/pricing"
              className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 text-base font-medium text-white shadow-lg hover:from-blue-700 hover:to-green-700"
            >
              View Employer Pricing
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                The 14-day free trial includes full access to all Premium
                features: enhanced profile visibility, priority applications,
                advanced search filters, and resume review credits.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your Premium subscription at any time. Your
                access will continue until the end of your current billing
                period.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                How does the annual discount work?
              </h3>
              <p className="text-gray-600">
                When you choose annual billing, you save 10% compared to monthly
                billing. You'll be charged once per year instead of monthly.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What makes 209 Works different?
              </h3>
              <p className="text-gray-600">
                We focus exclusively on the 209 area job market, providing
                hyper-local insights, community connections, and personalized
                support that national job boards can't match. Built for the 209,
                made for the people who work here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
