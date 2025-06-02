'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Megaphone, 
  TrendingUp, 
  Package, 
  Check, 
  Star,
  Instagram,
  MessageSquare,
  Sparkles,
  DollarSign,
  CreditCard
} from 'lucide-react';

interface JobUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  company: string;
  currentUpsells?: {
    socialMediaShoutout: boolean;
    placementBump: boolean;
    upsellBundle: boolean;
  };
  onSuccess?: () => void;
}

export default function JobUpsellModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  company,
  currentUpsells = {
    socialMediaShoutout: false,
    placementBump: false,
    upsellBundle: false
  },
  onSuccess
}: JobUpsellModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsellOptions = [
    {
      id: 'social-media',
      name: 'Social Media Shoutout',
      price: 29,
      description: 'Promote your job across our Instagram and X (Twitter) channels',
      features: [
        'Custom branded graphics for your job post',
        'Posted to 209 Works Instagram (5K+ local followers)',
        'Shared on X with relevant hashtags',
        'Reaches hyper-local 209 area audience'
      ],
      icon: <Instagram className="w-6 h-6" />,
      disabled: currentUpsells.socialMediaShoutout || currentUpsells.upsellBundle,
    },
    {
      id: 'placement-bump',
      name: 'On-Site Placement Bump',
      price: 29,
      description: 'JobsGPT actively promotes your position to chat users',
      features: [
        'AI chatbot recommends your job to relevant users',
        'Higher visibility in search results',
        'Priority placement in chat responses',
        'Increased application conversion rates'
      ],
      icon: <TrendingUp className="w-6 h-6" />,
      popular: true,
      disabled: currentUpsells.placementBump || currentUpsells.upsellBundle,
    },
    {
      id: 'bundle',
      name: 'Complete Promotion Bundle',
      price: 50,
      originalPrice: 58,
      description: 'Get both services and save $8!',
      features: [
        'Everything from Social Media Shoutout',
        'Everything from On-Site Placement Bump',
        'Priority customer support',
        'Extended promotion duration'
      ],
      icon: <Package className="w-6 h-6" />,
      badge: 'SAVE $8',
      disabled: currentUpsells.upsellBundle,
    },
  ];

  const availableOptions = upsellOptions.filter(option => !option.disabled);

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
    if (selectedOptions.has('bundle')) return 50;
    
    let total = 0;
    if (selectedOptions.has('social-media')) total += 29;
    if (selectedOptions.has('placement-bump')) total += 29;
    return total;
  };

  const handlePurchase = async () => {
    if (selectedOptions.size === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/upsells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          socialMediaShoutout: selectedOptions.has('social-media') || selectedOptions.has('bundle'),
          placementBump: selectedOptions.has('placement-bump') || selectedOptions.has('bundle'),
          upsellBundle: selectedOptions.has('bundle'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process upsells');
      }

      const data = await response.json();
      
      // Success! Close modal and notify parent
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error processing upsells:', error);
      setError(error instanceof Error ? error.message : 'Failed to process upsells');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Boost Your Job's Visibility</h2>
                <p className="text-blue-100">
                  {jobTitle} at {company}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {availableOptions.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  All Promotions Active!
                </h3>
                <p className="text-gray-600">
                  Your job is already getting maximum visibility with all available promotion features.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Get more qualified applicants with our promotion add-ons
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {availableOptions.map((option) => {
                    const isSelected = selectedOptions.has(option.id);
                    
                    return (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }`}
                        onClick={() => handleOptionToggle(option.id)}
                      >
                        {/* Popular Badge */}
                        {option.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              POPULAR
                            </span>
                          </div>
                        )}

                        {/* Save Badge */}
                        {option.badge && (
                          <div className="absolute -top-3 right-4">
                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              {option.badge}
                            </span>
                          </div>
                        )}

                        {/* Selection Indicator */}
                        <div className="absolute top-4 right-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {option.icon}
                        </div>

                        {/* Title and Price */}
                        <div className="mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
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
                        <p className="text-gray-600 text-sm mb-4">
                          {option.description}
                        </p>

                        {/* Features */}
                        <ul className="space-y-2">
                          {option.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Total and Purchase */}
                {selectedOptions.size > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Total: ${calculateTotal()}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          One-time payment for enhanced visibility
                        </p>
                      </div>
                      <button
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Purchase Now
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
