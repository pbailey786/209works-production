import React, { useState } from '@/components/ui/card';
import { motion, AnimatePresence } from 'lucide-react';

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
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsellOptions = [
    {
      id: 'social-media',
      name: 'Social Media Shoutout',
      price: 0, // Price hidden from UI
      description:
        'Promote your job across our Instagram and X (Twitter) channels',
      features: [
        'Custom branded graphics for your job post',
        'Posted to 209 Works Instagram (5K+ local followers)',
        'Shared on X with relevant hashtags',
        'Reaches hyper-local 209 area audience',
      ],
      icon: <Instagram className="h-6 w-6" />,
      disabled:
        currentUpsells.socialMediaShoutout || currentUpsells.upsellBundle
    },
    {
      id: 'placement-bump',
      name: 'On-Site Placement Bump',
      price: 0, // Price hidden from UI
      description: 'JobsGPT actively promotes your position to chat users',
      features: [
        'AI chatbot recommends your job to relevant users',
        'Higher visibility in search results',
        'Priority placement in chat responses',
        'Increased application conversion rates',
      ],
      icon: <TrendingUp className="h-6 w-6" />,
      popular: true,
      disabled: currentUpsells.placementBump || currentUpsells.upsellBundle
    },
    {
      id: 'bundle',
      name: 'Complete Promotion Bundle',
      price: 0, // Price hidden from UI
      originalPrice: 0, // Price hidden from UI
      description: 'Get both services - best value!',
      features: [
        'Everything from Social Media Shoutout',
        'Everything from On-Site Placement Bump',
        'Priority customer support',
        'Extended promotion duration',
      ],
      icon: <Package className="h-6 w-6" />,
      badge: 'BEST VALUE',
      disabled: currentUpsells.upsellBundle
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          socialMediaShoutout:
            selectedOptions.has('social-media') ||
            selectedOptions.has('bundle'),
          placementBump:
            selectedOptions.has('placement-bump') ||
            selectedOptions.has('bundle'),
          upsellBundle: selectedOptions.has('bundle')
        })
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
      setError(
        error instanceof Error ? error.message : 'Failed to process upsells'
      );
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
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Boost Your Job's Visibility
                </h2>
                <p className="text-blue-100">
                  {jobTitle} at {company}
                </p>
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
            {availableOptions.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  All Promotions Active!
                </h3>
                <p className="text-gray-600">
                  Your job is already getting maximum visibility with all
                  available promotion features.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-gray-600">
                    Get more qualified applicants with our promotion add-ons
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                  {availableOptions.map(option => {
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
                            {isSelected && (
                              <Check className="h-4 w-4 text-white" />
                            )}
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

                        {/* Title */}
                        <div className="mb-3">
                          <h4 className="mb-1 text-lg font-semibold text-gray-900">
                            {option.name}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className="mb-4 text-sm text-gray-600">
                          {option.description}
                        </p>

                        {/* Features */}
                        <ul className="space-y-2">
                          {option.features.slice(0, 3).map((feature, index) => (
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

                {/* Purchase */}
                {selectedOptions.size > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-green-600">
                          Promotion Selected ✓
                        </h4>
                        <p className="text-sm text-gray-600">
                          Enhanced visibility package ready
                        </p>
                      </div>
                      <button
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className="flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Add Promotion
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-600">{error}</p>
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
