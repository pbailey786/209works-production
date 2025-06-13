'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award } from 'lucide-react';
import Link from 'next/link';

// Employer pricing plans - One-time payment model
const employerPlans = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: 50,
    description: 'Perfect for small businesses hiring occasionally',
    features: [
      '2 Job Posts',
      'Basic Analytics Dashboard',
      'Applicant Management',
      '209 Area Targeting',
      'Email Support',
      '30-day Job Duration',
      'Bulk Upload Access',
    ],
    billingNote: '💳 One-time payment • Job credits expire in 30 days',
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    price: 99,
    description: 'Ideal for growing companies with multiple positions',
    features: [
      '5 Job Posts',
      'Advanced Analytics & Reports',
      'Premium Job Placement',
      'Resume Database Access',
      'Applicant Messaging',
      'Priority Support',
      'Company Profile Page',
      '30-day Job Duration',
      'Bulk Upload Access',
      'AI Job Optimization*',
    ],
    popular: true,
    badge: 'Most Popular',
    billingNote: '💳 One-time payment • Job credits expire in 30 days',
    aiTooltip: 'Our AI suggests improvements to your job titles, descriptions, and categories to improve visibility.',
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    price: 200,
    description: 'For companies with high-volume hiring needs',
    features: [
      '10 Job Posts',
      'Everything in Standard',
      'Team Management Tools',
      'Custom Analytics Dashboard',
      'Bulk Job Management',
      'Priority Phone Support',
      'Advanced Reporting',
      '30-day Job Duration',
      'Premium AI Features*',
      'Dedicated Account Manager',
    ],
    badge: 'Most Value',
    billingNote: '💳 One-time payment • Job credits expire in 30 days',
    aiTooltip: 'Advanced AI features including bulk optimization, smart categorization, and performance insights.',
    highlight: true, // Add visual emphasis
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Posting Packages</h2>
            <p className="text-xl text-gray-600">Choose the package that fits your hiring needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {employerPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-8 ${
                  plan.highlight
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-green-50 shadow-xl ring-2 ring-orange-200'
                    : plan.popular
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-green-50 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg'
                } transition-all`}
              >
                {(plan.popular || plan.highlight) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <span className={`${
                      plan.highlight
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-orange-600 to-green-600'
                    } text-white px-4 py-1 rounded-full text-sm font-medium`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600"> one-time</span>
                  </div>

                  {/* Billing note */}
                  <p className="text-xs text-gray-500 mb-6">{plan.billingNote}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => {
                      const hasAiTooltip = feature.includes('AI') && feature.includes('*');
                      const displayFeature = feature.replace('*', '');

                      return (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="flex-1">{displayFeature}</span>
                          {hasAiTooltip && (
                            <div className="group relative ml-1">
                              <span className="cursor-help text-orange-500">ⓘ</span>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                {plan.aiTooltip}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan.id, 'monthly')}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-600 to-green-600 text-white hover:from-orange-700 hover:to-green-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Get Started
                  </button>
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
                Can I purchase additional job posts?
              </h3>
              <p className="text-gray-600">
                Yes! You can purchase additional job posting packages anytime. Each package gives you the specified number of job posts that expire after 30 days.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How do job credits work?
              </h3>
              <p className="text-gray-600">
                Each job posting uses one credit. Unused job credits expire after 30 days. You can repost expired jobs anytime with a new credit.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How does one-time billing work?
              </h3>
              <p className="text-gray-600">
                You pay once for your selected job posting package. No recurring charges or subscriptions. When you need more job posts, simply purchase another package.
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
