'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  Star, 
  CreditCard, 
  Zap,
  Shield,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  className = ''
}: InteractivePricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const basePrice = billingInterval === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const chamberPrice = isChamberMember && plan.chamberDiscount 
    ? basePrice * (1 - plan.chamberDiscount / 100) 
    : basePrice;
  
  const displayPrice = Math.round(chamberPrice);
  const originalPrice = billingInterval === 'yearly' ? plan.monthlyPrice : null;
  const savings = billingInterval === 'yearly' 
    ? Math.round((plan.monthlyPrice * 12) - plan.yearlyPrice)
    : 0;

  const handleSelect = async () => {
    if (!session) {
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
          priceId: `${plan.id}_${billingInterval}`, // This would map to actual Stripe price IDs
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
      className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
        plan.popular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-green-50 shadow-xl'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
      } ${className}`}
      onClick={handleSelect}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            {plan.badge || 'Most Popular'}
          </Badge>
        </div>
      )}

      {/* Yearly Savings Badge */}
      {billingInterval === 'yearly' && savings > 0 && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-500 text-white px-3 py-1">
            Save ${savings}
          </Badge>
        </div>
      )}

      {/* Chamber Member Badge */}
      {isChamberMember && plan.chamberDiscount && (
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
            <Award className="w-3 h-3 mr-1" />
            -{plan.chamberDiscount}%
          </Badge>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        
        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-blue-600">
              ${displayPrice}
            </span>
            <span className="text-gray-600 ml-1">
              /{billingInterval === 'yearly' ? 'mo' : 'month'}
            </span>
          </div>
          
          {/* Original Price (crossed out) */}
          {originalPrice && billingInterval === 'yearly' && (
            <div className="text-sm text-gray-500">
              <span className="line-through">${originalPrice}/mo</span>
              <span className="text-green-600 ml-2 font-medium">
                {plan.yearlyDiscount}% off
              </span>
            </div>
          )}

          {/* Chamber Member Pricing */}
          {isChamberMember && plan.chamberDiscount && (
            <div className="text-sm text-orange-700 font-medium">
              Chamber price: ${Math.round(basePrice)} → ${displayPrice}
            </div>
          )}

          {/* Yearly Billing Note */}
          {billingInterval === 'yearly' && (
            <div className="text-xs text-gray-500 mt-1">
              Billed annually (${Math.round(plan.yearlyPrice)}/year)
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Limitations */}
      {plan.limitations && plan.limitations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Limitations:</h4>
          <ul className="space-y-1">
            {plan.limitations.map((limitation, index) => (
              <li key={index} className="text-xs text-gray-500 flex items-start">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
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
            ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg'
            : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect();
        }}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Get Started
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <Shield className="w-3 h-3 mr-1" />
        Secure payment with Stripe
      </div>
    </motion.div>
  );
}
