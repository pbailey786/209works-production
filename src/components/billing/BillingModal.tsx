'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Star,
  CreditCard,
  Building2,
  Users,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: 'job-posting' | 'upgrade' | 'feature-access';
  title?: string;
  description?: string;
}

export default function BillingModal({
  isOpen,
  onClose,
  onSuccess,
  trigger = 'job-posting',
  title,
  description,
}: BillingModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // BILLING REFACTOR: This is where billing options are now shown when posting jobs
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: { monthly: 99, yearly: 990 },
      description: 'Perfect for small businesses',
      features: [
        '5 active job listings',
        '30-day listing duration',
        'Basic company profile',
        'Email support',
        'Basic analytics',
      ],
      badge: 'Great for Local Business',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: { monthly: 299, yearly: 2990 },
      description: 'For growing businesses',
      features: [
        'Unlimited job listings',
        '45-day listing duration',
        'Enhanced company profile',
        'AI-powered matching',
        'Priority support',
        'Advanced analytics',
        'Up to 10 team members',
      ],
      badge: 'Most Popular',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 'Custom', yearly: 'Custom' },
      description: 'For large organizations',
      features: [
        'Unlimited job listings',
        '60-day listing duration',
        'Premium branded profile',
        'Advanced AI matching',
        'Dedicated account manager',
        'Custom analytics',
        'Unlimited team members',
        'API access',
      ],
      badge: 'Custom Solutions',
    },
  ];

  const getModalContent = () => {
    switch (trigger) {
      case 'job-posting':
        return {
          title: title || 'Choose Your Plan to Post Jobs',
          description: description || 'Select a subscription plan to start posting jobs and finding great candidates.',
        };
      case 'upgrade':
        return {
          title: title || 'Upgrade Your Plan',
          description: description || 'Unlock more features and capabilities for your hiring needs.',
        };
      case 'feature-access':
        return {
          title: title || 'Premium Feature Access',
          description: description || 'This feature requires a premium subscription plan.',
        };
      default:
        return {
          title: 'Choose Your Plan',
          description: 'Select the plan that best fits your hiring needs.',
        };
    }
  };

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'enterprise') {
      // Handle enterprise contact
      window.location.href = 'mailto:support@209.works?subject=Enterprise Plan Inquiry';
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: `${planId}_${billingInterval}`, // This would map to actual Stripe price IDs
          tier: planId,
          billingInterval,
          successUrl: `${window.location.origin}/employers/dashboard?success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/employers/dashboard`,
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
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = getModalContent();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-6xl rounded-xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
              <p className="mt-1 text-gray-600">{content.description}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-xs text-green-600">(Save 17%)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {plans.map(plan => {
                const price = plan.price[billingInterval];
                const isSelected = selectedPlan === plan.id;
                
                return (
                  <div
                    key={plan.id}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                        <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plan.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {typeof price === 'number' ? `$${price}` : price}
                        </span>
                        {typeof price === 'number' && (
                          <span className="text-gray-500">
                            /{billingInterval === 'monthly' ? 'month' : 'year'}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="mt-6 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm"
                        >
                          <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={isLoading}
                      className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                          Processing...
                        </div>
                      ) : plan.id === 'enterprise' ? (
                        'Contact Sales'
                      ) : (
                        'Select Plan'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              <Shield className="mr-1 inline h-4 w-4" />
              14-day free trial • Cancel anytime • Secure payment by Stripe
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
