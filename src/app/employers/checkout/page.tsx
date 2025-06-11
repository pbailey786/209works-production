'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EmbeddedCheckout from '@/components/checkout/EmbeddedCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);

  const plan = searchParams.get('plan');

  useEffect(() => {
    if (!plan) {
      setError('No plan selected');
      setLoading(false);
      return;
    }

    const createCheckoutSession = async () => {
      try {
        setLoading(true);

        // Always try the real Stripe function first since you have the keys configured
        const endpoint = '/.netlify/functions/create-checkout-session';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: plan,
            success_url: `${window.location.origin}/employers/dashboard?success=true&plan=${plan}`,
            cancel_url: `${window.location.origin}/employers/pricing?cancelled=true`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Handle Stripe response
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPlanDetails({
            plan: data.plan,
            returnUrl: data.returnUrl,
          });
        } else {
          throw new Error('Invalid checkout session response');
        }

      } catch (err: any) {
        console.error('Checkout session error:', err);
        setError(err.message || 'Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    createCheckoutSession();
  }, [plan]);

  const handleBack = () => {
    router.push('/employers/pricing');
  };

  // Note: Embedded checkout completion is handled via return_url in the Netlify function
  // The checkout will automatically redirect when payment is complete

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Setting up your checkout...</h2>
          <p className="mt-2 text-gray-600">Please wait while we prepare your payment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleBack} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4a3e] shadow-lg">
              <span className="text-sm font-bold text-[#9fdf9f]">209</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2d4a3e]">209 Works</h1>
              <p className="text-sm text-gray-500">Secure Checkout</p>
            </div>
          </div>
        </div>

        {/* Plan Summary */}
        {plan && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </h3>
            <p className="text-gray-600 mb-4">
              You're subscribing to the {plan} plan for your 209 Works employer account.
            </p>

            {/* Billing Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Monthly Subscription</h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <p className="font-semibold">
                      You will be billed ${plan === 'starter' ? '89' : plan === 'standard' ? '199' : '350'} every month. Cancel anytime.
                    </p>
                    <p className="mt-1">
                      Unused job credits expire after 30 days. You can repost expired jobs anytime with a new credit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Checkout */}
        {clientSecret && (
          <div className="rounded-lg bg-white shadow-sm">
            <EmbeddedCheckout
              clientSecret={clientSecret}
              onBack={handleBack}
              mock={planDetails?.mock}
              returnUrl={planDetails?.returnUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployerCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
