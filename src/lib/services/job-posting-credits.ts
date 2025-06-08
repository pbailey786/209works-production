import { prisma } from '@/lib/database/prisma';

export type CreditType = 'job_post' | 'featured_post' | 'social_graphic';

export interface UserCredits {
  jobPost: number;
  featuredPost: number;
  socialGraphic: number;
}

export class JobPostingCreditsService {
  /**
   * Get available credits for a user
   */
  static async getUserCredits(userId: string): Promise<UserCredits> {
    const credits = await prisma.jobPostingCredit.groupBy({
      by: ['type'],
      where: {
        userId,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      _count: {
        id: true
      }
    });

    const creditMap: UserCredits = {
      jobPost: 0,
      featuredPost: 0,
      socialGraphic: 0,
    };

    credits.forEach(credit => {
      switch (credit.type) {
        case 'job_post':
          creditMap.jobPost = credit._count.id;
          break;
        case 'featured_post':
          creditMap.featuredPost = credit._count.id;
          break;
        case 'social_graphic':
          creditMap.socialGraphic = credit._count.id;
          break;
      }
    });

    return creditMap;
  }

  /**
   * Check if user has enough credits of a specific type
   */
  static async hasCredits(userId: string, type: CreditType, count: number = 1): Promise<boolean> {
    const availableCredits = await prisma.jobPostingCredit.count({
      where: {
        userId,
        type,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    return availableCredits >= count;
  }

  /**
   * Use credits for a job posting
   */
  static async useCredits(
    userId: string, 
    jobId: string, 
    creditsToUse: Partial<Record<CreditType, number>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Check if user has enough credits
        for (const [type, count] of Object.entries(creditsToUse)) {
          if (count && count > 0) {
            const availableCredits = await tx.jobPostingCredit.count({
              where: {
                userId,
                type: type as CreditType,
                isUsed: false,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              }
            });

            if (availableCredits < count) {
              return {
                success: false,
                error: `Insufficient ${type.replace('_', ' ')} credits. Available: ${availableCredits}, Required: ${count}`
              };
            }
          }
        }

        // Use the credits (mark oldest first)
        for (const [type, count] of Object.entries(creditsToUse)) {
          if (count && count > 0) {
            const creditsToMark = await tx.jobPostingCredit.findMany({
              where: {
                userId,
                type: type as CreditType,
                isUsed: false,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              },
              orderBy: [
                { expiresAt: 'asc' }, // Use expiring credits first
                { createdAt: 'asc' }  // Then oldest credits
              ],
              take: count
            });

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
          }
        }

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
   * Check if user can post a job (has job_post credits)
   */
  static async canPostJob(userId: string): Promise<boolean> {
    return await this.hasCredits(userId, 'job_post', 1);
  }

  /**
   * Use a job posting credit
   */
  static async useJobPostCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, { job_post: 1 });
  }

  /**
   * Add featured post to a job (use featured_post credit)
   */
  static async useFeaturedPostCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, { featured_post: 1 });
  }

  /**
   * Add social graphic to a job (use social_graphic credit)
   */
  static async useSocialGraphicCredit(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    return await this.useCredits(userId, jobId, { social_graphic: 1 });
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
