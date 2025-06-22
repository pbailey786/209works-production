'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award } from 'lucide-react';
import Link from 'next/link';

// Employer pricing plans - One-time payment model
const employerPlans = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: 89,
    description: 'Great for testing the waters or filling a role fast.',
    features: [
      '3 Job Posting Credits',
      'Basic Analytics Dashboard',
      'Applicant Management',
      'Local 209 Area Targeting',
      'Email Support',
      'Bulk Upload Access',
    ],
    billingNote: '💳 One-time payment • Credits valid for 60 days',
    proTip: 'Great for testing the waters or filling a role fast.',
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    price: 179,
    description: 'More credits, better visibility, and powerful tools to help you hire faster.',
    features: [
      '6 Job Posting Credits',
      'Advanced Analytics & Reports',
      'Premium Job Placement (Featured Boost)',
      'Priority Support',
      'Company Profile Page',
      'Bulk Upload Access',
      'AI Job Optimization*',
    ],
    popular: true,
    badge: 'Most Popular',
    billingNote: '💳 One-time payment • Credits valid for 60 days',
    aiTooltip: 'Our AI suggests improvements to your job titles, descriptions, and categories to improve visibility.',
    whyPopular: 'More credits, better visibility, and powerful tools to help you hire faster.',
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    price: 349,
    description: 'For serious hiring teams: Built for scale, speed, and deeper insights.',
    features: [
      '12 Job Posting Credits',
      'Everything in Standard',
      'Advanced Reporting',
      'Premium AI Features*',
    ],
    badge: 'Most Value',
    billingNote: '💳 One-time payment • Credits valid for 60 days',
    aiTooltip: 'Advanced AI features including bulk optimization, smart categorization, and performance insights.',
    highlight: true, // Add visual emphasis
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    price: null,
    description: 'Let\'s talk: Get a tailored solution that scales with your team.',
    features: [
      'Flexible Credit Bundles — tailored to your hiring volume',
      'Dedicated Account Manager',
      'Custom Billing Options',
    ],
    badge: 'Contact Us',
    billingNote: 'Contact Us for Pricing',
    isEnterprise: true,
  },
];

export default function EmployerPricingPage() {

  const handlePlanSelect = async (planId: string, billingInterval: string) => {
    try {
      // Use the job posting checkout API for one-time payments
      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: planId,
          addons: [],
          successUrl: `${window.location.origin}/employers/dashboard?purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/pricing?purchase_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">


      {/* Hero Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Find the Perfect Plan for Your{' '}
            <span className="bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              Hiring Needs
            </span>
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Connect with top talent in the 209 area with our simple, one-time
            pricing packages
          </p>

          {/* Chamber Member Alert */}
          <Alert className="mx-auto mb-8 max-w-2xl border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <Award className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Chamber Members:</strong> Get 25% off your first purchase!
              <Link
                href="/signup/local-business"
                className="ml-1 text-orange-700 underline hover:text-orange-900"
              >
                Verify your membership →
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Pricing Cards - One-time Payments */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Credit Packages</h2>
            <p className="text-xl text-gray-600">Choose the credit package that fits your hiring needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {employerPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 flex flex-col h-full ${
                  plan.highlight
                    ? 'border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/5 to-[#9fdf9f]/10 shadow-xl ring-2 ring-[#ff6b35]/20'
                    : plan.popular
                    ? 'border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/5 to-[#9fdf9f]/10 shadow-xl'
                    : plan.isEnterprise
                    ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-gray-400 hover:shadow-lg'
                    : 'border-gray-200 bg-white hover:border-[#ff6b35]/30 hover:shadow-lg'
                } transition-all`}
              >
                {(plan.popular || plan.highlight || plan.badge) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <span className={`${
                      plan.highlight
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : plan.popular
                        ? 'bg-gradient-to-r from-orange-600 to-green-600'
                        : plan.isEnterprise
                        ? 'bg-gradient-to-r from-gray-600 to-gray-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-800'
                    } text-white px-4 py-1 rounded-full text-sm font-medium`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <div className="mb-3">
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-bold text-[#2d4a3e]">${plan.price}</span>
                        <span className="text-gray-600 text-base">/month</span>
                      </>
                    ) : (
                      <span className="text-2xl font-semibold text-gray-900">Contact Us for Pricing</span>
                    )}
                  </div>

                  {/* Billing note */}
                  <p className="text-sm text-gray-500 mb-4">{plan.billingNote}</p>

                  {/* Pro tip or why popular */}
                  {(plan.proTip || plan.whyPopular) && (
                    <div className="bg-[#9fdf9f]/20 border border-[#2d4a3e]/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-[#2d4a3e] font-medium">
                        💡 Pro Tip: {plan.proTip || plan.whyPopular}
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, index) => {
                      const hasAiTooltip = feature.includes('AI') && feature.includes('*');
                      const displayFeature = feature.replace('*', '');

                      // Add consistent icons
                      const getFeatureIcon = (feature: string) => {
                        if (feature.includes('Job Posting') || feature.includes('job posts')) return '📝';
                        if (feature.includes('Analytics') || feature.includes('Dashboard')) return '📊';
                        if (feature.includes('AI') || feature.includes('Optimization')) return '🤖';
                        if (feature.includes('Support') || feature.includes('Email')) return '💬';
                        if (feature.includes('Featured') || feature.includes('Boost')) return '🚀';
                        if (feature.includes('Bulk') || feature.includes('Upload')) return '📤';
                        return '✅';
                      };

                      return (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">{getFeatureIcon(displayFeature)}</span>
                          <span className="flex-1">{displayFeature}</span>
                          {hasAiTooltip && (
                            <div className="group relative ml-1">
                              <span className="cursor-help text-[#ff6b35]">ⓘ</span>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                {plan.aiTooltip}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-auto">
                    {plan.isEnterprise ? (
                      <Link
                        href="/contact"
                        className="w-full py-3 px-6 rounded-lg font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 inline-block text-center"
                      >
                        Contact Sales
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePlanSelect(plan.id, 'monthly')}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                          plan.popular || plan.highlight
                            ? 'bg-gradient-to-r from-[#ff6b35] to-[#2d4a3e] text-white hover:from-[#e55a2b] hover:to-[#1d3a2e]'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        Get Started
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How do chamber member discounts work?
              </h3>
              <p className="text-gray-600">
                Chamber members receive 25% off when they verify their
                membership during signup. The discount applies to all job posting
                packages.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Can I purchase additional credits?
              </h3>
              <p className="text-gray-600">
                Yes! You can purchase additional credit packages anytime. Each package gives you the specified number of job posting credits that are valid for 60 days.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How do job credits work?
              </h3>
              <p className="text-gray-600">
                Each action costs 1 credit — whether you're posting a job, featuring it for top placement, or promoting it on social media. Unused credits are valid for 60 days and can roll over for up to 60 days total.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How does monthly billing work?
              </h3>
              <p className="text-gray-600">
                All plans are monthly recurring subscriptions. You'll be billed automatically each month and receive your credit allocation. Cancel anytime with no long-term commitments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-600 to-green-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Hiring?</h2>
          <p className="mb-8 text-xl opacity-90">
            Join hundreds of 209 area businesses finding top talent with 209
            Works
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => handlePlanSelect('standard', 'monthly')}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-medium text-orange-600 shadow-lg transition-colors hover:bg-gray-100"
            >
              Get Started Today
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-white hover:text-orange-600"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
