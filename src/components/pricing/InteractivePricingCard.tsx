import React, { useState } from '@/components/ui/card';
import { motion } from '@/components/ui/card';
import { useUser } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { useRouter } from '@/components/ui/card';
import { Check, Star, CreditCard, Zap, Shield, Award } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

'use client';

// import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  description: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  badge?: string;
  chamberDiscount?: number;
}

interface InteractivePricingCardProps {
  plan: PricingPlan;
  billingInterval: 'monthly' | 'yearly';
  isChamberMember?: boolean;
  onSelect?: (planId: string, billingInterval: 'monthly' | 'yearly') => void;
  className?: string;
}

export default function InteractivePricingCard({
  plan,
  billingInterval,
  isChamberMember = false,
  onSelect,
  className = '',
}: InteractivePricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const basePrice =
    billingInterval === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const chamberPrice =
    isChamberMember && plan.chamberDiscount
      ? basePrice * (1 - plan.chamberDiscount / 100)
      : basePrice;

  const displayPrice = Math.round(chamberPrice);
  const originalPrice = billingInterval === 'yearly' ? plan.monthlyPrice : null;
  const savings =
    billingInterval === 'yearly'
      ? Math.round(plan.monthlyPrice * 12 - plan.yearlyPrice)
      : 0;

  const handleSelect = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    setLoading(true);

    try {
      // Call the onSelect callback if provided
      if (onSelect) {
        onSelect(plan.id, billingInterval);
        return;
      }

      // Default behavior: create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.id, // Send the plan ID, let the API resolve the actual Stripe price ID
          tier: plan.id,
          billingInterval,
          chamberMember: isChamberMember,
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
        plan.popular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-green-50 shadow-xl'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
      } ${className}`}
      onClick={handleSelect}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-1 text-white">
            <Star className="mr-1 h-3 w-3" />
            {plan.badge || 'Most Popular'}
          </Badge>
        </div>
      )}

      {/* Yearly Savings Badge */}
      {billingInterval === 'yearly' && savings > 0 && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-500 px-3 py-1 text-white">
            Save ${savings}
          </Badge>
        </div>
      )}

      {/* Chamber Member Badge */}
      {isChamberMember && plan.chamberDiscount && (
        <div className="absolute right-4 top-4">
          <Badge
            variant="outline"
            className="border-orange-300 bg-orange-50 text-orange-700"
          >
            <Award className="mr-1 h-3 w-3" />-{plan.chamberDiscount}%
          </Badge>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-gray-900">{plan.name}</h3>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-blue-600">
              ${displayPrice}
            </span>
            <span className="ml-1 text-gray-600">
              /{billingInterval === 'yearly' ? 'mo' : 'month'}
            </span>
          </div>

          {/* Original Price (crossed out) */}
          {originalPrice && billingInterval === 'yearly' && (
            <div className="text-sm text-gray-500">
              <span className="line-through">${originalPrice}/mo</span>
              <span className="ml-2 font-medium text-green-600">
                {plan.yearlyDiscount}% off
              </span>
            </div>
          )}

          {/* Chamber Member Pricing */}
          {isChamberMember && plan.chamberDiscount && (
            <div className="text-sm font-medium text-orange-700">
              Chamber price: ${Math.round(basePrice)} → ${displayPrice}
            </div>
          )}

          {/* Yearly Billing Note */}
          {billingInterval === 'yearly' && (
            <div className="mt-1 text-xs text-gray-500">
              Billed annually (${Math.round(plan.yearlyPrice)}/year)
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600">{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="mb-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Limitations */}
      {plan.limitations && plan.limitations.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-gray-900">
            Limitations:
          </h4>
          <ul className="space-y-1">
            {plan.limitations.map((limitation, index) => (
              <li
                key={index}
                className="flex items-start text-xs text-gray-500"
              >
                <span className="mr-2 mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400"></span>
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA Button */}
      <Button
        className={`w-full ${
          plan.popular
            ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg hover:from-blue-700 hover:to-green-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
        disabled={loading}
        onClick={e => {
          e.stopPropagation();
          handleSelect();
        }}
      >
        {loading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Get Started
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <Shield className="mr-1 h-3 w-3" />
        Secure payment with Stripe
      </div>
    </motion.div>
  );
}
