'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Percent } from 'lucide-react';
import InteractivePricingCard from './InteractivePricingCard';

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
  onPlanSelect?: (planId: string, billingInterval: 'monthly' | 'yearly') => void;
  className?: string;
}

export default function PricingSection({
  plans,
  title = "Choose Your Plan",
  subtitle = "Simple, transparent pricing for local businesses in the 209",
  showChamberToggle = true,
  onPlanSelect,
  className = ''
}: PricingSectionProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isChamberMember, setIsChamberMember] = useState(false);

  const maxYearlyDiscount = Math.max(...plans.map(plan => plan.yearlyDiscount || 0));

  return (
    <div className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm font-medium transition-colors ${
                billingInterval === 'monthly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </Label>
            <div className="relative">
              <Switch
                id="billing-toggle"
                checked={billingInterval === 'yearly'}
                onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
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
                  <Sparkles className="w-3 h-3 mr-1" />
                  Save up to {maxYearlyDiscount}%
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Chamber Member Toggle */}
          {showChamberToggle && (
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Switch
                id="chamber-toggle"
                checked={isChamberMember}
                onCheckedChange={setIsChamberMember}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-yellow-500"
              />
              <Label 
                htmlFor="chamber-toggle" 
                className="text-sm font-medium text-gray-700 flex items-center"
              >
                <Percent className="w-4 h-4 mr-1 text-orange-600" />
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
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
            className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                Chamber Member Exclusive Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-orange-700">
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
            className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Annual Billing Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
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
