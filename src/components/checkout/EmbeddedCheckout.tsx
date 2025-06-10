'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { loadStripe, StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onBack?: () => void;
  onComplete?: (session: any) => void;
}

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function EmbeddedCheckout({ 
  clientSecret, 
  onBack, 
  onComplete 
}: EmbeddedCheckoutProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }
        setStripe(stripeInstance);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Stripe:', err);
        setError('Failed to load payment system');
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  const handleComplete = useCallback((event: any) => {
    console.log('Checkout completed:', event);
    if (onComplete) {
      onComplete(event);
    }
  }, [onComplete]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!stripe || !clientSecret) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid checkout session</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Embedded Checkout */}
      <div className="rounded-lg border border-gray-200 bg-white p-1">
        <StripeEmbeddedCheckout
          stripe={stripe}
          clientSecret={clientSecret}
          onComplete={handleComplete}
        />
      </div>

      {/* Security notice */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}
