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
  Zap
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
        'Mobile-friendly posting'
      ],
      buttonText: 'Post a Job',
      popular: false
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
        'Candidate management'
      ],
      buttonText: 'Start Pro Plan',
      popular: true
    }
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Simple Pricing</h1>
              <p className="text-gray-600 mt-1">Choose the plan that works for you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start hiring today
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you need to post one job or manage ongoing hiring, we have a simple solution for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
                plan.popular
                  ? 'border-[#2d4a3e] ring-2 ring-[#2d4a3e]/20'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#2d4a3e] text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
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
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Why choose 209 Works?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d4a3e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-[#2d4a3e]" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Local Focus</h4>
              <p className="text-gray-600 text-sm">
                Reach qualified candidates specifically in the Central Valley region.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#9fdf9f]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#2d4a3e]" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Quality Candidates</h4>
              <p className="text-gray-600 text-sm">
                Access to pre-screened job seekers actively looking for work.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-[#ff6b35]" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Fast Results</h4>
              <p className="text-gray-600 text-sm">
                Start receiving applications within hours of posting your job.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Questions? We're here to help.
          </h3>
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => router.push('/employers/faq')}
              className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
            >
              View FAQ
            </button>
            <button
              onClick={() => router.push('/employers/contact')}
              className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
