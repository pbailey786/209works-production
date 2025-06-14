import { prisma } from '@/lib/database/prisma';

export type CreditType = 'universal'; // Simplified to single credit type

export interface UserCredits {
  universal: number; // Single unified credit pool
  total: number; // Total available credits (same as universal)
}

export class JobPostingCreditsService {
  /**
   * Get available credits for a user (unified system - all credits are universal)
   */
  static async getUserCredits(userId: string): Promise<UserCredits> {
    // Get all available credits (all should be universal type now)
    const availableCredits = await prisma.jobPostingCredit.findMany({
      where: {
        userId,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // In the unified system, all credits are universal and interchangeable
    const totalCredits = availableCredits.length;

    return {
      universal: totalCredits,
      total: totalCredits, // Same as universal in unified system
    };
  }

  /**
   * Check if user has enough credits (unified system - type parameter ignored)
   */
  static async hasCredits(userId: string, type: CreditType | string = 'universal', count: number = 1): Promise<boolean> {
    // In the unified system, all credits are universal and can be used for any purpose
    const userCredits = await this.getUserCredits(userId);
    return userCredits.total >= count;
  }

  /**
   * Use credits (unified system - any credit can be used for any purpose)
   */
  static async useCredits(
    userId: string,
    jobId: string,
    creditsToUse: Partial<Record<string, number>> | number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Normalize input - if it's a number, treat it as universal credits needed
      const creditsNeeded = typeof creditsToUse === 'number' ? creditsToUse :
        Object.values(creditsToUse).reduce((sum: number, count) => sum + (count || 0), 0);

      if (creditsNeeded <= 0) {
        return { success: true };
      }

      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Get all available credits (any type can be used)
        const availableCredits = await tx.jobPostingCredit.findMany({
          where: {
            userId,
            isUsed: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          orderBy: [
            { expiresAt: 'asc' }, // Use expiring credits first
            { createdAt: 'asc' }  // Then oldest credits
          ]
        });

        if (availableCredits.length < creditsNeeded) {
          return {
            success: false,
            error: `Insufficient credits. Available: ${availableCredits.length}, Required: ${creditsNeeded}`
          };
        }

        // Use the required number of credits (oldest first)
        const creditsToMark = availableCredits.slice(0, creditsNeeded);

        // Mark credits as used
        await tx.jobPostingCredit.updateMany({
          where: {
            id: { in: creditsToMark.map(c => c.id) }
          },
          data: {
            isUsed: true,
            usedAt: new Date(),
            usedForJobId: jobId
          }
        });

        return { success: true };
      });
    } catch (error) {
      console.error('Error using credits:', error);
      return {
        success: false,
        error: 'Failed to use credits. Please try again.'
      };
    }
  }

  /**
   * Get credit usage history for a user
   */
  static async getCreditHistory(userId: string, limit: number = 50) {
    return await prisma.jobPostingCredit.findMany({
      where: { userId },
      include: {
        purchase: {
          select: {
            tier: true,
            purchasedAt: true,
            totalAmount: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get purchase history for a user
   */
  static async getPurchaseHistory(userId: string, limit: number = 20) {
    return await prisma.jobPostingPurchase.findMany({
      where: { userId },
      include: {
        credits: {
          select: {
            type: true,
            isUsed: true,
            usedAt: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Check if user can post a job (has any credits)
   */
  static async canPostJob(userId: string): Promise<boolean> {
    return await this.hasCredits(userId, 'universal', 1);
  }

  /**
   * Use a credit for any purpose (unified system)
   */
  static async useJobPostCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, 1);
  }

  /**
   * Use a credit for featured post (unified system)
   */
  static async useFeaturedPostCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, 1);
  }

  /**
   * Use a credit for social graphic (unified system)
   */
  static async useSocialGraphicCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, 1);
  }

  /**
   * Use multiple credits for any combination of features
   */
  static async useMultipleCredits(userId: string, jobId: string, count: number): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, count);
  }

  /**
   * Get credits that are expiring soon (within 7 days)
   * Note: Credits expire after 30 days to prevent month-to-month rollover
   */
  static async getExpiringSoonCredits(userId: string) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await prisma.jobPostingCredit.findMany({
      where: {
        userId,
        isUsed: false,
        expiresAt: {
          lte: sevenDaysFromNow,
          gt: new Date()
        }
      },
      include: {
        purchase: {
          select: {
            tier: true,
            purchasedAt: true
          }
        }
      },
      orderBy: { expiresAt: 'asc' }
    });
  }
}
