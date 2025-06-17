import {
  PricingTier,
  BillingInterval,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { PRICING_CONFIG } from './subscription';

export interface BillingData {
  userId: string;
  tier: PricingTier;
  billingCycle: BillingInterval;
  paymentMethodId?: string;
  prorationAmount?: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'paid' | 'failed' | 'refunded';
  dueDate: Date;
  paidAt?: Date;
}

export class BillingService {
  /**
   * Calculate pricing for a tier and billing cycle
   */
  static calculatePrice(
    tier: PricingTier,
    billingCycle: BillingInterval
  ): number {
    const config = PRICING_CONFIG[tier];

    switch (billingCycle) {
      case 'yearly':
        return config.yearlyPrice;
      case 'monthly':
        return config.price;
      case 'one_time':
        return config.price;
      default:
        return config.price;
    }
  }

  /**
   * Calculate proration when upgrading/downgrading mid-cycle
   */
  static calculateProration(
    currentTier: PricingTier,
    newTier: PricingTier,
    billingCycle: BillingInterval,
    daysRemaining: number
  ): number {
    const currentPrice = this.calculatePrice(currentTier, billingCycle);
    const newPrice = this.calculatePrice(newTier, billingCycle);

    const daysInCycle = billingCycle === 'yearly' ? 365 : 30;
    const dailyCurrentRate = currentPrice / daysInCycle;
    const dailyNewRate = newPrice / daysInCycle;

    // Credit for unused time on current plan
    const credit = dailyCurrentRate * daysRemaining;

    // Charge for remaining time on new plan
    const charge = dailyNewRate * daysRemaining;

    return charge - credit;
  }

  /**
   * Create subscription with billing
   */
  static async createSubscriptionWithBilling(data: BillingData) {
    const price = this.calculatePrice(data.tier, data.billingCycle);

    try {
      // Get user email for subscription
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: data.userId,
          email: user.email,
          tier: data.tier,
          price,
          billingCycle: data.billingCycle,
          status: 'trial', // Start with trial
          startDate: new Date(),
          endDate: null,
        },
      });

      // In a real implementation, you would integrate with Stripe/PayPal here
      // For now, we'll simulate the billing process

      return {
        subscription,
        paymentIntent: {
          id: `pi_${Date.now()}`,
          amount: price * 100, // Convert to cents
          currency: 'usd',
          status: 'succeeded',
        },
      };
    } catch (error) {
      console.error('Failed to create subscription with billing:', error);
      throw new Error('Failed to process subscription');
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  static async changeSubscriptionTier(
    subscriptionId: string,
    newTier: PricingTier,
    newBillingCycle?: BillingInterval
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const billingCycle = newBillingCycle || subscription.billingCycle;
    const newPrice = this.calculatePrice(newTier, billingCycle);

    // Calculate proration if changing mid-cycle
    const now = new Date();
    const nextBillingDate = new Date(subscription.startDate || new Date());
    nextBillingDate.setMonth(
      nextBillingDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1)
    );

    const daysRemaining = Math.ceil(
      (nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prorationAmount = this.calculateProration(
      subscription.tier,
      newTier,
      billingCycle,
      daysRemaining
    );

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        tier: newTier,
        price: newPrice,
        billingCycle,
        updatedAt: new Date(),
      },
    });

    return {
      subscription: updatedSubscription,
      prorationAmount,
      effectiveDate: now,
    };
  }

  /**
   * Process subscription renewal
   */
  static async processRenewal(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    try {
      // In a real implementation, charge the payment method here
      // For now, we'll simulate successful payment

      const nextBillingDate = new Date();
      if (subscription.billingCycle === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'active',
          startDate: new Date(),
          endDate: nextBillingDate,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        nextBillingDate,
        amount: subscription.price,
      };
    } catch (error) {
      // Mark subscription as past due
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'past_due',
          updatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediate = false) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const endDate = immediate ? new Date() : subscription.endDate;

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        endDate,
        updatedAt: new Date(),
      },
    });

    return {
      subscription,
      endDate,
      immediate,
    };
  }

  /**
   * Get billing history for a user
   */
  static async getBillingHistory(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // In a real implementation, you would also fetch invoice data
    // For now, we'll generate mock invoice data based on subscriptions
    const invoices = subscriptions.map((sub, index) => ({
      id: `inv_${sub.id.slice(-8)}`,
      subscriptionId: sub.id,
      userId: sub.userId,
      items: [
        {
          description: `${PRICING_CONFIG[sub.tier].name} Plan - ${sub.billingCycle}`,
          amount: sub.price,
          quantity: 1,
          total: sub.price,
        },
      ],
      subtotal: sub.price,
      tax: Number(sub.price) * 0.08, // 8% tax
      total: Number(sub.price) * 1.08,
      status: sub.status === 'active' ? 'paid' : 'draft',
      dueDate: sub.endDate || new Date(),
      paidAt: sub.status === 'active' ? sub.startDate : undefined,
    }));

    return {
      subscriptions,
      invoices,
    };
  }

  /**
   * Get subscription metrics for admin dashboard
   */
  static async getSubscriptionMetrics() {
    const metrics = await prisma.subscription.groupBy({
      by: ['tier', 'status'],
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
    });

    const totalRevenue = await prisma.subscription.aggregate({
      where: {
        status: 'active',
      },
      _sum: {
        price: true,
      },
    });

    const churnRate = await this.calculateChurnRate();

    return {
      metrics,
      totalMonthlyRevenue: totalRevenue._sum.price || 0,
      churnRate,
    };
  }

  /**
   * Calculate churn rate
   */
  private static async calculateChurnRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [cancelledCount, totalCount] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: 'cancelled',
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;
  }

  /**
   * Apply discount code (simplified)
   */
  static applyDiscount(amount: number, discountCode: string): number {
    const discounts: Record<string, number> = {
      WELCOME10: 0.1, // 10% off
      ANNUAL20: 0.2, // 20% off for annual plans
      STARTUP50: 0.5, // 50% off for startups
    };

    const discount = discounts[discountCode.toUpperCase()];
    return discount ? amount * (1 - discount) : amount;
  }
}

export default BillingService;
