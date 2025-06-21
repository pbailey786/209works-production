'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'lucide-react';

interface AddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  currentTier?: string;
  subscription?: {
    tier: string;
    status: string;
    endDate?: string;
    billingCycle: string;
  };
}

// Subscription plans from pricing page
const subscriptionPlans = [
  {
    id: 'starter',
    name: 'Starter Tier',
    monthlyPrice: 89,
    description: 'Perfect for small businesses hiring occasionally',
    features: [
      '2 Job Credits per month',
      'Basic Analytics Dashboard',
      'Applicant Management',
      '209 Area Targeting',
      'Email Support',
      '30-day Job Duration',
      'Bulk Upload Access',
    ],
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days'
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    monthlyPrice: 199,
    description: 'Ideal for growing companies with multiple positions',
    features: [
      '5 Job Credits per month',
      'Advanced Analytics & Reports',
      'Premium Job Placement',
      'Resume Database Access',
      'Applicant Messaging',
      'Priority Support',
      'Company Profile Page',
      '30-day Job Duration',
      'Bulk Upload Access',
      'AI Job Optimization',
    ],
    popular: true,
    badge: 'Most Popular',
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days'
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    monthlyPrice: 350,
    description: 'For companies with high-volume hiring needs',
    features: [
      '10 Job Credits per month',
      'Everything in Standard',
      'Team Management Tools',
      'Custom Analytics Dashboard',
      'Bulk Job Management',
      'Priority Phone Support',
      'Advanced Reporting',
      '30-day Job Duration',
      'Premium AI Features',
      'Dedicated Account Manager',
    ],
    badge: 'Most Value',
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days',
    highlight: true
  },
];

// Credit add-on options for existing subscribers
const creditAddOns = [
  {
    id: 'singleCredit',
    name: '1 Job Credit',
    price: 59,
    credits: 1,
    description: 'Perfect for reposting or one additional job',
    icon: Zap,
    color: 'blue'
  },
  {
    id: 'fiveCredits',
    name: '5 Job Credits',
    price: 249,
    credits: 5,
    description: 'Best value for multiple job postings',
    savings: 46,
    icon: Package,
    color: 'purple',
    popular: true
  },
];

export default function AddCreditsModal({
  isOpen,
  onClose,
  onSuccess
}: AddCreditsModalProps) {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [selectedCreditPack, setSelectedCreditPack] = useState('fiveCredits');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkSubscriptionStatus();
    }
  }, [isOpen]);

  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/employers/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      } else {
        throw new Error('Failed to check subscription status');
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setError('Failed to load subscription information');
      setSubscriptionStatus({ hasActiveSubscription: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionPurchase = async (planId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Redirect to checkout page for subscription
      router.push(`/employers/checkout?plan=${planId}`);
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCreditPurchase = async (creditPackId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/job-posting/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creditPack: creditPackId,
          successUrl: `${window.location.origin}/employers/dashboard?credit_purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?credit_purchase_cancelled=true`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Credit purchase error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#2d4a3e]">
                  {subscriptionStatus?.hasActiveSubscription ? 'Add Credits' : 'Get Started with Credits'}
                </h2>
                <p className="text-gray-600">
                  {subscriptionStatus?.hasActiveSubscription 
                    ? 'Purchase additional job credits for your account'
                    : 'Choose a subscription plan to start posting jobs'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#2d4a3e]" />
                <span className="ml-3 text-gray-600">Loading subscription information...</span>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={checkSubscriptionStatus}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : subscriptionStatus?.hasActiveSubscription ? (
              // Show credit add-ons for existing subscribers
              <div>
                <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-green-800">
                        Active Subscription: {subscriptionStatus.subscription?.tier || subscriptionStatus.currentTier}
                      </h3>
                      <p className="text-sm text-green-700">
                        You can purchase additional credits to supplement your monthly allowance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creditAddOns.map((pack) => {
                    const IconComponent = pack.icon;
                    const isSelected = selectedCreditPack === pack.id;
                    
                    return (
                      <div
                        key={pack.id}
                        className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#2d4a3e] bg-[#2d4a3e]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${pack.popular ? 'ring-2 ring-[#ff6b35]/20' : ''}`}
                        onClick={() => setSelectedCreditPack(pack.id)}
                      >
                        {pack.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-[#ff6b35] text-white px-3 py-1 rounded-full text-sm font-medium">
                              Best Value
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`mr-3 p-2 rounded-lg ${
                              pack.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <IconComponent className={`h-6 w-6 ${
                                pack.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                              <p className="text-sm text-gray-600">{pack.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">${pack.price}</div>
                            {pack.savings && (
                              <div className="text-sm text-green-600 font-medium">
                                Save ${pack.savings}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {pack.credits} credit{pack.credits > 1 ? 's' : ''}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${(pack.price / pack.credits).toFixed(0)} per credit
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleCreditPurchase(selectedCreditPack)}
                    disabled={isProcessing}
                    className="flex items-center px-6 py-3 bg-[#2d4a3e] text-white rounded-lg font-medium hover:bg-[#1d3a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Purchase Credits
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Show subscription plans for non-subscribers
              <div>
                <div className="mb-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose Your Subscription Plan
                  </h3>
                  <p className="text-gray-600">
                    Subscribe to get monthly job credits and access to all features
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border-2 p-6 ${
                        plan.highlight
                          ? 'border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/5 to-[#2d4a3e]/5 shadow-xl ring-2 ring-[#ff6b35]/20'
                          : plan.popular
                          ? 'border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/5 to-[#2d4a3e]/5 shadow-xl'
                          : 'border-gray-200 bg-white hover:border-[#ff6b35]/30 hover:shadow-lg'
                      } transition-all`}
                    >
                      {(plan.popular || plan.highlight) && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                          <span className={`${
                            plan.highlight
                              ? 'bg-gradient-to-r from-yellow-500 to-[#ff6b35]'
                              : 'bg-gradient-to-r from-[#ff6b35] to-[#2d4a3e]'
                          } text-white px-4 py-1 rounded-full text-sm font-medium`}>
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <p className="text-gray-600 mb-4">{plan.description}</p>

                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">${plan.monthlyPrice}</span>
                          <span className="text-gray-600">/mo</span>
                        </div>

                        <p className="text-xs text-gray-500 mb-6">{plan.billingNote}</p>

                        <ul className="space-y-2 mb-6 text-left">
                          {plan.features.slice(0, 5).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 5 && (
                            <li className="text-sm text-gray-500">
                              +{plan.features.length - 5} more features
                            </li>
                          )}
                        </ul>

                        <button
                          onClick={() => handleSubscriptionPurchase(plan.id)}
                          disabled={isProcessing}
                          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            plan.popular
                              ? 'bg-gradient-to-r from-[#ff6b35] to-[#2d4a3e] text-white hover:from-[#e55a2b] hover:to-[#1d3a2e]'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            'Get Started'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
