'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onBack?: () => void;
  mock?: boolean;
  returnUrl?: string;
}

// Initialize Stripe with your publishable key
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function EmbeddedCheckout({
  clientSecret,
  onBack,
  mock = false,
  returnUrl
}: EmbeddedCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeEmbeddedCheckout = async () => {
      try {
        // Debug environment variable
        console.log('Stripe publishable key available:', !!publishableKey);
        console.log('Client secret available:', !!clientSecret);
        console.log('Mock mode:', mock);
        console.log('Checkout ref current:', !!checkoutRef.current);

        // Handle mock mode
        if (mock) {
          setLoading(false);
          return;
        }

        // Check if publishable key is available
        if (!publishableKey) {
          throw new Error(`Stripe publishable key not configured. Found: ${publishableKey || 'undefined'}`);
        }

        // Check if client secret is available
        if (!clientSecret) {
          throw new Error('Client secret not provided');
        }

        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Failed to load Stripe. Please check your publishable key.');
        }

        // Wait for the container to be available
        let retries = 0;
        const maxRetries = 10;

        while (!checkoutRef.current && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!checkoutRef.current) {
          throw new Error('Checkout container not found after waiting');
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
  }, [clientSecret, mock]);

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

        {/* Mock checkout form */}
        {mock && !loading && !error && (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-sm">ℹ️</span>
                <p className="text-blue-800 text-sm font-medium">Demo Mode</p>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                This is a demo checkout. Stripe integration will be enabled once environment variables are configured.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>

              <Button
                onClick={() => returnUrl && (window.location.href = returnUrl)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                Complete Demo Purchase
              </Button>
            </div>
          </div>
        )}

        {/* Real Stripe checkout container */}
        <div
          ref={checkoutRef}
          className={loading || error || mock ? 'hidden' : 'min-h-[400px]'}
          id="stripe-checkout-container"
        />
      </div>

      {/* Security notice */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}
