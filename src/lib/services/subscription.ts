import {
  PricingTier,
  SubscriptionStatus,
  BillingInterval,
} from '@prisma/client';
import { prisma } from '@/lib/database/prisma';

// Updated pricing configuration with 209 Works pricing
export const PRICING_CONFIG = {
  starter: {
    name: 'Starter',
    price: 50,
    yearlyPrice: 50 * 12 * 0.85, // 15% discount for yearly
    yearlyDiscount: 15,
    features: {
      jobListings: 1,
      listingDuration: 30, // days
      aiMatching: false,
      prioritySupport: false,
      analytics: 'basic',
      teamMembers: 1,
      apiAccess: false,
    },
  },
  basic: {
    name: 'Basic',
    price: 29,
    yearlyPrice: 29 * 12 * 0.9, // 10% discount
    features: {
      jobListings: 3,
      listingDuration: 30, // days
      aiMatching: false,
      prioritySupport: false,
      analytics: 'basic',
      teamMembers: 1,
      apiAccess: false,
    },
  },
  essential: {
    name: 'Essential',
    price: 39,
    yearlyPrice: 39 * 12 * 0.9, // 10% discount
    features: {
      jobListings: 5,
      listingDuration: 30, // days
      aiMatching: false,
      prioritySupport: false,
      analytics: 'basic',
      teamMembers: 2,
      apiAccess: false,
    },
  },
  professional: {
    name: 'Professional',
    price: 99,
    yearlyPrice: 99 * 12 * 0.85, // 15% discount
    yearlyDiscount: 15,
    features: {
      jobListings: 3,
      listingDuration: 30, // days - standardized to 30 days
      aiMatching: true,
      prioritySupport: true,
      analytics: 'advanced',
      teamMembers: 5,
      apiAccess: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 200, // updated to match 209 Works pricing
    yearlyPrice: 200 * 12 * 0.8, // 20% discount
    yearlyDiscount: 20,
    features: {
      jobListings: 10,
      listingDuration: 30, // days - standardized to 30 days
      aiMatching: true,
      prioritySupport: true,
      analytics: 'enterprise',
      teamMembers: -1, // unlimited
      apiAccess: true,
      whiteLabel: false,
      customIntegrations: false,
    },
  },
  premium: {
    name: 'Premium (Job Seekers)',
    price: 19,
    yearlyPrice: 19 * 12 * 0.9, // 10% discount
    features: {
      profileVisibility: true,
      priorityApplications: true,
      advancedSearch: true,
      resumeReviews: 4, // per year
      coverLetterTemplates: true,
      applicationTracking: 'unlimited',
    },
  },
} as const;

export interface SubscriptionFeatures {
  // Employer features
  jobListings?: number; // -1 for unlimited
  listingDuration?: number; // days
  aiMatching?: boolean;
  prioritySupport?: boolean;
  analytics?: 'basic' | 'advanced' | 'enterprise';
  teamMembers?: number; // -1 for unlimited
  apiAccess?: boolean;
  whiteLabel?: boolean;
  customIntegrations?: boolean;

  // Job seeker features
  profileVisibility?: boolean;
  priorityApplications?: boolean;
  advancedSearch?: boolean;
  resumeReviews?: number;
  coverLetterTemplates?: boolean;
  applicationTracking?: 'limited' | 'unlimited';
}

export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get features available for a pricing tier
   */
  static getFeatures(tier: PricingTier): SubscriptionFeatures {
    return PRICING_CONFIG[tier].features;
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(
    userId: string,
    feature: keyof SubscriptionFeatures
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      // Free tier access - very limited
      const freeFeatures: SubscriptionFeatures = {
        jobListings: 1,
        listingDuration: 14,
        aiMatching: false,
        prioritySupport: false,
        analytics: 'basic',
        teamMembers: 1,
        profileVisibility: false,
        priorityApplications: false,
        advancedSearch: false,
        applicationTracking: 'limited',
      };
      return !!freeFeatures[feature];
    }

    const features = this.getFeatures(subscription.tier);
    return !!features[feature];
  }

  /**
   * Get feature limit for a user
   */
  static async getFeatureLimit(
    userId: string,
    feature: keyof SubscriptionFeatures
  ): Promise<number> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      // Free tier limits
      const freeLimits: Record<string, number> = {
        jobListings: 1,
        listingDuration: 14,
        teamMembers: 1,
        resumeReviews: 0,
      };
      return freeLimits[feature] || 0;
    }

    const features = this.getFeatures(subscription.tier);
    const value = features[feature];

    if (typeof value === 'number') {
      return value;
    }

    return 0;
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(data: {
    userId: string;
    tier: PricingTier;
    billingCycle: BillingInterval;
    startDate?: Date;
  }) {
    const config = PRICING_CONFIG[data.tier];
    const price =
      data.billingCycle === 'yearly' ? config.yearlyPrice : config.price;

    // Get user email for subscription
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.subscription.create({
      data: {
        userId: data.userId,
        email: user.email,
        tier: data.tier,
        price,
        billingCycle: data.billingCycle,
        status: 'trial', // Start with trial
        startDate: data.startDate || new Date(),
        endDate: null, // Set when subscription ends
      },
    });
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    endDate?: Date
  ) {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status,
        endDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string) {
    return await this.updateSubscriptionStatus(
      subscriptionId,
      'cancelled',
      new Date()
    );
  }

  /**
   * Check if user can post more jobs
   */
  static async canPostJob(userId: string): Promise<boolean> {
    const limit = await this.getFeatureLimit(userId, 'jobListings');

    if (limit === -1) return true; // Unlimited

    const activeJobs = await prisma.job.count({
      where: {
        companyRef: {
          users: {
            some: { id: userId },
          },
        },
        status: 'active',
      },
    });

    return activeJobs < limit;
  }

  /**
   * Get subscription analytics for admin
   */
  static async getSubscriptionAnalytics() {
    const analytics = await prisma.subscription.groupBy({
      by: ['tier', 'status'],
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
    });

    return analytics;
  }

  /**
   * Get pricing for display
   */
  static getPricingDisplay() {
    return Object.entries(PRICING_CONFIG).map(([tier, config]) => ({
      tier: tier as PricingTier,
      name: config.name,
      monthlyPrice: config.price,
      yearlyPrice: config.yearlyPrice,
      features: config.features,
    }));
  }
}

export default SubscriptionService;
