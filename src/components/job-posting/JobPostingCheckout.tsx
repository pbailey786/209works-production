'use client';

import React, { useState } from 'react';
import { JOB_POSTING_CONFIG, SUBSCRIPTION_TIERS_CONFIG } from '@/lib/stripe';
import { 
  Check, 
  Star, 
  Zap, 
  RefreshCw, 
  Share2,
  Crown,
  Loader2,
  X
} from 'lucide-react';

interface JobPostingCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userCredits?: {
    jobPost: number;
    featuredPost: number;
    socialGraphic: number;
    total?: number; // Added for unified credit system
  };
}

type TierKey = 'starter' | 'standard' | 'pro';
type AddonKey = 'featuredPost' | 'socialGraphic' | 'featureAndSocialBundle';

export default function JobPostingCheckout({ isOpen, onClose, onSuccess, userCredits }: JobPostingCheckoutProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey>('starter');
  const [selectedAddons, setSelectedAddons] = useState<AddonKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUseCredits, setShowUseCredits] = useState(false);

  if (!isOpen) return null;

  const tierConfig = SUBSCRIPTION_TIERS_CONFIG[selectedTier];
  const addonConfigs = JOB_POSTING_CONFIG.addons;

  // Calculate total price
  const tierPrice = tierConfig.monthlyPrice;
  const addonPrice = selectedAddons.reduce((total, addonKey) => {
    return total + addonConfigs[addonKey].price;
  }, 0);
  const totalPrice = tierPrice + addonPrice;

  const handleAddonToggle = (addonKey: AddonKey) => {
    setSelectedAddons(prev => {
      // Handle bundle logic
      if (addonKey === 'featureAndSocialBundle') {
        // If selecting bundle, remove individual items
        return prev.includes(addonKey) 
          ? prev.filter(a => a !== addonKey)
          : prev.filter(a => a !== 'featuredPost' && a !== 'socialGraphic').concat(addonKey);
      } else if (addonKey === 'featuredPost' || addonKey === 'socialGraphic') {
        // If selecting individual items, remove bundle
        const newAddons = prev.filter(a => a !== 'featureAndSocialBundle');
        return newAddons.includes(addonKey)
          ? newAddons.filter(a => a !== addonKey)
          : newAddons.concat(addonKey);
      } else {
        // Regular toggle for other addons
        return prev.includes(addonKey)
          ? prev.filter(a => a !== addonKey)
          : prev.concat(addonKey);
      }
    });
  };

  const handleCheckout = async () => {
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
          addons: selectedAddons,
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
      case 'starter': return <Zap className="h-5 w-5" />;
      case 'standard': return <Star className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
    }
  };

  const getAddonIcon = (addon: AddonKey) => {
    switch (addon) {
      case 'featuredPost': return <Star className="h-4 w-4" />;
      case 'socialGraphic': return <Share2 className="h-4 w-4" />;
      case 'featureAndSocialBundle': return <Crown className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-4xl w-full mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Job Posting Package</h2>
            <p className="text-gray-600">Select a tier and optional add-ons to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Use Existing Credits Option */}
          {userCredits && (userCredits.jobPost > 0 || (userCredits.total && userCredits.total > 0)) && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">You have existing credits!</h3>
                  <p className="text-sm text-green-600">
                    {userCredits.total || (userCredits.jobPost + (userCredits.featuredPost || 0) + (userCredits.socialGraphic || 0))} universal credits available
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Use for any feature: job posts, featured listings, social graphics, and more
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    // Navigate to job posting with existing credits
                    window.location.href = '/employers/create-job-post';
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Use Existing Credits
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          {userCredits && ((userCredits.total && userCredits.total > 0) || userCredits.jobPost > 0) && (
            <div className="mb-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or purchase more credits</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          )}

          {/* Tier Selection */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Choose Your Base Tier</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(SUBSCRIPTION_TIERS_CONFIG).map(([key, tier]) => (
                <div
                  key={key}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTier === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTier(key as TierKey)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getTierIcon(key as TierKey)}
                      <span className="ml-2 font-semibold text-gray-900">{tier.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">${tier.monthlyPrice}</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2" />
                      <strong>{tier.features.credits || (tier.features as any).jobPosts || 0} universal credit{(tier.features.credits || (tier.features as any).jobPosts || 0) > 1 ? 's' : ''}</strong>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-green-500 mr-2" />
                      {tier.features.duration} days duration
                    </li>
                    {tier.features.aiOptimization && (
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        AI optimization
                      </li>
                    )}
                    {/* Featured posts are now part of universal credits */}
                  </ul>
                  {selectedTier === key && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons Selection */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-semibold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Add Optional Enhancements</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Boost your job's visibility and reach with these add-ons:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(addonConfigs).map(([key, addon]) => {
                const isSelected = selectedAddons.includes(key as AddonKey);
                const isDisabled = 
                  (key === 'featuredPost' || key === 'socialGraphic') && 
                  selectedAddons.includes('featureAndSocialBundle') ||
                  (key === 'featureAndSocialBundle') && 
                  (selectedAddons.includes('featuredPost') || selectedAddons.includes('socialGraphic'));

                return (
                  <div
                    key={key}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => !isDisabled && handleAddonToggle(key as AddonKey)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getAddonIcon(key as AddonKey)}
                        <span className="ml-2 font-semibold text-gray-900">{addon.name}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">${addon.price}</span>
                    </div>
                    <p className="text-sm text-gray-600">{addon.description}</p>
                    {(addon as any).includes && (
                      <p className="text-xs text-green-600 mt-1">
                        Includes: {(addon as any).includes.map((i: string) => addonConfigs[i as AddonKey]?.name).join(', ')}
                      </p>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary and Checkout */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Review & Purchase</h3>
            </div>

            {/* Order Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{tierConfig.name}</span>
                  <span className="font-semibold">${tierConfig.monthlyPrice}</span>
                </div>
                {selectedAddons.map(addonKey => {
                  const addon = addonConfigs[addonKey];
                  return (
                    <div key={addonKey} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">+ {addon.name}</span>
                      <span className="text-gray-600">${addon.price}</span>
                    </div>
                  );
                })}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">${totalPrice}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">Monthly subscription • Credits expire in 30 days</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${totalPrice}`
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure payment powered by Stripe. Credits expire in 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
