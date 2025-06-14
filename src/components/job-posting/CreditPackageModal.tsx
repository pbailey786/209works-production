'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  Crown, 
  Zap, 
  Check, 
  Loader2,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { JOB_POSTING_CONFIG, SUBSCRIPTION_TIERS_CONFIG } from '@/lib/stripe';

interface CreditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TierKey = 'starter' | 'standard' | 'pro';

export default function CreditPackageModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreditPackageModalProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tiers = SUBSCRIPTION_TIERS_CONFIG;

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          addons: [],
          successUrl: `${window.location.origin}/employers/dashboard?purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?purchase_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (tier: TierKey) => {
    switch (tier) {
      case 'starter': return <Zap className="h-6 w-6" />;
      case 'standard': return <Star className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
    }
  };

  const getTierColor = (tier: TierKey) => {
    switch (tier) {
      case 'starter': return 'border-blue-500 bg-blue-50';
      case 'standard': return 'border-orange-500 bg-orange-50';
      case 'pro': return 'border-purple-500 bg-purple-50';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Choose Your Credit Package</h2>
                <p className="text-white/90">Select the package that best fits your hiring needs</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Credit Requirements Notice */}
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start">
                <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">Job posting credits required to optimize job posts</h3>
                  <p className="text-sm text-amber-700">
                    You'll need available job credits to proceed with optimization. Credits expire in 30 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Package Selection */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {Object.entries(tiers).map(([key, tier]) => {
                const isSelected = selectedTier === key;
                const isPopular = key === 'standard';

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                      isSelected
                        ? getTierColor(key as TierKey)
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTier(key as TierKey)}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                        <span className="flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                          <Star className="mr-1 h-3 w-3" />
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    {/* Save Badge for Pro */}
                    {key === 'pro' && (
                      <div className="absolute -top-3 right-4">
                        <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                          SAVE $13
                        </span>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    <div className="absolute right-4 top-4">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    {/* Icon and Title */}
                    <div className="mb-4 flex items-center">
                      <div className={`mr-3 rounded-lg p-2 ${
                        isSelected ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {getTierIcon(key as TierKey)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                        <p className="text-lg font-medium text-gray-700">{tier.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <strong>{tier.features.credits || (tier.features as any).jobPosts || 0} Universal Credits</strong>
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {tier.features.duration}-day duration
                      </li>
                      {tier.features.aiOptimization && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          AI optimization included
                        </li>
                      )}
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {tier.features.analytics === 'basic' ? 'Basic analytics' : 
                         tier.features.analytics === 'advanced' ? 'Advanced analytics' : 'Premium analytics'}
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {tier.features.support === 'email' ? 'Email support' : 
                         tier.features.support === 'priority' ? 'Priority support' : 'Phone support'}
                      </li>
                      {(tier.features as any).featuredPosts && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          {(tier.features as any).featuredPosts} featured posts
                        </li>
                      )}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            {/* Purchase Section */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Ready to optimize your job post?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Our AI will transform your info into a compelling job listing
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-700">
                    Monthly Subscription
                  </p>
                  <p className="text-xs text-gray-500">Credits included</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full flex items-center justify-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#ff5722] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Subscribe to {tiers[selectedTier].name}
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                Secure payment powered by Stripe. Credits expire in 30 days.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
