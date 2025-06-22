'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EmbeddedCheckoutProps {
  sessionId?: string;
  clientSecret?: string; // Keep for backward compatibility
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
        console.log('Stripe publishable key value:', publishableKey ? publishableKey.substring(0, 10) + '...' : 'undefined');
        console.log('Stripe publishable key type:', typeof publishableKey);
        console.log('Client secret available:', !!clientSecret);
        console.log('Client secret prefix:', clientSecret ? clientSecret.substring(0, 10) + '...' : 'undefined');
        console.log('Mock mode:', mock);
        console.log('Checkout ref current:', !!checkoutRef.current);

        // Check if publishable key looks correct
        if (publishableKey && !publishableKey.startsWith('pk_')) {
          console.error('❌ INVALID PUBLISHABLE KEY: Key does not start with pk_');
          console.error('Key value:', publishableKey);
        }

        // Check if client secret looks correct
        if (clientSecret && clientSecret.startsWith('sk_')) {
          console.error('❌ INVALID CLIENT SECRET: Client secret appears to be a secret key!');
          console.error('Client secret prefix:', clientSecret.substring(0, 20));
        }

        // Handle mock mode early
        if (mock || clientSecret === 'mock_client_secret') {
          console.log('Mock mode detected, skipping Stripe initialization');
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
        const maxRetries = 30; // Increased retries
        let container: HTMLDivElement | null = null;

        // Wait for the ref to be available
        while (!container && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          container = checkoutRef.current;
          console.log(`Retry ${retries + 1}: Container found:`, !!container);
          console.log(`Retry ${retries + 1}: Container details:`, {
            refCurrent: !!checkoutRef.current,
            refCurrentId: checkoutRef.current?.id,
            refCurrentClass: checkoutRef.current?.className,
            refCurrentStyle: checkoutRef.current?.style.display,
          });
          retries++;
        }

        if (!container) {
          console.error('Container search failed. Available elements:', {
            refCurrent: !!checkoutRef.current,
            getElementById: !!document.getElementById('stripe-checkout-container'),
            allDivs: document.querySelectorAll('div[id*="stripe"]').length,
            allCheckoutDivs: document.querySelectorAll('div[ref*="checkout"]').length,
          });
          throw new Error('Checkout container not found after waiting');
        }

        console.log('Found checkout container:', !!container);

        // Create embedded checkout
        const embeddedCheckout = await stripe.initEmbeddedCheckout({
          clientSecret,
        });

        // Mount the embedded checkout
        embeddedCheckout.mount(container);

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

      {/* Mock checkout form */}
      {mock && !loading && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
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

            <div className="space-y-6">
              <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Secure Payment Processing</h4>
                <p className="text-sm text-blue-700 mb-4">
                  All payments are processed securely through Stripe Checkout. We never handle or store your payment information directly.
                </p>
                <div className="text-xs text-blue-600 space-y-1">
                  <p>✓ PCI DSS Level 1 Compliant</p>
                  <p>✓ 256-bit SSL Encryption</p>
                  <p>✓ Advanced Fraud Protection</p>
                  <p>✓ 3D Secure Authentication</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">How Payment Works:</h5>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Click "Complete Purchase" below</li>
                  <li>2. You'll be redirected to Stripe's secure checkout page</li>
                  <li>3. Enter your payment details on Stripe's secure form</li>
                  <li>4. Complete your purchase and return to 209 Works</li>
                </ol>
              </div>

              <Button
                onClick={() => returnUrl && (window.location.href = returnUrl)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                Complete Demo Purchase
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Real Stripe checkout container - Only show when not in mock mode */}
      {!mock && clientSecret !== 'mock_client_secret' && (
        <div
          ref={checkoutRef}
          className="rounded-lg border border-gray-200 bg-white p-4 min-h-[400px]"
          id="stripe-checkout-container"
        />
      )}

      {/* Security notice */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}
