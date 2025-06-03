'use client';

import React, { useState } from 'react';

// TODO: Replace with real API hooks for fetching billing data
const mockCurrentPlan = {
  key: 'starter',
  name: 'Starter',
  price: 50,
  usage: '1/1 job posts',
  team: '1/1 members',
  renewal: '2024-07-01',
};

const PLAN_KEYS = [
  { key: 'starter', name: 'Starter' },
  { key: 'growth', name: 'Growth' },
  { key: 'scale', name: 'Scale' },
];

const mockPlans = [
  {
    key: 'starter',
    name: 'Starter',
    price: 50,
    features: [
      '1 active job post',
      'Basic analytics',
      'Email support',
      '30-day duration',
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 99,
    features: [
      '3 active job posts',
      'Advanced analytics',
      'Resume database',
      'Priority support',
      '45-day duration',
    ],
  },
  {
    key: 'scale',
    name: 'Scale',
    price: 200,
    features: [
      '10 active job posts',
      'Team management',
      'Custom analytics',
      'Phone support',
      '60-day duration',
    ],
  },
];

const mockBillingHistory = [
  {
    date: '2024-05-01',
    amount: '$50.00',
    status: 'Paid',
    invoice: '#INV-1001',
  },
  {
    date: '2024-04-01',
    amount: '$50.00',
    status: 'Paid',
    invoice: '#INV-0987',
  },
];

// These will be replaced by process.env or fetched from the backend in a real app
const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || '',
  },
  growth: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID || '',
  },
  scale: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_SCALE_MONTHLY_PRICE_ID || '',
  },
};

export default function EmployerUpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const handleUpgrade = async (planKey: string) => {
    setLoadingPlan(planKey);
    const priceId =
      STRIPE_PRICE_IDS[planKey as keyof typeof STRIPE_PRICE_IDS]?.monthly;
    if (!priceId) {
      alert(
        'Stripe Price ID not set for this plan. Please check your environment variables.'
      );
      setLoadingPlan(null);
      return;
    }
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          tier: planKey,
          billingInterval: 'monthly',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error creating checkout session');
      }
    } catch (err) {
      alert('Error connecting to payment system');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.origin + '/employers/upgrade',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not open billing portal');
      }
    } catch (err) {
      alert('Could not open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6">
      {/* Current Plan */}
      <section
        aria-labelledby="current-plan-title"
        className="rounded-lg bg-white p-6 shadow"
      >
        <h2
          id="current-plan-title"
          className="mb-2 text-xl font-bold text-[#2d4a3e]"
        >
          Current Plan
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-[#2d4a3e]">
              {mockCurrentPlan.name} Plan
            </div>
            <div className="text-gray-600">
              Renews: {mockCurrentPlan.renewal}
            </div>
            <div className="text-gray-600">Usage: {mockCurrentPlan.usage}</div>
            <div className="text-gray-600">Team: {mockCurrentPlan.team}</div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <button
              className="rounded bg-[#2d4a3e] px-4 py-2 text-white hover:bg-[#1d3a2e] disabled:bg-gray-300"
              onClick={handleManageBilling}
              disabled={billingLoading}
            >
              {billingLoading ? 'Redirecting...' : 'Manage Billing'}
            </button>
            <span className="mt-1 text-xs text-gray-500">
              Billing management is handled securely by Stripe.
            </span>
          </div>
        </div>
      </section>

      {/* Plan Selection */}
      <section
        aria-labelledby="plan-selection-title"
        className="rounded-lg bg-white p-6 shadow"
      >
        <h2
          id="plan-selection-title"
          className="mb-4 text-xl font-bold text-[#2d4a3e]"
        >
          Upgrade or Change Plan
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {mockPlans.map(plan => (
            <div
              key={plan.key}
              className="flex flex-col rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#2d4a3e]"
            >
              <div className="mb-2 text-lg font-semibold text-[#2d4a3e]">
                {plan.name}
              </div>
              <div className="mb-2 text-2xl font-bold text-[#2d4a3e]">
                {typeof plan.price === 'number'
                  ? `$${plan.price}/mo`
                  : plan.price}
              </div>
              <ul className="mb-4 space-y-1 text-sm text-gray-600">
                {plan.features.map(f => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <button
                className="mt-auto rounded bg-[#2d4a3e] px-4 py-2 text-white hover:bg-[#1d3a2e] disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={
                  plan.key === mockCurrentPlan.key || loadingPlan === plan.key
                }
                onClick={() => handleUpgrade(plan.key)}
              >
                {plan.key === mockCurrentPlan.key
                  ? 'Current Plan'
                  : loadingPlan === plan.key
                    ? 'Redirecting...'
                    : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
        {Object.values(STRIPE_PRICE_IDS).some(p => !p.monthly) && (
          <div className="mt-4 text-sm text-[#ff6b35]">
            Stripe Price IDs are not set for all plans. Please check your
            environment variables.
          </div>
        )}
      </section>

      {/* Payment Method & Checkout */}
      <section
        aria-labelledby="payment-title"
        className="rounded-lg bg-white p-6 shadow"
      >
        <h2
          id="payment-title"
          className="mb-2 text-xl font-bold text-[#2d4a3e]"
        >
          Payment Method
        </h2>
        <div className="text-gray-500">
          Payments are securely processed by Stripe. You will be redirected to a
          secure checkout page.
        </div>
      </section>

      {/* Billing History */}
      <section
        aria-labelledby="billing-history-title"
        className="rounded-lg bg-white p-6 shadow"
      >
        <h2
          id="billing-history-title"
          className="mb-2 text-xl font-bold text-[#2d4a3e]"
        >
          Billing History
        </h2>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-2">Date</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {mockBillingHistory.map(row => (
              <tr key={row.invoice} className="border-b last:border-0">
                <td className="py-2">{row.date}</td>
                <td className="py-2">{row.amount}</td>
                <td className="py-2 text-green-600">{row.status}</td>
                <td className="py-2">
                  <a
                    href="#"
                    className="text-[#2d4a3e] underline hover:text-[#1d3a2e]"
                  >
                    {row.invoice}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* TODO: Fetch and display real billing history from backend */}
      </section>
    </main>
  );
}
