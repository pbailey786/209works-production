import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  TrendingUp, 
  Eye, 
  Mail, 
  CheckCircle, 
  Info,
  Zap,
  Crown,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface FeaturedPostUpgradeProps {
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  hasCredits: boolean;
  currentCredits: number;
  onBuyCredits?: () => void;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export default function FeaturedPostUpgrade({
  isSelected,
  onToggle,
  hasCredits,
  currentCredits,
  onBuyCredits,
  disabled = false,
  className,
  showPreview = true,
}: FeaturedPostUpgradeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const benefits = [
    {
      icon: TrendingUp,
      title: "Top of Search Results",
      description: "Your job appears at the very top of all relevant searches"
    },
    {
      icon: Eye,
      title: "Increased Visibility",
      description: "3x more views compared to regular job postings"
    },
    {
      icon: Mail,
      title: "Email Alerts",
      description: "Sent directly to matching job seekers (75%+ AI match score)"
    },
    {
      icon: Star,
      title: "Premium Badge",
      description: "Eye-catching featured badge and highlighted styling"
    }
  ];

  const handleToggle = (checked: boolean) => {
    if (disabled) return;
    
    if (checked && !hasCredits) {
      // Show credit purchase flow
      if (onBuyCredits) {
        onBuyCredits();
      }
      return;
    }
    
    onToggle(checked);
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isSelected ? [
        "border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-orange-50",
        "ring-2 ring-yellow-400 ring-opacity-30 shadow-lg shadow-yellow-100"
      ] : "border-gray-200 hover:border-yellow-200",
      disabled && "opacity-60 cursor-not-allowed",
      className
    )}>
      {/* Premium Background Effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none" />
      )}

      <div className="p-6">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
              isSelected 
                ? "bg-gradient-to-r from-yellow-400 to-orange-500" 
                : "bg-gray-100"
            )}>
              <Crown className={cn(
                "w-5 h-5",
                isSelected ? "text-white" : "text-gray-600"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Feature This Job
                <Badge 
                  variant="secondary" 
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  1 Credit
                </Badge>
              </h3>
              <p className="text-sm text-gray-600">
                📣 Boost your post — Featured jobs appear at the top of search results
              </p>
            </div>
          </div>
          
          <Switch
            checked={isSelected}
            onCheckedChange={handleToggle}
            disabled={disabled}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-400 data-[state=checked]:to-orange-500"
          />
        </div>

        {/* Credit Status */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-2 h-2 rounded-full",
                hasCredits ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="font-medium">
                {hasCredits 
                  ? `${currentCredits} credit${currentCredits !== 1 ? 's' : ''} available`
                  : "No credits available"
                }
              </span>
            </div>
            
            {!hasCredits && onBuyCredits && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBuyCredits}
                className="text-xs"
              >
                Buy Credits
              </Button>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <benefit.icon className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{benefit.title}</h4>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewVisible(!previewVisible)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewVisible ? "Hide Preview" : "See How It Looks"}
            </Button>

            <AnimatePresence>
              {previewVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="relative rounded-lg border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 shadow-lg">
                    {/* Featured Badge */}
                    <div className="absolute -right-2 -top-2 z-10">
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        <Star className="h-3 w-3" />
                        Featured
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900">Your Job Title Here</h4>
                      <p className="text-sm text-gray-600">Your Company • Your Location</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                          Full-time
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Boosted
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Your job description preview appears here with enhanced visibility...
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    This is how your featured job will appear
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Featured Job Benefits:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Appears in weekly email alerts to matching candidates</li>
                <li>• 3x more visibility than regular postings</li>
                <li>• Premium styling and badge for maximum impact</li>
                <li>• Detailed analytics tracking included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}