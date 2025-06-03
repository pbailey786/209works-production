'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Star,
  ArrowLeft,
  CreditCard,
  Briefcase,
  Users,
  Zap,
} from 'lucide-react';

export default function SimplePricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 99,
      period: 'per job post',
      description: 'Perfect for small businesses',
      features: [
        '30-day job listing',
        'Unlimited applications',
        'Basic support',
        'Mobile-friendly posting',
      ],
      buttonText: 'Post a Job',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 199,
      period: 'per month',
      description: 'Best for growing companies',
      features: [
        'Unlimited job posts',
        'Featured listings',
        'Priority support',
        'Analytics dashboard',
        'Team collaboration',
        'Candidate management',
      ],
      buttonText: 'Start Pro Plan',
      popular: true,
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      router.push('/employers/signin');
      return;
    }

    setIsLoading(true);

    try {
      if (planId === 'basic') {
        // For basic plan, just redirect to job posting
        router.push('/employers/post-job');
      } else {
        // For pro plan, create checkout session
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
            tier: 'pro',
            billingInterval: 'monthly',
          }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Simple Pricing
              </h1>
              <p className="mt-1 text-gray-600">
                Choose the plan that works for you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Start hiring today
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Whether you need to post one job or manage ongoing hiring, we have a
            simple solution for you.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm ${
                plan.popular
                  ? 'border-[#2d4a3e] ring-2 ring-[#2d4a3e]/20'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="flex items-center rounded-full bg-[#2d4a3e] px-4 py-1 text-sm font-medium text-white">
                    <Star className="mr-1 h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mb-4 text-gray-600">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="ml-2 text-gray-600">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-[#2d4a3e] text-white hover:bg-[#1d3a2e]'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
                    Loading...
                  </div>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-center text-xl font-bold text-gray-900">
            Why choose 209 Works?
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2d4a3e]/10">
                <Briefcase className="h-6 w-6 text-[#2d4a3e]" />
              </div>
              <h4 className="mb-2 font-semibold text-gray-900">Local Focus</h4>
              <p className="text-sm text-gray-600">
                Reach qualified candidates specifically in the Central Valley
                region.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#9fdf9f]/20">
                <Users className="h-6 w-6 text-[#2d4a3e]" />
              </div>
              <h4 className="mb-2 font-semibold text-gray-900">
                Quality Candidates
              </h4>
              <p className="text-sm text-gray-600">
                Access to pre-screened job seekers actively looking for work.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b35]/10">
                <Zap className="h-6 w-6 text-[#ff6b35]" />
              </div>
              <h4 className="mb-2 font-semibold text-gray-900">Fast Results</h4>
              <p className="text-sm text-gray-600">
                Start receiving applications within hours of posting your job.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Questions? We're here to help.
          </h3>
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => router.push('/employers/faq')}
              className="font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
            >
              View FAQ
            </button>
            <button
              onClick={() => router.push('/employers/contact')}
              className="font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
