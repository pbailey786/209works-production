import React, { useState, useEffect } from '@/components/ui/card';
import { motion } from 'framer-motion';

'use client';

  Megaphone,
  TrendingUp,
  Package,
  Check,
  Star,
  Instagram,
  MessageSquare,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface UpsellOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  badge?: string;
}

interface JobUpsellSelectorProps {
  onSelectionChange: (selection: {
    socialMediaShoutout: boolean;
    placementBump: boolean;
    upsellBundle: boolean;
    total: number;
  }) => void;
  className?: string;
}

const upsellOptions: UpsellOption[] = [
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
      'Includes company logo and branding',
      'Reaches hyper-local 209 area audience',
      'Analytics report on engagement',
    ],
    icon: <Instagram className="h-6 w-6" />,
  },
  {
    id: 'placement-bump',
    name: 'On-Site Placement Bump',
    price: 0, // Price hidden from UI
    description: 'JobsGPT actively promotes your position to chat users',
    features: [
      'AI chatbot recommends your job to relevant users',
      'Higher visibility in search results',
      'Personalized job suggestions to qualified candidates',
      'Priority placement in chat responses',
      'Increased application conversion rates',
      'Smart matching with user profiles',
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    popular: true,
  },
  {
    id: 'bundle',
    name: 'Complete Promotion Bundle',
    price: 0, // Price hidden from UI
    originalPrice: 0, // Price hidden from UI
    description: 'Get both services for maximum exposure!',
    features: [
      'Everything from Social Media Shoutout',
      'Everything from On-Site Placement Bump',
      'Priority customer support',
      'Extended promotion duration',
      'Comprehensive analytics dashboard',
      'Best value for maximum exposure',
    ],
    icon: <Package className="h-6 w-6" />,
    badge: 'BEST VALUE',
  },
];

export default function JobUpsellSelector({
  onSelectionChange,
  className = '',
}: JobUpsellSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set()
  );
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Calculate total and determine which options are selected
    let calculatedTotal = 0;
    const socialMedia = selectedOptions.has('social-media');
    const placementBump = selectedOptions.has('placement-bump');
    const bundle = selectedOptions.has('bundle');

    if (bundle) {
      calculatedTotal = 85;
    } else {
      if (socialMedia) calculatedTotal += 49;
      if (placementBump) calculatedTotal += 49;
    }

    setTotal(calculatedTotal);

    onSelectionChange({
      socialMediaShoutout: socialMedia || bundle,
      placementBump: placementBump || bundle,
      upsellBundle: bundle,
      total: calculatedTotal,
    });
  }, [selectedOptions, onSelectionChange]);

  const handleOptionToggle = (optionId: string) => {
    const newSelection = new Set(selectedOptions);

    if (optionId === 'bundle') {
      if (newSelection.has('bundle')) {
        // Removing bundle
        newSelection.delete('bundle');
      } else {
        // Adding bundle - remove individual options
        newSelection.clear();
        newSelection.add('bundle');
      }
    } else {
      // Individual option
      if (newSelection.has(optionId)) {
        newSelection.delete(optionId);
      } else {
        // Remove bundle if selecting individual options
        newSelection.delete('bundle');
        newSelection.add(optionId);
      }
    }

    setSelectedOptions(newSelection);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold text-gray-900">
          Boost Your Job's Visibility
        </h3>
        <p className="text-gray-600">
          Get more qualified applicants with our promotion add-ons
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {upsellOptions.map(option => {
          const isSelected = selectedOptions.has(option.id);
          const isDisabled =
            option.id !== 'bundle' && selectedOptions.has('bundle');

          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                isSelected
                  ? 'border-[#ff6b35] bg-gradient-to-r from-[#ff6b35]/5 to-[#ff8c42]/5 shadow-lg'
                  : isDisabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => !isDisabled && handleOptionToggle(option.id)}
            >
              {/* Popular Badge */}
              {option.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <span className="flex items-center rounded-full bg-[#ff6b35] px-3 py-1 text-xs font-bold text-white">
                    <Star className="mr-1 h-3 w-3" />
                    POPULAR
                  </span>
                </div>
              )}

              {/* Save Badge */}
              {option.badge && (
                <div className="absolute -top-3 right-4">
                  <span className="rounded-full bg-[#2d4a3e] px-3 py-1 text-xs font-bold text-white">
                    {option.badge}
                  </span>
                </div>
              )}

              {/* Selection Indicator */}
              <div className="absolute right-4 top-4">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-[#ff6b35] bg-[#ff6b35]'
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
                    ? 'bg-[#ff6b35]/10 text-[#ff6b35]'
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
                {/* Pricing removed per unified credit system */}
              </div>

              {/* Description */}
              <p className="mb-4 text-sm text-gray-600">{option.description}</p>

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
                {option.features.length > 3 && (
                  <li className="text-sm italic text-gray-500">
                    +{option.features.length - 3} more features
                  </li>
                )}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Total Summary */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#ff6b35]/20 bg-gradient-to-r from-[#ff6b35]/5 to-[#2d4a3e]/5 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="mr-3 h-6 w-6 text-[#ff6b35]" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Promotion Add-ons Selected
                </h4>
                <p className="text-sm text-gray-600">
                  Your job will get maximum visibility in the 209 area
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-2xl font-bold text-gray-900">
                <DollarSign className="h-6 w-6" />
                {total}
              </div>
              <p className="text-sm text-gray-600">one-time fee</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Selection State */}
      {total === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-8 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <h4 className="mb-2 text-lg font-medium text-gray-600">
            No promotion add-ons selected
          </h4>
          <p className="text-sm text-gray-500">
            Your job will be posted with standard visibility
          </p>
        </div>
      )}
    </div>
  );
}
