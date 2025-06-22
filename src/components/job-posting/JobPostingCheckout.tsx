'use client';

import React, { useState, useEffect } from 'react';
import { JOB_POSTING_CONFIG, SUBSCRIPTION_TIERS_CONFIG } from '@/lib/stripe';
import {
  Check,
  Star,
  Zap,
  RefreshCw,
  Share2,
  Crown,
  Loader2,
  X,
  CreditCard,
  Coins,
  Sparkles,
  TrendingUp,
  Instagram,
  AlertCircle
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

interface UserSubscriptionStatus {
  hasActiveSubscription: boolean;
  currentTier?: string;
  subscription?: {
    tier: string;
    status: string;
    endDate?: string;
  };
}

interface UserCreditBalance {
  universal: number;
  total: number;
}

type TierKey = 'starter' | 'standard' | 'pro';
type AddonKey = 'featuredPost' | 'socialGraphic';
type CreditPackKey = 'small' | 'medium' | 'large';

export default function JobPostingCheckout({ isOpen, onClose, onSuccess, userCredits }: JobPostingCheckoutProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey>('starter');
  const [selectedAddons, setSelectedAddons] = useState<AddonKey[]>([]);
  const [selectedCreditPack, setSelectedCreditPack] = useState<CreditPackKey>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for user subscription and credit status
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null);
  const [creditBalance, setCreditBalance] = useState<UserCreditBalance | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Fetch user subscription status and credit balance when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserStatus();
    }
  }, [isOpen]);

  const fetchUserStatus = async () => {
    setIsLoadingStatus(true);
    try {
      // Fetch subscription status
      const subscriptionResponse = await fetch('/api/employers/subscription/status');
      const subscriptionData = await subscriptionResponse.json();

      // Fetch credit balance
      const creditsResponse = await fetch('/api/job-posting/credits');
      const creditsData = await creditsResponse.json();

      if (!subscriptionResponse.ok) {
        console.error('Subscription API error:', subscriptionData);
        throw new Error(`Subscription API failed: ${subscriptionData.error || 'Unknown error'}`);
      }

      if (!creditsResponse.ok) {
        console.error('Credits API error:', creditsData);
        throw new Error(`Credits API failed: ${creditsData.error || 'Unknown error'}`);
      }

      setSubscriptionStatus({
        hasActiveSubscription: subscriptionData.hasActiveSubscription,
        currentTier: subscriptionData.currentTier,
        subscription: subscriptionData.subscription,
      });

      setCreditBalance({
        universal: creditsData.universal || 0,
        total: creditsData.total || 0,
      });

    } catch (error) {
      console.error('Failed to fetch user status:', error);
      // Set default values on error
      setSubscriptionStatus({ hasActiveSubscription: false });
      setCreditBalance({ universal: 0, total: 0 });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  if (!isOpen) return null;

  // Determine user state for conditional logic
  const getUserState = () => {
    if (!subscriptionStatus || !creditBalance) return 'loading';

    const hasCredits = creditBalance.total > 0;
    const hasSubscription = subscriptionStatus.hasActiveSubscription;

    if (hasSubscription && hasCredits) return 'subscription_with_credits';
    if (hasSubscription && !hasCredits) return 'subscription_no_credits';
    return 'no_subscription';
  };

  const userState = getUserState();

  // Credit pack configurations
  const creditPacks = {
    small: { name: 'Small Pack', credits: 3, description: 'Perfect for a few job posts' },
    medium: { name: 'Medium Pack', credits: 5, description: 'Great for regular posting' },
    large: { name: 'Large Pack', credits: 12, description: 'Best value for high-volume hiring' },
  };

  // Calculate total credits needed
  const getCreditsNeeded = () => {
    let baseCredits = 1; // Base job post
    if (selectedAddons.includes('featuredPost')) baseCredits += 1;
    if (selectedAddons.includes('socialGraphic')) baseCredits += 1;
    return baseCredits;
  };

  const creditsNeeded = getCreditsNeeded();

  // Handler for using existing credits (Case A)
  const handleUseCredits = () => {
    onClose();
    window.location.href = '/employers/create-job-post';
  };

  // Handler for buying more credits (Case B)
  const handleBuyCredits = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-posting/buy-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditPack: selectedCreditPack,
          successUrl: `${window.location.origin}/employers/dashboard?credit_purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?credit_purchase_cancelled=true`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for subscription purchase (Case C)
  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          addons: [],
          successUrl: `${window.location.origin}/employers/dashboard?purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?purchase_cancelled=true`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddonToggle = (addonKey: AddonKey) => {
    setSelectedAddons(prev =>
      prev.includes(addonKey)
        ? prev.filter(a => a !== addonKey)
        : prev.concat(addonKey)
    );
  };

  // Render loading state
  if (isLoadingStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Loading your account status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Case A: Active subscription + available credits
  const renderSubscriptionWithCredits = () => (
    <div className="p-6">
      {/* Credit Balance Display */}
      <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 border border-[#2d4a3e] rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Coins className="h-6 w-6 text-[#2d4a3e] mr-2" />
              <h3 className="text-xl font-bold text-[#2d4a3e]">You have {creditBalance?.total || 0} universal credits</h3>
            </div>
            <p className="text-sm text-[#2d4a3e] mb-3">
              Use your existing credits to post jobs, add featured listings, or create social graphics
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#2d4a3e]">{creditBalance?.total || 0}</div>
            <div className="text-sm text-[#2d4a3e]">Credits</div>
          </div>
        </div>
      </div>

      {/* Add-on Upgrades */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Sparkles className="h-5 w-5 text-[#ff6b35] mr-2" />
          Upgrade Your Job Post
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedAddons.includes('featuredPost')
                ? 'border-[#ff6b35] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleAddonToggle('featuredPost')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-[#ff6b35] mr-2" />
                <span className="font-semibold">Featured Listing</span>
              </div>
              <div className="flex items-center">
                <Coins className="h-4 w-4 text-[#ff6b35] mr-1" />
                <span className="font-bold text-[#ff6b35]">+1 Credit</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Highlight your job at the top of search results</p>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedAddons.includes('socialGraphic')
                ? 'border-[#2d4a3e] bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleAddonToggle('socialGraphic')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Instagram className="h-5 w-5 text-[#2d4a3e] mr-2" />
                <span className="font-semibold">Social Media Graphic</span>
              </div>
              <div className="flex items-center">
                <Coins className="h-4 w-4 text-[#2d4a3e] mr-1" />
                <span className="font-bold text-[#2d4a3e]">+1 Credit</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Custom social media graphic for your job post</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Credits Needed:</span>
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-[#2d4a3e] mr-1" />
            <span className="text-2xl font-bold text-[#2d4a3e]">{creditsNeeded}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {creditsNeeded === 1 ? 'Base job post' : `Base job post + ${creditsNeeded - 1} upgrade${creditsNeeded > 2 ? 's' : ''}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleUseCredits}
        disabled={isLoading || (creditBalance?.total || 0) < creditsNeeded}
        className="w-full bg-[#2d4a3e] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#1d3a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <Coins className="h-5 w-5 mr-2" />
        Use {creditsNeeded} Credit{creditsNeeded > 1 ? 's' : ''} to Post Job
      </button>

      {(creditBalance?.total || 0) < creditsNeeded && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-sm text-amber-700">
              You need {creditsNeeded - (creditBalance?.total || 0)} more credit{creditsNeeded - (creditBalance?.total || 0) > 1 ? 's' : ''} for this job post with upgrades.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Render Case B: Active subscription + zero credits
  const renderSubscriptionNoCredits = () => (
    <div className="p-6">
      {/* Out of Credits Banner */}
      <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-amber-800">You're out of credits. Buy more to continue posting.</h3>
            <p className="text-sm text-amber-700 mt-1">
              Choose a credit pack below to continue posting jobs with your active subscription.
            </p>
          </div>
        </div>
      </div>

      {/* Credit Pack Options */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Credit Pack</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(creditPacks).map(([key, pack]) => (
            <div
              key={key}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedCreditPack === key
                  ? 'border-[#2d4a3e] bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCreditPack(key as CreditPackKey)}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Coins className="h-6 w-6 text-[#2d4a3e] mr-2" />
                  <span className="text-2xl font-bold text-[#2d4a3e]">{pack.credits}</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">{pack.name}</h5>
                <p className="text-sm text-gray-600">{pack.description}</p>
                <div className="mt-2 text-xs text-[#2d4a3e] font-medium">Universal Credits</div>
              </div>
              {selectedCreditPack === key && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-[#2d4a3e] rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleBuyCredits}
        disabled={isLoading}
        className="w-full bg-[#2d4a3e] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#1d3a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Buy More Credits
          </>
        )}
      </button>
    </div>
  );

  // Render Case C: No active subscription
  const renderNoSubscription = () => (
    <div className="p-6">
      {/* Subscription Required Banner */}
      <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 border border-[#2d4a3e] rounded-xl">
        <div className="text-center">
          <Crown className="h-8 w-8 text-[#2d4a3e] mx-auto mb-2" />
          <h3 className="text-xl font-bold text-[#2d4a3e] mb-2">Start your subscription and get credits to post jobs immediately</h3>
          <p className="text-sm text-[#2d4a3e]">
            Choose a plan below to unlock job posting with AI optimization and get universal credits.
          </p>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SUBSCRIPTION_TIERS_CONFIG).map(([key, tier]) => (
            <div
              key={key}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedTier === key
                  ? 'border-[#2d4a3e] bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${tier.popular ? 'ring-2 ring-[#ff6b35] ring-opacity-50' : ''}`}
              onClick={() => setSelectedTier(key as TierKey)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#ff6b35] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center">
                <h5 className="font-bold text-xl text-gray-900 mb-2">{tier.name}</h5>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${tier.monthlyPrice}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center">
                    <Coins className="h-4 w-4 text-[#2d4a3e] mr-2" />
                    <span className="font-semibold">{tier.features.credits} universal credits</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#9fdf9f] mr-2" />
                    <span>{tier.features.duration} days duration</span>
                  </div>
                  {tier.features.aiOptimization && (
                    <div className="flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[#ff6b35] mr-2" />
                      <span>AI optimization</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#9fdf9f] mr-2" />
                    <span className="capitalize">{tier.features.analytics} analytics</span>
                  </div>
                </div>
              </div>

              {selectedTier === key && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#2d4a3e] rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total:</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${SUBSCRIPTION_TIERS_CONFIG[selectedTier].monthlyPrice}
            </div>
            <div className="text-sm text-gray-600">
              Includes {SUBSCRIPTION_TIERS_CONFIG[selectedTier].features.credits} Credits
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full bg-[#2d4a3e] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#1d3a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Crown className="h-5 w-5 mr-2" />
            Subscribe & Get Credits
          </>
        )}
      </button>
    </div>
  );

  // Get the appropriate title and description based on user state
  const getModalContent = () => {
    switch (userState) {
      case 'subscription_with_credits':
        return {
          title: 'Post Your Job',
          description: 'Use your existing credits to create and optimize your job listing',
          content: renderSubscriptionWithCredits(),
        };
      case 'subscription_no_credits':
        return {
          title: 'Buy More Credits',
          description: 'Your subscription is active - just need more credits to continue posting',
          content: renderSubscriptionNoCredits(),
        };
      case 'no_subscription':
        return {
          title: 'Choose Your Job Posting Package',
          description: 'Select a subscription plan to start posting jobs with AI optimization',
          content: renderNoSubscription(),
        };
      default:
        return {
          title: 'Choose Your Job Posting Package',
          description: 'Loading your account status...',
          content: <div>Loading...</div>,
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-4xl w-full mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{modalContent.title}</h2>
            <p className="text-gray-600">{modalContent.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Dynamic Content Based on User State */}
        {modalContent.content}
      </div>
    </div>
  );
}
