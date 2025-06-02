'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  TrendingUp, 
  Package, 
  Check, 
  Star,
  Instagram,
  MessageSquare,
  Sparkles,
  DollarSign
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
    price: 29,
    description: 'Promote your job across our Instagram and X (Twitter) channels',
    features: [
      'Custom branded graphics for your job post',
      'Posted to 209 Works Instagram (5K+ local followers)',
      'Shared on X with relevant hashtags',
      'Includes company logo and branding',
      'Reaches hyper-local 209 area audience',
      'Analytics report on engagement'
    ],
    icon: <Instagram className="w-6 h-6" />,
  },
  {
    id: 'placement-bump',
    name: 'On-Site Placement Bump',
    price: 29,
    description: 'JobsGPT actively promotes your position to chat users',
    features: [
      'AI chatbot recommends your job to relevant users',
      'Higher visibility in search results',
      'Personalized job suggestions to qualified candidates',
      'Priority placement in chat responses',
      'Increased application conversion rates',
      'Smart matching with user profiles'
    ],
    icon: <TrendingUp className="w-6 h-6" />,
    popular: true,
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
      'Extended promotion duration',
      'Comprehensive analytics dashboard',
      'Best value for maximum exposure'
    ],
    icon: <Package className="w-6 h-6" />,
    badge: 'SAVE $8',
  },
];

export default function JobUpsellSelector({ onSelectionChange, className = '' }: JobUpsellSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Calculate total and determine which options are selected
    let calculatedTotal = 0;
    const socialMedia = selectedOptions.has('social-media');
    const placementBump = selectedOptions.has('placement-bump');
    const bundle = selectedOptions.has('bundle');

    if (bundle) {
      calculatedTotal = 50;
    } else {
      if (socialMedia) calculatedTotal += 29;
      if (placementBump) calculatedTotal += 29;
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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Boost Your Job's Visibility
        </h3>
        <p className="text-gray-600">
          Get more qualified applicants with our promotion add-ons
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upsellOptions.map((option) => {
          const isSelected = selectedOptions.has(option.id);
          const isDisabled = option.id !== 'bundle' && selectedOptions.has('bundle');
          
          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => !isDisabled && handleOptionToggle(option.id)}
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
                {option.features.length > 3 && (
                  <li className="text-sm text-gray-500 italic">
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
          className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Promotion Add-ons Selected
                </h4>
                <p className="text-gray-600 text-sm">
                  Your job will get maximum visibility in the 209 area
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-2xl font-bold text-gray-900">
                <DollarSign className="w-6 h-6" />
                {total}
              </div>
              <p className="text-sm text-gray-600">one-time fee</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Selection State */}
      {total === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No promotion add-ons selected
          </h4>
          <p className="text-gray-500 text-sm">
            Your job will be posted with standard visibility
          </p>
        </div>
      )}
    </div>
  );
}
