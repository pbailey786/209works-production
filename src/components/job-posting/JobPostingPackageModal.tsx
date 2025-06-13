'use client';

import { useState } from 'react';
import { X, Star, TrendingUp, Crown, Loader2 } from 'lucide-react';

interface JobPostingPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PackageTier {
  id: string;
  name: string;
  price: number;
  jobPosts: number;
  duration: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

const packageTiers: PackageTier[] = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: 50,
    jobPosts: 2,
    duration: 30,
    features: ['30 days duration'],
    icon: <Star className="h-5 w-5 text-blue-500" />,
    color: 'border-blue-500 bg-blue-50'
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    price: 99,
    jobPosts: 5,
    duration: 30,
    features: ['30 days duration', 'AI optimization'],
    popular: true,
    icon: <Star className="h-5 w-5 text-orange-500" />,
    color: 'border-orange-500 bg-orange-50'
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    price: 200,
    jobPosts: 10,
    duration: 30,
    features: ['30 days duration', 'AI optimization', '2 featured posts'],
    icon: <Crown className="h-5 w-5 text-purple-500" />,
    color: 'border-purple-500 bg-purple-50'
  }
];

const addOns: AddOn[] = [
  {
    id: 'featured',
    name: 'Featured Post',
    description: 'Highlight your job at the top of search results',
    price: 49,
    icon: <Star className="h-4 w-4" />
  },
  {
    id: 'social',
    name: 'Social Post Graphic',
    description: 'Custom social media graphic for your job post',
    price: 49,
    icon: <TrendingUp className="h-4 w-4" />
  }
];

export default function JobPostingPackageModal({ isOpen, onClose }: JobPostingPackageModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('starter');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const selectedPackage = packageTiers.find(tier => tier.id === selectedTier);
  const selectedAddOnItems = addOns.filter(addon => selectedAddOns.includes(addon.id));
  
  const bundleDiscount = selectedAddOns.length === 2 ? 13 : 0;
  const addOnTotal = selectedAddOnItems.reduce((sum, addon) => sum + addon.price, 0) - bundleDiscount;
  const total = (selectedPackage?.price || 0) + addOnTotal;

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    try {
      // Map add-on IDs to the expected format
      const addons = selectedAddOns.map(id => {
        switch (id) {
          case 'featured': return 'featuredPost';
          case 'social': return 'socialGraphic';
          default: return id;
        }
      });

      // Check if both add-ons are selected for bundle
      const hasBundle = selectedAddOns.length === 2;
      const finalAddons = hasBundle ? ['featureAndSocialBundle'] : addons;

      const response = await fetch('/api/job-posting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          addons: finalAddons,
          successUrl: `${window.location.origin}/employers/create-job-post?purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/create-job-post?purchase_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      // Handle error - could show a toast or error message
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Job Posting Package</h2>
            <p className="text-gray-600">Select a tier and optional add-ons to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Choose Base Tier */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium mr-3">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Choose Your Base Tier</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packageTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTier === tier.id 
                      ? tier.color 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {tier.icon}
                      <span className="ml-2 font-semibold text-gray-900">{tier.name}</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">${tier.price}</div>
                    <div className="text-sm text-gray-600 mb-3">{tier.jobPosts} job posts</div>
                    <ul className="text-sm text-gray-600 space-y-1 text-left">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Add Optional Enhancements */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full text-sm font-medium mr-3">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Add Optional Enhancements</h3>
            </div>
            <p className="text-gray-600 mb-4">Boost your job's visibility and reach with these add-ons:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAddOns.includes(addon.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAddOnToggle(addon.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {addon.icon}
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">{addon.name}</h4>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">${addon.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bundle Option */}
            <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Feature and Social Bundle</h4>
                  <p className="text-sm text-green-600">Featured post + social graphic (save $13)</p>
                  <p className="text-xs text-green-600 mt-1">Includes: Featured Post, Social Post Graphic</p>
                </div>
                <div className="text-lg font-bold text-green-800">$85</div>
              </div>
            </div>
          </div>

          {/* Step 3: Review & Purchase */}
          <div>
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-medium mr-3">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Review & Purchase</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{selectedPackage?.name}</span>
                <span className="font-medium">${selectedPackage?.price}</span>
              </div>
              {selectedAddOnItems.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">{addon.name}</span>
                  <span className="font-medium">${addon.price}</span>
                </div>
              ))}
              {bundleDiscount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Bundle Discount</span>
                  <span>-${bundleDiscount}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">${total}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">One-time payment • Credits expire in 30 days</p>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                  Processing...
                </>
              ) : (
                `Proceed to Payment - $${total}`
              )}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Secure payment powered by Stripe. Credits expire in 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
