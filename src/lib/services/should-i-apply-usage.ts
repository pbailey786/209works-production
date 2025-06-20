import { prisma } from '@/lib/database/prisma';

// Usage limits for different user types
export const SHOULD_I_APPLY_LIMITS = {
  free: {
    dailyLimit: 3,
    monthlyLimit: 50,
    features: ['basic_analysis', 'skill_matching'],
  },
  basic: {
    dailyLimit: 10,
    monthlyLimit: 200,
    features: ['basic_analysis', 'skill_matching', 'career_tips'],
  },
  essential: {
    dailyLimit: 25,
    monthlyLimit: 500,
    features: ['basic_analysis', 'skill_matching', 'career_tips'],
  },
  professional: {
    dailyLimit: -1, // unlimited
    monthlyLimit: -1, // unlimited
    features: [
      'basic_analysis',
      'skill_matching',
      'career_tips',
      'detailed_insights',
      'application_tips',
    ],
  },
  premium: {
    dailyLimit: -1, // unlimited
    monthlyLimit: -1, // unlimited
    features: [
      'basic_analysis',
      'skill_matching',
      'career_tips',
      'detailed_insights',
      'application_tips',
    ],
  },
  enterprise: {
    dailyLimit: -1, // unlimited
    monthlyLimit: -1, // unlimited
    features: [
      'basic_analysis',
      'skill_matching',
      'career_tips',
      'detailed_insights',
      'application_tips',
    ],
  },
  starter: {
    dailyLimit: 5,
    monthlyLimit: 100,
    features: ['basic_analysis', 'skill_matching'],
  },
};

export interface UsageRecord {
  id: string;
  userId: string;
  jobId: string;
  usedAt: Date;
  userTier: string;
  analysisType: string;
}

export class ShouldIApplyUsageService {
  /**
   * Check if user can use the "Should I Apply?" feature
   */
  static async canUserAnalyze(userId: string): Promise<{
    canUse: boolean;
    reason?: string;
    usageToday: number;
    usageThisMonth: number;
    dailyLimit: number;
    monthlyLimit: number;
    userTier: string;
  }> {
    // Get user subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Determine user tier
    const userTier = user.subscriptions?.tier || 'free';
    const limits =
      SHOULD_I_APPLY_LIMITS[userTier as keyof typeof SHOULD_I_APPLY_LIMITS] ||
      SHOULD_I_APPLY_LIMITS.free;

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usageToday = await prisma.shouldIApplyUsage.count({
      where: {
        userId,
        usedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get this month's usage
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const usageThisMonth = await prisma.shouldIApplyUsage.count({
      where: {
        userId,
        usedAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    // Check limits
    let canUse = true;
    let reason = '';

    if (limits.dailyLimit > 0 && usageToday >= limits.dailyLimit) {
      canUse = false;
      reason = `Daily limit of ${limits.dailyLimit} analyses reached. Upgrade for unlimited access.`;
    } else if (
      limits.monthlyLimit > 0 &&
      usageThisMonth >= limits.monthlyLimit
    ) {
      canUse = false;
      reason = `Monthly limit of ${limits.monthlyLimit} analyses reached. Upgrade for unlimited access.`;
    }

    return {
      canUse,
      reason,
      usageToday,
      usageThisMonth,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      userTier,
    };
  }

  /**
   * Record usage of the "Should I Apply?" feature
   */
  static async recordUsage(
    userId: string,
    jobId: string,
    analysisType: string = 'basic'
  ): Promise<UsageRecord> {
    // Get user tier
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    const userTier = user?.subscriptions?.tier || 'free';

    const usage = await prisma.shouldIApplyUsage.create({
      data: {
        userId,
        jobId,
        userTier,
        analysisType,
        usedAt: new Date(),
      },
    });

    return usage;
  }

  /**
   * Get user's usage statistics
   */
  static async getUserUsageStats(userId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
    userTier: string;
    limits: typeof SHOULD_I_APPLY_LIMITS.free;
  }> {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    const userTier = user?.subscriptions?.tier || 'free';
    const limits =
      SHOULD_I_APPLY_LIMITS[userTier as keyof typeof SHOULD_I_APPLY_LIMITS] ||
      SHOULD_I_APPLY_LIMITS.free;

    const now = new Date();

    // Today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // This month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayCount, weekCount, monthCount, allTimeCount] = await Promise.all(
      [
        prisma.shouldIApplyUsage.count({
          where: { userId, usedAt: { gte: today, lt: tomorrow } },
        }),
        prisma.shouldIApplyUsage.count({
          where: { userId, usedAt: { gte: startOfWeek } },
        }),
        prisma.shouldIApplyUsage.count({
          where: { userId, usedAt: { gte: startOfMonth } },
        }),
        prisma.shouldIApplyUsage.count({
          where: { userId },
        }),
      ]
    );

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      allTime: allTimeCount,
      userTier,
      limits,
    };
  }

  /**
   * Get recent analyses for a user
   */
  static async getRecentAnalyses(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const analyses = await prisma.shouldIApplyUsage.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
      },
    });

    return analyses;
  }

  /**
   * Check if user has premium features
   */
  static async hasPremiumFeatures(userId: string): Promise<boolean> {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    const userTier = user?.subscriptions?.tier || 'free';
    return (
      userTier === 'professional' ||
      userTier === 'premium' ||
      userTier === 'enterprise'
    );
  }

  /**
   * Get upgrade suggestions based on usage
   */
  static async getUpgradeSuggestions(userId: string): Promise<{
    shouldSuggestUpgrade: boolean;
    reason: string;
    suggestedTier: string;
    benefits: string[];
  }> {
    const stats = await this.getUserUsageStats(userId);

    if (
      stats.userTier === 'professional' ||
      stats.userTier === 'premium' ||
      stats.userTier === 'enterprise'
    ) {
      return {
        shouldSuggestUpgrade: false,
        reason: 'User already has premium access',
        suggestedTier: stats.userTier,
        benefits: [],
      };
    }

    // Check if user is hitting limits frequently
    const isHittingDailyLimit =
      stats.today >= stats.limits.dailyLimit && stats.limits.dailyLimit > 0;
    const isHeavyUser =
      stats.thisMonth > stats.limits.monthlyLimit * 0.8 &&
      stats.limits.monthlyLimit > 0;

    if (isHittingDailyLimit || isHeavyUser) {
      return {
        shouldSuggestUpgrade: true,
        reason: isHittingDailyLimit
          ? 'Daily limit reached'
          : 'Heavy usage detected',
        suggestedTier: 'professional',
        benefits: [
          'Unlimited job analyses',
          'Detailed career insights',
          'Personalized application tips',
          'Priority support',
          'Advanced matching algorithm',
        ],
      };
    }

    return {
      shouldSuggestUpgrade: false,
      reason: 'Usage within limits',
      suggestedTier: stats.userTier,
      benefits: [],
    };
  }
}
