'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onBack?: () => void;
}

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function EmbeddedCheckout({
  clientSecret,
  onBack
}: EmbeddedCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeEmbeddedCheckout = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }

        if (!checkoutRef.current) {
          throw new Error('Checkout container not found');
        }

        // Create embedded checkout
        const embeddedCheckout = await stripe.initEmbeddedCheckout({
          clientSecret,
        });

        // Mount the embedded checkout
        embeddedCheckout.mount(checkoutRef.current);

        setLoading(false);

        // Note: Embedded checkout completion is handled via return_url
        // The checkout will automatically redirect to the return_url when complete

      } catch (err: any) {
        console.error('Error initializing embedded checkout:', err);
        setError(err.message || 'Failed to load payment system');
        setLoading(false);
      }
    };

    if (clientSecret) {
      initializeEmbeddedCheckout();
    }
  }, [clientSecret]);

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

  if (!clientSecret) {
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

      {/* Embedded Checkout Container */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading payment form...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>
          </div>
        )}

        {/* This div will contain the embedded checkout */}
        <div ref={checkoutRef} className={loading || error ? 'hidden' : ''} />
      </div>

      {/* Security notice */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}
