import React, { useEffect, useState } from '@/components/ui/card';
import { loadStripe } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

'use client';


interface HostedCheckoutProps {
  sessionId: string;
  onBack?: () => void;
  mock?: boolean;
}

// Initialize Stripe with your publishable key
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function HostedCheckout({
  sessionId,
  onBack,
  mock = false
}: HostedCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToCheckout = async () => {
      try {
        console.log('🛒 Hosted checkout starting...');
        console.log('Session ID:', sessionId);
        console.log('Mock mode:', mock);

        // Handle mock mode
        if (mock || sessionId === 'mock_session_id') {
          console.log('Mock mode detected, skipping Stripe redirect');
          setLoading(false);
          return;
        }

        // Check if publishable key is available
        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured');
        }

        // Check if session ID is available
        if (!sessionId) {
          throw new Error('Session ID not provided');
        }

        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }

        console.log('🚀 Redirecting to Stripe checkout...');
        
        // Redirect to Stripe's hosted checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });

        if (error) {
          throw new Error(error.message);
        }

      } catch (err: any) {
        console.error('Error redirecting to checkout:', err);
        setError(err.message || 'Failed to redirect to payment');
        setLoading(false);
      }
    };

    if (sessionId) {
      redirectToCheckout();
    }
  }, [sessionId, mock]);

  if (loading && !mock) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Redirecting to secure checkout...</p>
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

  // Mock checkout form
  if (mock) {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
            <p className="text-gray-600">Demo checkout mode</p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-sm">ℹ️</span>
                <p className="text-blue-800 text-sm font-medium">Demo Mode</p>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                This is a demo checkout. In production, you would be redirected to Stripe's secure checkout page.
              </p>
            </div>

            <Button
              onClick={() => window.location.href = '/employers/dashboard?purchase_success=true'}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            >
              Complete Demo Purchase
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    );
  }

  return null;
}
