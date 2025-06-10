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

        // Use mock function if Stripe keys are not configured
        const hasStripeKeys = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        const endpoint = hasStripeKeys
          ? '/.netlify/functions/create-checkout-session'
          : '/.netlify/functions/create-checkout-session-mock';

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

        // Handle mock response (redirect directly)
        if (data.mock && data.url) {
          window.location.href = data.url;
          return;
        }

        // Handle real Stripe response
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
            <p className="text-gray-600">
              You're subscribing to the {plan} plan for your 209 Works employer account.
            </p>
          </div>
        )}

        {/* Embedded Checkout */}
        {clientSecret && (
          <div className="rounded-lg bg-white shadow-sm">
            <EmbeddedCheckout
              clientSecret={clientSecret}
              onBack={handleBack}
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
