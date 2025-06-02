'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { PricingTier, BillingInterval } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  originalPrice?: string | null;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  href?: string;
  featured?: boolean;
  badge?: string | null;
  tier: PricingTier;
  billingInterval: BillingInterval;
  priceId?: string;
  disabled?: boolean;
}

// Simple toast utility as replacement for missing import
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    // In a real app, this would show a toast notification
  },
  error: (message: string) => {
    console.error('Error:', message);
    // In a real app, this would show an error toast
  }
};

export default function PricingCard({
  name,
  price,
  period,
  originalPrice,
  description,
  features,
  limitations = [],
  cta,
  href,
  featured = false,
  badge,
  tier,
  billingInterval,
  priceId,
  disabled = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/signin');
      return;
    }

    if (!priceId) {
      if (href) {
        router.push(href);
      }
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          tier,
          billingInterval,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative flex flex-col ${featured ? 'border-primary shadow-lg scale-105' : ''} ${disabled ? 'opacity-50' : ''}`}>
      {badge && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          {badge}
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{price}</span>
            {period && <span className="text-muted-foreground">/{period}</span>}
          </div>
          {originalPrice && (
            <p className="text-sm text-muted-foreground mt-1">
              {originalPrice}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
          
          {limitations.map((limitation, index) => (
            <div key={index} className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{limitation}</span>
            </div>
          ))}
        </div>

        <Button
          className={`mt-6 w-full ${featured ? 'bg-primary hover:bg-primary/90' : ''}`}
          onClick={handleSubscribe}
          disabled={loading || disabled}
          variant={featured ? 'default' : 'outline'}
        >
          {loading ? 'Loading...' : cta}
        </Button>
      </CardContent>
    </Card>
  );
} 