'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Star, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  highlight?: boolean;
  billingNote: string;
  aiTooltip?: string;
}

interface EnhancedPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Tier',
    monthlyPrice: 89,
    description: 'Perfect for small businesses hiring occasionally',
    features: [
      '2 job posts',
      '30 days duration',
      'AI optimization*',
      '2 featured posts',
    ],
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days',
    aiTooltip: 'Our AI suggests improvements to your job titles, descriptions, and categories to improve visibility.',
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    monthlyPrice: 199,
    description: 'Ideal for growing companies with multiple positions',
    features: [
      '5 job posts',
      '30 days duration',
      'AI optimization*',
      '2 featured posts',
    ],
    popular: true,
    badge: 'Most Popular',
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days',
    aiTooltip: 'Our AI suggests improvements to your job titles, descriptions, and categories to improve visibility.',
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    monthlyPrice: 349,
    description: 'For companies with high-volume hiring needs',
    features: [
      '10 job posts',
      '60 days duration',
      'AI optimization*',
      '2 featured posts',
    ],
    badge: 'Most Value',
    highlight: true,
    billingNote: '🗓️ Renews monthly • Job credits expire in 30 days',
    aiTooltip: 'Advanced AI features including bulk optimization, smart categorization, and performance insights.',
  },
];

// Add-on options
const addOns = [
  {
    id: 'featured',
    name: 'Featured Post',
    price: 49,
    description: 'Highlight your job at the top of search results',
  },
  {
    id: 'social',
    name: 'Social Post Graphic',
    price: 49,
    description: 'Custom social media graphic for your job post',
  },
  {
    id: 'bundle',
    name: 'Feature and Social Bundle',
    price: 85,
    description: 'Featured post + social graphic (save $13)',
    savings: 13,
    highlight: true,
  },
];

export default function EnhancedPricingModal({
  isOpen,
  onClose,
  onSelectPlan,
}: EnhancedPricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan);
  const totalAddOnPrice = selectedAddOns.reduce((total, addOnId) => {
    const addOn = addOns.find(a => a.id === addOnId);
    return total + (addOn?.price || 0);
  }, 0);

  const totalPrice = (selectedPlanData?.monthlyPrice || 0) + totalAddOnPrice;

  const handleProceed = () => {
    onSelectPlan(selectedPlan);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl mx-4"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Job Posting Package</h2>
              <p className="text-gray-600">Select a tier and optional add-ons to get started</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-8">
            {/* Step 1: Choose Base Tier */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="text-xl font-semibold text-gray-900">Choose Your Base Tier</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-orange-500 bg-orange-50'
                        : plan.highlight
                        ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-green-50'
                        : plan.popular
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {(plan.popular || plan.highlight) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={`${
                          plan.highlight 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                            : 'bg-gradient-to-r from-orange-600 to-green-600'
                        } text-white px-3 py-1 rounded-full text-sm font-medium`}>
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h4>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">${plan.monthlyPrice}</span>
                        <span className="text-gray-600">/mo</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{plan.billingNote}</p>

                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => {
                          const hasAiTooltip = feature.includes('*');
                          const displayFeature = feature.replace('*', '');
                          
                          return (
                            <li key={index} className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="flex-1">{displayFeature}</span>
                              {hasAiTooltip && (
                                <div className="group relative ml-1">
                                  <Info className="h-4 w-4 text-orange-500 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                    {plan.aiTooltip}
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Add Optional Enhancements */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-xl font-semibold text-gray-900">Add Optional Enhancements</h3>
              </div>
              <p className="text-gray-600 mb-4">Boost your job's visibility and reach with these add-ons:</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {addOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedAddOns.includes(addOn.id)
                        ? 'border-orange-500 bg-orange-50'
                        : addOn.highlight
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => {
                      if (selectedAddOns.includes(addOn.id)) {
                        setSelectedAddOns(prev => prev.filter(id => id !== addOn.id));
                      } else {
                        setSelectedAddOns(prev => [...prev, addOn.id]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{addOn.name}</h4>
                          {addOn.savings && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Save ${addOn.savings}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                        {addOn.highlight && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Includes: Featured Post, Social Post Graphic
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">${addOn.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Review & Purchase */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-xl font-semibold text-gray-900">Review & Purchase</h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPlanData?.name}</span>
                    <span className="font-bold">${selectedPlanData?.monthlyPrice}</span>
                  </div>
                  
                  {selectedAddOns.map(addOnId => {
                    const addOn = addOns.find(a => a.id === addOnId);
                    return addOn ? (
                      <div key={addOnId} className="flex justify-between text-sm">
                        <span>{addOn.name}</span>
                        <span>${addOn.price}</span>
                      </div>
                    ) : null;
                  })}
                  
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>You will be billed ${totalPrice} every month. Cancel anytime.</strong></p>
                    <p>Unused job credits expire after 30 days.</p>
                  </div>
                </div>

                <Button 
                  onClick={handleProceed}
                  className="w-full mt-6 bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white font-medium py-3"
                >
                  Proceed to Payment - ${totalPrice}
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-3">
                  Secure payment powered by Stripe. Credits expire in 60 days.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
