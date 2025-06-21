'use client';

import React, { useState, useEffect } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useUnifiedToast } from '@/components/ui/unified-toast-system';

interface Addon {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  featuresIncluded: string[];
  badgeText?: string;
  isPopular: boolean;
}

interface JobUpsellsProps {
  jobId?: string;
  onPurchaseComplete?: (addon: Addon) => void;
  showJobPostAddons?: boolean;
}

export default function JobUpsells({ jobId, onPurchaseComplete, showJobPostAddons = false }: JobUpsellsProps) {
  const [addons, setAddons] = useState<{
    promotion: Addon[];
    jobPosts: Addon[];
  }>({ promotion: [], jobPosts: [] });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { error: showError } = useUnifiedToast();

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const response = await fetch('/api/jobs/upsells?action=addons');
      if (response.ok) {
        const data = await response.json();
        setAddons(data.addons);
      } else {
        showError('Failed to load addons');
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
      showError('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (addon: Addon) => {
    setPurchasing(addon.id);
    
    try {
      const response = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addonId: addon.id,
          jobId: jobId,
          returnUrl: window.location.href
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to start purchase');
      }
    } catch (error) {
      console.error('Error starting purchase:', error);
      showError('Failed to start purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const getAddonIcon = (slug: string) => {
    switch (slug) {
      case 'social-media-bump':
        return <Users className="h-5 w-5" />;
      case 'featured-placement':
        return <Star className="h-5 w-5" />;
      case 'social-featured-bundle':
        return <Zap className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Promotion Addons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Boost Your Job Posting</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addons.promotion.map((addon) => (
            <Card key={addon.id} className={`relative ${addon.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
              {addon.badgeText && (
                <Badge 
                  className="absolute -top-2 -right-2 z-10"
                  variant={addon.badgeText === 'Best Value' ? 'default' : 'secondary'}
                >
                  {addon.badgeText}
                </Badge>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {getAddonIcon(addon.slug)}
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                </div>
                <CardDescription>{addon.shortDescription}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-green-600">
                  ${addon.price}
                  <span className="text-sm font-normal text-gray-500 ml-1">one-time</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  {addon.featuresIncluded.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handlePurchase(addon)}
                  disabled={purchasing === addon.id}
                  className="w-full"
                  variant={addon.badgeText === 'Best Value' ? 'default' : 'outline'}
                >
                  {purchasing === addon.id ? 'Processing...' : `Add for $${addon.price}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Job Post Addons */}
      {showJobPostAddons && addons.jobPosts.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Job Posts</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {addons.jobPosts.map((addon) => (
                <Card key={addon.id} className={addon.isPopular ? 'ring-2 ring-blue-500' : ''}>
                  {addon.badgeText && (
                    <Badge 
                      className="absolute -top-2 -right-2 z-10"
                      variant={addon.badgeText === 'Popular' ? 'default' : 'secondary'}
                    >
                      {addon.badgeText}
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <CardDescription>{addon.shortDescription}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-green-600">
                      ${addon.price}
                      <span className="text-sm font-normal text-gray-500 ml-1">one-time</span>
                    </div>
                    
                    <ul className="space-y-2 text-sm">
                      {addon.featuresIncluded.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handlePurchase(addon)}
                      disabled={purchasing === addon.id}
                      className="w-full"
                      variant="outline"
                    >
                      {purchasing === addon.id ? 'Processing...' : `Purchase for $${addon.price}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pricing Note */}
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>All purchases are one-time payments. No recurring charges.</p>
        <p>Secure payment processing powered by Stripe.</p>
      </div>
    </div>
  );
}
