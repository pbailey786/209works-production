import { prisma } from '@/lib/database/prisma';
import { JobPostingCreditsService } from './job-posting-credits';

export interface CreditUsageAlert {
  type: 'low_credits' | 'credits_expired' | 'credits_expiring' | 'no_credits';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  creditsRemaining: number;
  expirationDate?: Date;
}

export class CreditNotificationService {
  /**
   * Check credit status and generate alerts for a user
   */
  static async checkCreditStatus(userId: string): Promise<CreditUsageAlert[]> {
    const alerts: CreditUsageAlert[] = [];
    
    try {
      // Get current credit status
      const credits = await JobPostingCreditsService.getUserCredits(userId);
      const creditsRemaining = credits.universal;

      // Get credits with expiration info
      const creditDetails = await prisma.jobPostingCredit.findMany({
        where: {
          userId,
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: {
          expiresAt: 'asc'
        }
      });

      // Check for no credits
      if (creditsRemaining === 0) {
        alerts.push({
          type: 'no_credits',
          severity: 'critical',
          message: 'You have no credits remaining. Purchase credits to continue posting jobs.',
          actionRequired: true,
          actionUrl: '/employers/pricing',
          creditsRemaining: 0
        });
        return alerts;
      }

      // Check for low credits (less than 3)
      if (creditsRemaining <= 3) {
        alerts.push({
          type: 'low_credits',
          severity: creditsRemaining <= 1 ? 'critical' : 'warning',
          message: `You have ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining. Consider purchasing more to avoid interruption.`,
          actionRequired: creditsRemaining <= 1,
          actionUrl: '/employers/pricing',
          creditsRemaining
        });
      }

      // Check for expiring credits (within 7 days)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const expiringCredits = creditDetails.filter(credit => 
        credit.expiresAt && credit.expiresAt <= sevenDaysFromNow
      );

      if (expiringCredits.length > 0) {
        const earliestExpiration = expiringCredits[0].expiresAt;
        const daysUntilExpiration = earliestExpiration ? 
          Math.ceil((earliestExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

        alerts.push({
          type: 'credits_expiring',
          severity: daysUntilExpiration <= 2 ? 'critical' : 'warning',
          message: `${expiringCredits.length} credit${expiringCredits.length === 1 ? '' : 's'} will expire in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}.`,
          actionRequired: daysUntilExpiration <= 2,
          creditsRemaining,
          expirationDate: earliestExpiration || undefined
        });
      }

      // Check for expired credits (cleanup notification)
      const expiredCredits = await prisma.jobPostingCredit.count({
        where: {
          userId,
          isUsed: false,
          expiresAt: { lt: new Date() }
        }
      });

      if (expiredCredits > 0) {
        alerts.push({
          type: 'credits_expired',
          severity: 'info',
          message: `${expiredCredits} expired credit${expiredCredits === 1 ? '' : 's'} have been removed from your account.`,
          actionRequired: false,
          creditsRemaining
        });

        // Clean up expired credits
        await this.cleanupExpiredCredits(userId);
      }

      return alerts;

    } catch (error) {
      console.error('Error checking credit status:', error);
      return [];
    }
  }

  /**
   * Get credit usage statistics for a user
   */
  static async getCreditUsageStats(userId: string): Promise<{
    totalPurchased: number;
    totalUsed: number;
    totalRemaining: number;
    usageThisMonth: number;
    averageMonthlyUsage: number;
    projectedRunOutDate?: Date;
  }> {
    try {
      const [totalPurchased, totalUsed, totalRemaining, usageThisMonth] = await Promise.all([
        // Total credits ever purchased
        prisma.jobPostingCredit.count({
          where: { userId }
        }),

        // Total credits used
        prisma.jobPostingCredit.count({
          where: { userId, isUsed: true }
        }),

        // Current remaining credits
        prisma.jobPostingCredit.count({
          where: {
            userId,
            isUsed: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }),

        // Usage this month
        prisma.jobPostingCredit.count({
          where: {
            userId,
            isUsed: true,
            usedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      // Calculate average monthly usage (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const usageLastSixMonths = await prisma.jobPostingCredit.count({
        where: {
          userId,
          isUsed: true,
          usedAt: { gte: sixMonthsAgo }
        }
      });

      const averageMonthlyUsage = usageLastSixMonths / 6;

      // Project when credits will run out
      let projectedRunOutDate: Date | undefined;
      if (averageMonthlyUsage > 0 && totalRemaining > 0) {
        const monthsRemaining = totalRemaining / averageMonthlyUsage;
        projectedRunOutDate = new Date();
        projectedRunOutDate.setMonth(projectedRunOutDate.getMonth() + monthsRemaining);
      }

      return {
        totalPurchased,
        totalUsed,
        totalRemaining,
        usageThisMonth,
        averageMonthlyUsage: Math.round(averageMonthlyUsage * 100) / 100,
        projectedRunOutDate
      };

    } catch (error) {
      console.error('Error getting credit usage stats:', error);
      return {
        totalPurchased: 0,
        totalUsed: 0,
        totalRemaining: 0,
        usageThisMonth: 0,
        averageMonthlyUsage: 0
      };
    }
  }

  /**
   * Clean up expired credits
   */
  static async cleanupExpiredCredits(userId: string): Promise<number> {
    try {
      const result = await prisma.jobPostingCredit.deleteMany({
        where: {
          userId,
          isUsed: false,
          expiresAt: { lt: new Date() }
        }
      });

      console.log(`Cleaned up ${result.count} expired credits for user ${userId}`);
      return result.count;

    } catch (error) {
      console.error('Error cleaning up expired credits:', error);
      return 0;
    }
  }

  /**
   * Send credit notification email
   */
  static async sendCreditNotification(
    userId: string, 
    alert: CreditUsageAlert
  ): Promise<boolean> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        console.error('User not found for credit notification:', userId);
        return false;
      }

      // Here you would integrate with your email service
      // For now, just log the notification
      console.log(`Credit notification for ${user.email}:`, {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        creditsRemaining: alert.creditsRemaining
      });

      return true;

    } catch (error) {
      console.error('Error sending credit notification:', error);
      return false;
    }
  }

  /**
   * Check if user should receive credit notifications
   */
  static async shouldNotifyUser(userId: string, alertType: string): Promise<boolean> {
    try {
      // Check if user has been notified recently for this alert type
      const recentNotification = await prisma.userNotification.findFirst({
        where: {
          userId,
          type: alertType,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return !recentNotification;

    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Record that a notification was sent
   */
  static async recordNotification(
    userId: string, 
    alertType: string, 
    message: string
  ): Promise<void> {
    try {
      await prisma.userNotification.create({
        data: {
          userId,
          type: alertType,
          title: 'Credit Alert',
          message,
          read: false
        }
      });

    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }
}
