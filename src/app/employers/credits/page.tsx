'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Check,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Plus,
} from 'lucide-react';

interface CreditOption {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  type: 'subscription' | 'addon';
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: CreditOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 3,
    price: 89,
    description: 'Monthly subscription with 3 job posting credits',
    type: 'subscription',
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 6,
    price: 199,
    description: 'Monthly subscription with 6 job posting credits',
    type: 'subscription',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 12,
    price: 349,
    description: 'Monthly subscription with 12 job posting credits',
    type: 'subscription',
  },
];

const ADDITIONAL_CREDITS: CreditOption[] = [
  {
    id: 'singleCredit',
    name: '+1 Credit',
    credits: 1,
    price: 25,
    description: 'One additional job post',
    type: 'addon',
  },
  {
    id: 'fiveCredits',
    name: '+5 Credits',
    credits: 5,
    price: 100,
    description: 'Five additional job posts',
    type: 'addon',
  },
];

export default function CreditsPage() {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [currentCredits, setCurrentCredits] = useState(0);

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const [subResponse, creditsResponse] = await Promise.all([
        fetch('/api/employers/subscription/status'),
        fetch('/api/job-posting/credits')
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscriptionStatus(subData);
      }

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setCurrentCredits(creditsData.credits?.total || 0);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handlePurchase = async (optionId: string) => {
    setLoading(true);
    try {
      // Determine if this is a subscription tier or credit pack
      const option = [...SUBSCRIPTION_PLANS, ...ADDITIONAL_CREDITS].find(opt => opt.id === optionId);
      
      const requestBody: any = {
        successUrl: `${window.location.origin}/employers/dashboard?purchase_success=true`,
        cancelUrl: `${window.location.origin}/employers/credits?cancelled=true`,
      };

      if (option?.type === 'subscription') {
        requestBody.tier = optionId;
      } else if (option?.type === 'addon') {
        requestBody.creditPack = optionId;
      }

      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
      setLoading(false);
    }
  };

  const hasSubscription = subscriptionStatus?.subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link
            href="/employers/dashboard"
            className="mr-4 flex items-center text-gray-600 hover:text-[#2d4a3e]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2d4a3e]">Credits & Subscriptions</h1>
        </div>

        {/* Current Status */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#2d4a3e]">Current Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {currentCredits} Credits Available
              </div>
              <div className="text-gray-600">
                {hasSubscription ? 'Active Subscription' : 'No Active Subscription'}
              </div>
            </div>
            {currentCredits === 0 && (
              <div className="text-right">
                <div className="text-red-600 font-medium mb-1">⚠️ No Credits</div>
                <div className="text-sm text-gray-500">Purchase credits to post jobs</div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plans */}
        <section className="mb-12">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Subscriptions</h2>
            <p className="text-gray-600">Get regular credits every month with a subscription</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 ${
                  plan.popular
                    ? 'border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/5 to-[#9fdf9f]/10 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-[#ff6b35]/30 hover:shadow-lg'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <span className="bg-gradient-to-r from-[#ff6b35] to-[#2d4a3e] text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-[#2d4a3e]">${plan.price}</span>
                    <span className="text-gray-600 text-base">/month</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-lg font-semibold text-[#ff6b35]">{plan.credits} Credits</span>
                    <span className="text-gray-600 text-sm block">renewed monthly</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#ff6b35] to-[#2d4a3e] text-white hover:from-[#e55a2b] hover:to-[#1d3a2e]'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Processing...' : 'Subscribe'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Credits */}
        <section>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Credits</h2>
            <p className="text-gray-600">Need more credits? Purchase additional credits anytime</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {ADDITIONAL_CREDITS.map((addon) => (
              <div
                key={addon.id}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:border-[#ff6b35]/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{addon.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{addon.description}</p>
                    <div className="text-2xl font-bold text-[#2d4a3e]">${addon.price}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35]/10 to-[#2d4a3e]/10 rounded-full flex items-center justify-center mb-3">
                      <Plus className="w-8 h-8 text-[#ff6b35]" />
                    </div>
                    <button
                      onClick={() => handlePurchase(addon.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-[#2d4a3e] text-white rounded-lg font-medium hover:bg-[#1d3a2e] transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <div className="mt-12 rounded-lg border border-green-200 bg-green-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-green-800">
            🌟 Why Choose 209 Works Credits?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-sm text-green-700">
              <Clock className="mr-2 h-4 w-4" />
              <span>Credits never expire</span>
            </div>
            <div className="flex items-center text-sm text-green-700">
              <Shield className="mr-2 h-4 w-4" />
              <span>Cancel subscription anytime</span>
            </div>
            <div className="flex items-center text-sm text-green-700">
              <Zap className="mr-2 h-4 w-4" />
              <span>Instant job posting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}