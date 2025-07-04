'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Instagram, 
  Star,
  Zap,
  Check,
  CreditCard
} from 'lucide-react';

interface JobPostUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  credits: { universal: number; total: number };
  onPurchase: (upsells: { featured: boolean; social: boolean }) => void;
}

const UPSELL_OPTIONS = [
  {
    id: 'featured',
    title: 'Featured Post',
    price: 1,
    icon: Star,
    color: 'from-yellow-400 to-orange-500',
    description: 'Priority placement and enhanced visibility',
    benefits: [
      'Appears at top of search results',
      'Enhanced visual styling with badges',
      'Priority in AI job recommendations',
      '3x more candidate views on average'
    ]
  },
  {
    id: 'social',
    title: 'Social Media Promotion',
    price: 1,
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    description: 'Promoted to 5K+ local followers',
    benefits: [
      'Professional Instagram post with your branding',
      'X (Twitter) promotion with local hashtags',
      'Reaches 5,000+ Central Valley job seekers',
      'Custom branded graphics included'
    ]
  }
];

export default function JobPostUpsellModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  credits,
  onPurchase
}: JobPostUpsellModalProps) {
  const [selectedUpsells, setSelectedUpsells] = useState<{ featured: boolean; social: boolean }>({
    featured: false,
    social: false
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

  const toggleUpsell = (type: 'featured' | 'social') => {
    setSelectedUpsells(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTotalCost = () => {
    let cost = 0;
    if (selectedUpsells.featured) cost += 1;
    if (selectedUpsells.social) cost += 1;
    
    // Bundle discount - if both selected, save $10 (in credit equivalent)
    if (selectedUpsells.featured && selectedUpsells.social) {
      return 2; // No discount in credits, but bundle them together
    }
    
    return cost;
  };

  const handlePurchase = async () => {
    if (getTotalCost() === 0) return;
    
    setIsPurchasing(true);
    try {
      await onPurchase(selectedUpsells);
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const hasEnoughCredits = credits.universal >= getTotalCost();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Boost Your Job Post!</h2>
                    <p className="text-orange-100">Get more qualified candidates</p>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <p className="text-sm text-orange-100 mb-1">Just posted:</p>
                  <p className="font-semibold truncate">{jobTitle}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Want to reach more candidates?
                  </h3>
                  <p className="text-gray-600">
                    Add these premium features to get 3-5x more qualified applications
                  </p>
                </div>

                {/* Upsell Options */}
                <div className="space-y-4 mb-6">
                  {UPSELL_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedUpsells[option.id as keyof typeof selectedUpsells];
                    
                    return (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleUpsell(option.id as 'featured' | 'social')}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {option.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">+{option.price} credit</span>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{option.description}</p>
                            
                            <ul className="space-y-1">
                              {option.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {option.id === 'featured' && (
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                            POPULAR
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bundle Message */}
                {selectedUpsells.featured && selectedUpsells.social && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Great choice! You've selected our complete promotion package.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Stats Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Expected Results:</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUpsells.featured && selectedUpsells.social ? '5x' 
                         : selectedUpsells.featured || selectedUpsells.social ? '3x' 
                         : '1x'}
                      </div>
                      <div className="text-xs text-gray-600">More Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUpsells.featured && selectedUpsells.social ? '4x' 
                         : selectedUpsells.featured || selectedUpsells.social ? '2.5x' 
                         : '1x'}
                      </div>
                      <div className="text-xs text-gray-600">Applications</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUpsells.social ? '5K+' : '500+'}
                      </div>
                      <div className="text-xs text-gray-600">Total Reach</div>
                    </div>
                  </div>
                </div>

                {/* Credits Check */}
                {!hasEnoughCredits && getTotalCost() > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Need more credits
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          You need {getTotalCost()} credits but only have {credits.universal}. 
                          <button 
                            onClick={() => window.open('/employers/credits', '_blank')}
                            className="ml-1 underline font-medium hover:text-amber-800"
                          >
                            Buy more credits →
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Total cost: <span className="font-semibold">{getTotalCost()} credits</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      You have {credits.universal} credits available
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Maybe Later
                    </button>
                    
                    <button
                      onClick={handlePurchase}
                      disabled={!hasEnoughCredits || getTotalCost() === 0 || isPurchasing}
                      className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isPurchasing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : getTotalCost() === 0 ? (
                        <span>Select Options Above</span>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Boost My Job</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}