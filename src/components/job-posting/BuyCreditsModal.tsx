'use client';

import React, { useState } from 'react';
import { JOB_POSTING_CONFIG } from '@/lib/stripe';
import { 
  CreditCard, 
  Zap, 
  Package,
  Loader2,
  X,
  Check
} from 'lucide-react';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reason?: 'repost' | 'general';
  jobTitle?: string;
}

type CreditPackKey = 'singleCredit' | 'fiveCredits';

export default function BuyCreditsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  reason = 'general',
  jobTitle 
}: BuyCreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPackKey>('singleCredit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const creditPacks = JOB_POSTING_CONFIG.creditPacks;
  const selectedPackConfig = creditPacks[selectedPack];

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-posting/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditPack: selectedPack,
          successUrl: `${window.location.origin}/employers/dashboard?credit_purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?credit_purchase_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Credit purchase error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getReasonText = () => {
    if (reason === 'repost' && jobTitle) {
      return `You need job credits to repost "${jobTitle}". Purchase credits below:`;
    }
    return 'Purchase additional job posting credits:';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Buy Job Credits</h2>
            <p className="text-sm text-gray-600">{getReasonText()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Credit Pack Selection */}
          <div className="space-y-3 mb-6">
            {Object.entries(creditPacks).map(([key, pack]) => (
              <div
                key={key}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPack === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPack(key as CreditPackKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {key === 'singleCredit' ? (
                      <Zap className="h-5 w-5 text-blue-600 mr-3" />
                    ) : (
                      <Package className="h-5 w-5 text-purple-600 mr-3" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{pack.name}</div>
                      <div className="text-sm text-gray-600">{pack.description}</div>
                      {pack.savings && (
                        <div className="text-xs text-green-600 font-medium">
                          Save ${pack.savings}!
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${pack.price}</div>
                    <div className="text-xs text-gray-500">
                      ${(pack.price / pack.credits).toFixed(0)} per credit
                    </div>
                  </div>
                </div>
                {selectedPack === key && (
                  <div className="absolute top-3 right-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Purchase Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">{selectedPackConfig.name}</span>
              <span className="font-semibold">${selectedPackConfig.price}</span>
            </div>
            <div className="text-sm text-gray-600">
              You'll receive {selectedPackConfig.credits} job posting credit{selectedPackConfig.credits > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Credits expire in 60 days
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Purchase for ${selectedPackConfig.price}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
