'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Instagram,
  TrendingUp,
  Package,
  Check,
  Star,
  CreditCard,
  Loader2,
  Sparkles
} from 'lucide-react';

interface PromotionUpsellPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  jobTitle?: string;
  company?: string;
}

export default function PromotionUpsellPopup({
  isOpen,
  onClose,
  onSuccess,
  jobTitle = 'Your Job',
  company = 'Your Company'
}: PromotionUpsellPopupProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const promotionOptions = [
    {
      id: 'social-media',
      name: 'Social Media Shoutout',
      price: 49,
      description: 'Promote your job across our Instagram and X (Twitter) channels',
      features: [
        'Custom branded graphics for your job post',
        'Posted to 209 Works Instagram (5K+ local followers)',
        'Shared on X with relevant hashtags',
        '+3 more features'
      ],
      icon: <Instagram className="h-6 w-6" />,
    },
    {
      id: 'placement-bump',
      name: 'On-Site Placement Bump',
      price: 49,
      description: 'JobsGPT actively promotes your position to chat users',
      features: [
        'AI chatbot recommends your job to relevant users',
        'Higher visibility in search results',
        'Personalized job suggestions to qualified candidates',
        '+3 more features'
      ],
      icon: <TrendingUp className="h-6 w-6" />,
      popular: true,
    },
    {
      id: 'bundle',
      name: 'Complete Promotion Bundle',
      price: 85,
      originalPrice: 98,
      description: 'Get both services and save $13!',
      features: [
        'Everything from Social Media Shoutout',
        'Everything from On-Site Placement Bump',
        'Priority customer support',
        '+3 more features'
      ],
      icon: <Package className="h-6 w-6" />,
      badge: 'SAVE $13',
    },
  ];

  const handleOptionToggle = (optionId: string) => {
    const newSelection = new Set(selectedOptions);

    if (optionId === 'bundle') {
      if (newSelection.has('bundle')) {
        newSelection.delete('bundle');
      } else {
        newSelection.clear();
        newSelection.add('bundle');
      }
    } else {
      if (newSelection.has(optionId)) {
        newSelection.delete(optionId);
      } else {
        newSelection.delete('bundle');
        newSelection.add(optionId);
      }
    }

    setSelectedOptions(newSelection);
  };

  const calculateTotal = () => {
    if (selectedOptions.has('bundle')) return 85;

    let total = 0;
    if (selectedOptions.has('social-media')) total += 49;
    if (selectedOptions.has('placement-bump')) total += 49;
    return total;
  };

  const handlePurchase = async () => {
    if (selectedOptions.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create Stripe checkout session for promotion add-ons
      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addons: Array.from(selectedOptions),
          successUrl: `${window.location.origin}/employers/dashboard?promotion_success=true`,
          cancelUrl: `${window.location.origin}/employers/dashboard?promotion_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Boost Your Job's Visibility</h2>
                <p className="text-white/90">Get more qualified applicants with our promotion add-ons</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Job Info */}
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center">
                <Sparkles className="mr-3 h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Job Post Optimized!</h3>
                  <p className="text-sm text-green-700">
                    {jobTitle} at {company} is ready to go live
                  </p>
                </div>
              </div>
            </div>

            {/* Promotion Options */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {promotionOptions.map(option => {
                const isSelected = selectedOptions.has(option.id);

                return (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => handleOptionToggle(option.id)}
                  >
                    {/* Popular Badge */}
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                        <span className="flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                          <Star className="mr-1 h-3 w-3" />
                          POPULAR
                        </span>
                      </div>
                    )}

                    {/* Save Badge */}
                    {option.badge && (
                      <div className="absolute -top-3 right-4">
                        <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                          {option.badge}
                        </span>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    <div className="absolute right-4 top-4">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.icon}
                    </div>

                    {/* Title and Price */}
                    <div className="mb-3">
                      <h4 className="mb-1 text-lg font-semibold text-gray-900">
                        {option.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ${option.price}
                        </span>
                        {option.originalPrice && (
                          <span className="text-lg text-gray-500 line-through">
                            ${option.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 text-sm text-gray-600">
                      {option.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            {/* No Selection State */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-gray-100 p-3">
                    <Sparkles className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      No promotion add-ons selected
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your job will be posted with standard visibility
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between space-x-4">
              <button
                onClick={handleSkip}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Skip for now
              </button>

              {selectedOptions.size > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      Total: ${calculateTotal()}
                    </p>
                    <p className="text-xs text-gray-500">One-time payment</p>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="flex items-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#ff5722] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Purchase Now
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
