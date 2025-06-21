'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Percent } from 'lucide-react';


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

interface PricingSectionProps {
  plans: PricingPlan[];
  title?: string;
  subtitle?: string;
  showChamberToggle?: boolean;
  onPlanSelect?: (
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ) => void;
  className?: string;
}

export default function PricingSection({
  plans,
  title = 'Choose Your Plan',
  subtitle = 'Simple, transparent pricing for local businesses in the 209',
  showChamberToggle = true,
  onPlanSelect,
  className = '',
}: PricingSectionProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [isChamberMember, setIsChamberMember] = useState(false);

  const maxYearlyDiscount = Math.max(
    ...plans.map(plan => plan.yearlyDiscount || 0)
  );

  return (
    <div className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            {subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="mb-6 flex items-center justify-center space-x-4">
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Monthly
            </Label>
            <div className="relative">
              <Switch
                id="billing-toggle"
                checked={billingInterval === 'yearly'}
                onCheckedChange={checked =>
                  setBillingInterval(checked ? 'yearly' : 'monthly')
                }
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-green-600"
              />
            </div>
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium transition-colors ${
                billingInterval === 'yearly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly
            </Label>
            {billingInterval === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-2"
              >
                <Badge className="bg-green-500 text-white">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Save up to {maxYearlyDiscount}%
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Chamber Member Toggle */}
          {showChamberToggle && (
            <div className="mb-8 flex items-center justify-center space-x-3">
              <Switch
                id="chamber-toggle"
                checked={isChamberMember}
                onCheckedChange={setIsChamberMember}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-yellow-500"
              />
              <Label
                htmlFor="chamber-toggle"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Percent className="mr-1 h-4 w-4 text-orange-600" />
                I'm a Chamber of Commerce member
              </Label>
              {isChamberMember && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Badge className="bg-orange-500 text-white">
                    Extra 25% off!
                  </Badge>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${billingInterval}-${isChamberMember}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <InteractivePricingCard
                  plan={plan}
                  billingInterval={billingInterval}
                  isChamberMember={isChamberMember}
                  onSelect={onPlanSelect}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span>Local support team</span>
            </div>
          </div>
        </div>

        {/* Chamber Member Benefits */}
        {isChamberMember && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-6"
          >
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-orange-800">
                Chamber Member Exclusive Benefits
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm text-orange-700 md:grid-cols-3">
                <div>✓ 25% discount on all plans</div>
                <div>✓ Priority customer support</div>
                <div>✓ Exclusive networking events</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Yearly Benefits */}
        {billingInterval === 'yearly' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6"
          >
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-green-800">
                Annual Billing Benefits
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm text-green-700 md:grid-cols-3">
                <div>✓ Up to {maxYearlyDiscount}% savings</div>
                <div>✓ Priority feature access</div>
                <div>✓ Annual strategy consultation</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
