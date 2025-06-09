'use client';

import { useState, useEffect } from 'react';
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

export default function CreditsCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const packageId = searchParams.get('package');
    const quantityParam = searchParams.get('quantity');
    
    if (packageId && CREDIT_PACKAGES[packageId]) {
      setSelectedPackage(CREDIT_PACKAGES[packageId]);
    }
    
    if (quantityParam) {
      setQuantity(parseInt(quantityParam) || 1);
    }
  }, [searchParams]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      // This is where Stripe integration will go
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to success page
      router.push('/employers/dashboard?purchase=success');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center">
        <Link
          href="/employers/dashboard"
          className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Credits</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Order Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Order Summary</h2>
          
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedPackage.name}</h3>
              {selectedPackage.popular && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Most Popular
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedPackage.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
                  Job Credits
                </span>
                <span className="font-medium">{selectedPackage.jobCredits}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />
                  Featured Credits
                </span>
                <span className="font-medium">{selectedPackage.featuredCredits}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold">
                <span>Total</span>
                <span>${(totalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Payment Details</h2>
          
          {/* Stripe Integration Placeholder */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Stripe Integration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Secure payment processing will be integrated here using Stripe Checkout.
            </p>
            <div className="text-xs text-gray-500">
              <p>✓ PCI DSS Compliant</p>
              <p>✓ 256-bit SSL Encryption</p>
              <p>✓ Fraud Protection</p>
            </div>
          </div>

          {/* Security Features */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="mr-2 h-4 w-4 text-green-500" />
              <span>Secure 256-bit SSL encryption</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              <span>Credits added instantly after payment</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
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

      {/* Development Note */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-900">
          🚧 Development Note
        </h3>
        <p className="text-sm text-blue-800">
          This is the Stripe integration preparation. The actual Stripe Checkout will be integrated here,
          allowing secure credit card processing. For now, clicking "Complete Purchase" will simulate
          a successful transaction and redirect to the dashboard.
        </p>
      </div>
    </div>
  );
}
