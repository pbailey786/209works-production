'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Check,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
} from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  jobCredits: number;
  featuredCredits: number;
  price: number;
  description: string;
  popular?: boolean;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    jobCredits: 5,
    featuredCredits: 1,
    price: 2500,
    description: 'Perfect for small businesses',
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    jobCredits: 15,
    featuredCredits: 3,
    price: 5000,
    description: 'Great for growing companies',
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    jobCredits: 50,
    featuredCredits: 10,
    price: 15000,
    description: 'For large organizations',
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk Credits',
    jobCredits: 100,
    featuredCredits: 20,
    price: 25000,
    description: 'Maximum value pack',
  },
};

function CreditsCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    const packageId = searchParams.get('package');
    const quantityParam = searchParams.get('quantity');

    if (packageId && CREDIT_PACKAGES[packageId]) {
      setSelectedPackage(CREDIT_PACKAGES[packageId]);
    }

    if (quantityParam) {
      setQuantity(parseInt(quantityParam) || 1);
    }

    // Check subscription status
    checkSubscriptionStatus();
  }, [searchParams]);

  const checkSubscriptionStatus = async () => {
    setSubscriptionLoading(true);
    try {
      const response = await fetch('/api/employers/subscription/status');
      if (response.ok) {
        const data = await response.json();
        const hasSubscription = data.hasActiveSubscription || false;
        setHasActiveSubscription(hasSubscription);

        // Redirect if no active subscription
        if (!hasSubscription) {
          router.push('/employers/pricing?message=subscription_required_for_credits');
          return;
        }
      } else {
        setHasActiveSubscription(false);
        router.push('/employers/pricing?message=subscription_required_for_credits');
        return;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasActiveSubscription(false);
      router.push('/employers/pricing?message=subscription_required_for_credits');
      return;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    // Check if user has active subscription
    if (!hasActiveSubscription) {
      alert('You need an active subscription to purchase additional credits. Please upgrade your subscription first.');
      router.push('/employers/pricing');
      return;
    }

    setLoading(true);
    try {
      // Create Stripe Checkout session for credit purchase
      const response = await fetch('/api/job-posting/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditPack: selectedPackage.id,
          successUrl: `${window.location.origin}/employers/dashboard?credit_purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/credits/checkout?cancelled=true`,
        }),
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

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Redirect if no subscription (this should not render due to redirect in checkSubscriptionStatus)
  if (hasActiveSubscription === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Subscription Required</h1>
          <p className="mb-6 text-gray-600">Redirecting to pricing page...</p>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Invalid Package</h1>
        <p className="mb-6 text-gray-600">The selected credit package was not found.</p>
        <Link
          href="/employers/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const totalPrice = selectedPackage.price * quantity;
  const totalJobCredits = selectedPackage.jobCredits * quantity;
  const totalFeaturedCredits = selectedPackage.featuredCredits * quantity;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link
            href="/employers/dashboard"
            className="mr-4 flex items-center text-gray-600 hover:text-[#2d4a3e]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2d4a3e]">Purchase Credits</h1>
        </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Order Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-[#2d4a3e]">Order Summary</h2>

          <div className="mb-6 rounded-lg border border-[#2d4a3e]/20 bg-[#2d4a3e]/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#2d4a3e]">{selectedPackage.name}</h3>
              {selectedPackage.popular && (
                <span className="rounded-full bg-[#ff6b35] px-2 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedPackage.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-[#ff6b35]" />
                  Job Credits
                </span>
                <span className="font-medium">{selectedPackage.jobCredits}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-[#9fdf9f]" />
                  Featured Credits
                </span>
                <span className="font-medium">{selectedPackage.featuredCredits}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#2d4a3e] mb-2">
              Quantity
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#ff6b35] focus:outline-none focus:ring-1 focus:ring-[#ff6b35]"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Total Calculation */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Job Credits ({totalJobCredits})</span>
                <span>${(selectedPackage.price * quantity / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Featured Credits ({totalFeaturedCredits})</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-[#2d4a3e]">
                <span>Total</span>
                <span>${(totalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-[#2d4a3e]">Payment Details</h2>

          {/* Stripe Checkout Information */}
          <div className="mb-6 rounded-lg border-2 border-solid border-[#2d4a3e]/20 bg-[#2d4a3e]/5 p-6 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-[#2d4a3e]" />
            <h3 className="mb-2 text-lg font-semibold text-[#2d4a3e]">Secure Payment Processing</h3>
            <p className="text-sm text-gray-600 mb-4">
              When you click "Complete Purchase", you'll be redirected to Stripe's secure checkout page to enter your payment details.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center justify-center">
                <span className="mr-1">✓</span> PCI DSS Level 1 Compliant
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-1">✓</span> 256-bit SSL Encryption
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-1">✓</span> Advanced Fraud Protection
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-1">✓</span> 3D Secure Authentication
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="mr-2 h-4 w-4 text-[#9fdf9f]" />
              <span>Secure 256-bit SSL encryption</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="mr-2 h-4 w-4 text-[#ff6b35]" />
              <span>Credits added instantly after payment</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Check className="mr-2 h-4 w-4 text-[#9fdf9f]" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>

          {/* Subscription Warning */}
          {!subscriptionLoading && !hasActiveSubscription && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-red-100 p-1">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Subscription Required</h3>
                  <p className="text-sm text-red-700 mt-1">
                    You need an active subscription to purchase additional credits.
                    <Link href="/employers/pricing" className="underline hover:text-red-800 ml-1">
                      Upgrade your subscription first →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={loading || !hasActiveSubscription}
            className="w-full rounded-lg bg-[#2d4a3e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1d3a2e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : !hasActiveSubscription ? (
              'Subscription Required'
            ) : (
              `Complete Purchase - $${(totalPrice / 100).toFixed(2)}`
            )}
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            Credits are non-refundable but can be used for any job postings on 209 Works.
          </p>
        </div>
      </div>

      {/* Payment Security Notice */}
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-green-800">
          🔒 Secure Payment Processing
        </h3>
        <p className="text-sm text-green-700">
          All payments are processed securely through Stripe. We never store or handle your payment information directly.
          Your data is protected with bank-level security and encryption.
        </p>
      </div>
    </div>
    </div>
  );
}

export default function CreditsCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CreditsCheckoutContent />
    </Suspense>
  );
}
