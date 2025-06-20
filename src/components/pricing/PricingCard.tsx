import { useState } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Check, X } from '@/components/ui/card';
import { PricingTier, BillingInterval } from '@/components/ui/card';
import { useUser } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

'use client';

import {
  import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

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
  },
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
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!user) {
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
    <Card
      className={`relative flex flex-col ${featured ? 'scale-105 border-primary shadow-lg' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      {badge && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 transform bg-primary text-primary-foreground">
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
            <p className="mt-1 text-sm text-muted-foreground">
              {originalPrice}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}

          {limitations.map((limitation, index) => (
            <div key={index} className="flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span className="text-sm text-muted-foreground">
                {limitation}
              </span>
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
