'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award } from 'lucide-react';
import Link from 'next/link';
import PricingSection from '@/components/pricing/PricingSection';

// Employer pricing plans
const employerPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 50,
    yearlyPrice: 50 * 12 * 0.85, // 15% discount
    yearlyDiscount: 15,
    description: 'Perfect for small businesses hiring occasionally',
    features: [
      '1 Active Job Post',
      'Basic Analytics Dashboard',
      'Applicant Management',
      '209 Area Targeting',
      'Email Support',
      '30-day Job Duration',
    ],
    chamberDiscount: 25,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 99,
    yearlyPrice: 99 * 12 * 0.85, // 15% discount
    yearlyDiscount: 15,
    description: 'Ideal for growing companies with multiple positions',
    features: [
      '3 Active Job Posts',
      'Advanced Analytics & Reports',
      'Premium Job Placement',
      'Resume Database Access',
      'Applicant Messaging',
      'Priority Support',
      'Company Profile Page',
      '60-day Job Duration',
    ],
    popular: true,
    badge: 'Most Popular',
    chamberDiscount: 25,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 200,
    yearlyPrice: 200 * 12 * 0.8, // 20% discount
    yearlyDiscount: 20,
    description: 'For companies with high-volume hiring needs',
    features: [
      '10 Active Job Posts',
      'Everything in Professional',
      'Team Management Tools',
      'Custom Analytics Dashboard',
      'Bulk Job Management',
      'Priority Phone Support',
      'Advanced Reporting',
      '90-day Job Duration',
    ],
    chamberDiscount: 25,
  },
];

export default function EmployerPricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Find the Perfect Plan for Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Hiring Needs
            </span>
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Connect with top talent in the 209 area with our flexible pricing
            options
          </p>

          {/* Chamber Member Alert */}
          <Alert className="mx-auto mb-8 max-w-2xl border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <Award className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Chamber Members:</strong> Get 25% off your first year!
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

      {/* Interactive Pricing Section */}
      <PricingSection
        plans={employerPlans}
        title="Employer Plans"
        subtitle="Choose the plan that fits your hiring needs"
        showChamberToggle={true}
        onPlanSelect={(planId, billingInterval) => {
          console.log('Selected plan:', planId, 'billing:', billingInterval);
          // Redirect to signup with selected plan
          window.location.href = `/employers/signup?plan=${planId}&billing=${billingInterval}`;
        }}
      />

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
                membership during signup. The discount applies to all plans and
                billing intervals.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately, and we'll prorate any billing
                adjustments.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                All paid plans include a 14-day free trial with full access to
                all features. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                How does annual billing work?
              </h3>
              <p className="text-gray-600">
                Annual billing offers significant savings - up to 20% off
                compared to monthly billing. You'll be charged once per year
                instead of monthly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Hiring?</h2>
          <p className="mb-8 text-xl opacity-90">
            Join hundreds of 209 area businesses finding top talent with 209
            Works
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/employers/signup?plan=professional"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-medium text-blue-600 shadow-lg transition-colors hover:bg-gray-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-white hover:text-blue-600"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
