'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Instagram, 
  TrendingUp, 
  Package, 
  Star, 
  Check, 
  X,
  Sparkles,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface JobPostingUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (selectedUpsells: {
    socialMediaShoutout: boolean;
    placementBump: boolean;
    upsellBundle: boolean;
    total: number;
  }) => void;
  jobTitle: string;
  company: string;
  userCredits?: {
    jobPost: number;
    featuredPost: number;
    socialGraphic: number;
  };
}

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

const upsellOptions: UpsellOption[] = [
  {
    id: 'social-media',
    name: 'Social Media Shoutout',
    price: 0, // Price hidden from UI
    description: 'Promote your job across our Instagram and X (Twitter) channels',
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
    description: 'JobsGPT actively promotes your job to chat users',
    features: [
      'AI prioritizes your job in chat recommendations',
      'Featured in "hot jobs" conversations',
      'Increased visibility in search results',
      'Priority placement for 30 days',
      'Enhanced job matching algorithms',
      'Detailed performance analytics',
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    popular: true,
  },
  {
    id: 'complete-bundle',
    name: 'Complete Promotion Bundle',
    price: 0, // Price hidden from UI
    originalPrice: 0, // Price hidden from UI
    description: 'Both services together - best value!',
    features: [
      'Everything from Social Media Shoutout',
      'Everything from On-Site Placement Bump',
      'Priority customer support',
      'Extended 45-day promotion period',
      'Comprehensive analytics dashboard',
      'Best value for maximum exposure',
    ],
    icon: <Package className="h-6 w-6" />,
    badge: 'Best Value',
  },
];

export default function JobPostingUpsellModal({
  isOpen,
  onClose,
  onContinue,
  jobTitle,
  company,
  userCredits,
}: JobPostingUpsellModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOptionToggle = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    
    // Handle bundle logic
    if (optionId === 'complete-bundle') {
      if (newSelected.has('complete-bundle')) {
        newSelected.delete('complete-bundle');
      } else {
        newSelected.clear();
        newSelected.add('complete-bundle');
      }
    } else {
      // If selecting individual options, remove bundle
      newSelected.delete('complete-bundle');
      
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
    }
    
    setSelectedOptions(newSelected);
  };

  const calculateTotal = () => {
    if (selectedOptions.has('complete-bundle')) {
      return 85;
    }
    
    let total = 0;
    selectedOptions.forEach(optionId => {
      const option = upsellOptions.find(opt => opt.id === optionId);
      if (option) {
        total += option.price;
      }
    });
    return total;
  };

  const handleContinue = () => {
    const hasBundle = selectedOptions.has('complete-bundle');
    const hasSocial = selectedOptions.has('social-media') || hasBundle;
    const hasPlacement = selectedOptions.has('placement-bump') || hasBundle;
    
    onContinue({
      socialMediaShoutout: hasSocial,
      placementBump: hasPlacement,
      upsellBundle: hasBundle,
      total: calculateTotal(),
    });
  };

  const handleSkip = () => {
    onContinue({
      socialMediaShoutout: false,
      placementBump: false,
      upsellBundle: false,
      total: 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🚀 Boost Your Job Posting
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Get more qualified applicants for "{jobTitle}" at {company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Jobs with promotion get on average:
              </p>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">3.2x</div>
                  <div className="text-xs text-gray-600">More Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2.8x</div>
                  <div className="text-xs text-gray-600">More Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">40%</div>
                  <div className="text-xs text-gray-600">Faster Hiring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upsell Options */}
          <div className="grid gap-4 md:grid-cols-3">
            {upsellOptions.map((option) => (
              <Card 
                key={option.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  selectedOptions.has(option.id) 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : 'border-gray-200'
                } ${option.popular ? 'border-green-500' : ''}`}
                onClick={() => handleOptionToggle(option.id)}
              >
                {option.badge && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                    {option.badge}
                  </Badge>
                )}
                {option.popular && !option.badge && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full ${
                      selectedOptions.has(option.id) ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {option.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{option.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {option.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {option.features.length > 4 && (
                      <li className="text-xs text-gray-500 italic">
                        +{option.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                  
                  <div className="mt-4 flex items-center justify-center">
                    <Checkbox
                      checked={selectedOptions.has(option.id)}
                      onChange={() => handleOptionToggle(option.id)}
                      className="h-5 w-5"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Total and Actions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                {selectedOptions.size > 0 && (
                  <p className="text-lg font-semibold text-green-600">
                    Promotion Selected ✓
                  </p>
                )}
                {selectedOptions.size > 0 && (
                  <p className="text-sm text-gray-600">
                    30-day promotion period
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isProcessing}
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {selectedOptions.size > 0 ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Add Selected Promotion
                    </>
                  ) : (
                    <>
                      Continue to Publish
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {selectedOptions.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  Your job will be published with selected promotions. Payment will be processed via Stripe.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
