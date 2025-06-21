import { prisma } from '@/lib/database/prisma';
import { stripe } from '@/components/ui/card';
import { EmailQueue } from './email-queue';


export interface PaymentRetryOptions {
  maxRetryAttempts: number;
  retryDelayHours: number[];
  gracePeriodDays: number;
}

export class PaymentRetryService {
  private static readonly DEFAULT_OPTIONS: PaymentRetryOptions = {
    maxRetryAttempts: 4,
    retryDelayHours: [24, 72, 168, 240], // 1 day, 3 days, 7 days, 10 days
    gracePeriodDays: 14,
  };

  /**
   * Process all failed payments that are due for retry
   */
  static async processRetries(options: Partial<PaymentRetryOptions> = {}) {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const now = new Date();

    // Get all payment failures that are due for retry
    const failedPayments = await prisma.paymentFailure.findMany({
      where: {
        resolved: false,
        attemptCount: {
          lt: config.maxRetryAttempts,
        },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: now } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            stripeCustomerId: true,
          },
        },
        subscription: {
          select: {
            id: true,
            stripeSubscriptionId: true,
            tier: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`[Payment Retry] Processing ${failedPayments.length} failed payments`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      maxAttemptsReached: 0,
    };

    for (const failedPayment of failedPayments) {
      try {
        results.processed++;
        const result = await this.retryPayment(failedPayment, config);
        
        if (result.success) {
          results.successful++;
        } else if (result.maxAttemptsReached) {
          results.maxAttemptsReached++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`[Payment Retry] Error processing payment ${failedPayment.id}:`, error);
        results.failed++;
      }
    }

    console.log(`[Payment Retry] Results:`, results);
    return results;
  }

  /**
   * Retry a specific failed payment
   */
  private static async retryPayment(
    failedPayment: any & {
      user: { id: string; email: string; name: string | null; stripeCustomerId: string | null };
      subscription: { id: string; stripeSubscriptionId: string | null; tier: string; status: string } | null;
    },
    config: PaymentRetryOptions
  ) {
    const now = new Date();
    const nextAttempt = failedPayment.attemptCount + 1;

    console.log(`[Payment Retry] Attempting retry ${nextAttempt} for payment ${failedPayment.id}`);

    if (nextAttempt > config.maxRetryAttempts) {
      // Max attempts reached, handle permanent failure
      await this.handlePermanentFailure(failedPayment);
      return { success: false, maxAttemptsReached: true };
    }

    try {
      let retrySuccess = false;

      // Try to retry the specific payment based on type
      if (failedPayment.invoiceId) {
        retrySuccess = await this.retryInvoicePayment(failedPayment);
      } else if (failedPayment.paymentIntentId) {
        retrySuccess = await this.retryPaymentIntent(failedPayment);
      }

      if (retrySuccess) {
        // Mark as resolved
        await prisma.paymentFailure.update({
          where: { id: failedPayment.id },
          data: {
            resolved: true,
            resolvedAt: now,
            updatedAt: now,
          },
        });

        // Send success notification
        await this.sendRetrySuccessNotification(failedPayment);

        console.log(`[Payment Retry] Successfully retried payment ${failedPayment.id}`);
        return { success: true, maxAttemptsReached: false };
      } else {
        // Schedule next retry
        const nextRetryDelay = config.retryDelayHours[nextAttempt - 1] || config.retryDelayHours[config.retryDelayHours.length - 1];
        const nextRetryAt = new Date(now.getTime() + nextRetryDelay * 60 * 60 * 1000);

        await prisma.paymentFailure.update({
          where: { id: failedPayment.id },
          data: {
            attemptCount: nextAttempt,
            nextRetryAt,
            updatedAt: now,
          },
        });

        // Send retry notification if not the first retry
        if (nextAttempt > 1) {
          await this.sendRetryNotification(failedPayment, nextAttempt, nextRetryAt);
        }

        console.log(`[Payment Retry] Failed to retry payment ${failedPayment.id}, scheduled next retry for ${nextRetryAt}`);
        return { success: false, maxAttemptsReached: false };
      }
    } catch (error) {
      console.error(`[Payment Retry] Error retrying payment ${failedPayment.id}:`, error);
      
      // Update attempt count even on error
      const nextRetryDelay = config.retryDelayHours[nextAttempt - 1] || config.retryDelayHours[config.retryDelayHours.length - 1];
      const nextRetryAt = new Date(now.getTime() + nextRetryDelay * 60 * 60 * 1000);

      await prisma.paymentFailure.update({
        where: { id: failedPayment.id },
        data: {
          attemptCount: nextAttempt,
          nextRetryAt,
          reason: `${failedPayment.reason} | Retry error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          updatedAt: now,
        },
      });

      return { success: false, maxAttemptsReached: false };
    }
  }

  /**
   * Retry an invoice payment
   */
  private static async retryInvoicePayment(failedPayment: any & { user: any; subscription: any }): Promise<boolean> {
    if (!failedPayment.invoiceId) return false;

    try {
      // Get the invoice from Stripe
      const invoice = await stripe.invoices.retrieve(failedPayment.invoiceId);
      
      if (invoice.status === 'paid') {
        console.log(`[Payment Retry] Invoice ${failedPayment.invoiceId} is already paid`);
        return true;
      }

      // Attempt to pay the invoice
      const paidInvoice = await stripe.invoices.pay(failedPayment.invoiceId, {
        paid_out_of_band: false,
      });

      return paidInvoice.status === 'paid';
    } catch (error) {
      console.error(`[Payment Retry] Failed to retry invoice payment:`, error);
      return false;
    }
  }

  /**
   * Retry a payment intent
   */
  private static async retryPaymentIntent(failedPayment: any & { user: any; subscription: any }): Promise<boolean> {
    if (!failedPayment.paymentIntentId) return false;

    try {
      // Get the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(failedPayment.paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        console.log(`[Payment Retry] Payment intent ${failedPayment.paymentIntentId} already succeeded`);
        return true;
      }

      // For payment intents, we can't directly retry them
      // Instead, we might need to create a new payment intent or confirm the existing one
      // This depends on the specific failure reason and payment method availability
      console.log(`[Payment Retry] Payment intent retry not implemented for ${failedPayment.paymentIntentId}`);
      return false;
    } catch (error) {
      console.error(`[Payment Retry] Failed to retry payment intent:`, error);
      return false;
    }
  }

  /**
   * Handle permanent payment failure (max attempts reached)
   */
  private static async handlePermanentFailure(failedPayment: any & { user: any; subscription: any }) {
    const now = new Date();

    try {
      // Mark as resolved (permanently failed)
      await prisma.paymentFailure.update({
        where: { id: failedPayment.id },
        data: {
          resolved: true,
          resolvedAt: now,
          reason: `${failedPayment.reason} | Max retry attempts reached`,
          updatedAt: now,
        },
      });

      // Cancel or suspend the subscription
      if (failedPayment.subscription?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(failedPayment.subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

          // Update local subscription
          await prisma.subscription.update({
            where: { id: failedPayment.subscription.id },
            data: {
              status: 'cancelled',
              updatedAt: now,
            },
          });
        } catch (stripeError) {
          console.error(`[Payment Retry] Failed to cancel subscription:`, stripeError);
        }
      }

      // Send permanent failure notification
      await this.sendPermanentFailureNotification(failedPayment);

      console.log(`[Payment Retry] Handled permanent failure for payment ${failedPayment.id}`);
    } catch (error) {
      console.error(`[Payment Retry] Error handling permanent failure:`, error);
    }
  }

  /**
   * Send retry success notification
   */
  private static async sendRetrySuccessNotification(failedPayment: any & { user: any; subscription: any }) {
    try {
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: failedPayment.user.email,
        subject: '✅ Payment Successful - Service Restored',
        template: 'system-notification',
        data: {
          userName: failedPayment.user.name || 'Valued Customer',
          title: 'Payment Successful!',
          message: 'Great news! We successfully processed your payment and your service has been restored.',
          details: [
            `Amount: $${(failedPayment.amount / 100).toFixed(2)}`,
            'Your subscription is now active',
            'No further action required',
          ],
          ctaText: 'View Dashboard',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/dashboard`,
        },
        userId: failedPayment.userId,
        priority: 'normal',
        metadata: {
          paymentFailureId: failedPayment.id,
          originalAmount: failedPayment.amount,
        },
      });
    } catch (error) {
      console.error(`[Payment Retry] Failed to send success notification:`, error);
    }
  }

  /**
   * Send retry attempt notification
   */
  private static async sendRetryNotification(
    failedPayment: any & { user: any; subscription: any },
    attemptNumber: number,
    nextRetryAt: Date
  ) {
    try {
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: failedPayment.user.email,
        subject: `🔄 Payment Retry Attempt ${attemptNumber}`,
        template: 'system-notification',
        data: {
          userName: failedPayment.user.name || 'Valued Customer',
          title: 'Payment Retry in Progress',
          message: `We're still working to process your payment. This was attempt ${attemptNumber} and we'll try again soon.`,
          details: [
            `Amount: $${(failedPayment.amount / 100).toFixed(2)}`,
            `Next retry: ${nextRetryAt.toLocaleDateString()} at ${nextRetryAt.toLocaleTimeString()}`,
            'Your service remains active during the retry period',
            'You can update your payment method anytime',
          ],
          ctaText: 'Update Payment Method',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/settings/billing`,
        },
        userId: failedPayment.userId,
        priority: 'normal',
        metadata: {
          paymentFailureId: failedPayment.id,
          attemptNumber,
          nextRetryAt: nextRetryAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(`[Payment Retry] Failed to send retry notification:`, error);
    }
  }

  /**
   * Send permanent failure notification
   */
  private static async sendPermanentFailureNotification(failedPayment: any & { user: any; subscription: any }) {
    try {
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: failedPayment.user.email,
        subject: '❌ Payment Failed - Subscription Cancelled',
        template: 'system-notification',
        data: {
          userName: failedPayment.user.name || 'Valued Customer',
          title: 'Payment Failed - Action Required',
          message: 'We were unable to process your payment after multiple attempts. Your subscription has been cancelled to prevent further charges.',
          details: [
            `Amount: $${(failedPayment.amount / 100).toFixed(2)}`,
            'Your subscription is now cancelled',
            'You can reactivate anytime with a valid payment method',
            'No additional charges will be made',
          ],
          ctaText: 'Reactivate Subscription',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/settings/billing`,
        },
        userId: failedPayment.userId,
        priority: 'high',
        metadata: {
          paymentFailureId: failedPayment.id,
          finalAmount: failedPayment.amount,
        },
      });
    } catch (error) {
      console.error(`[Payment Retry] Failed to send permanent failure notification:`, error);
    }
  }

  /**
   * Get retry statistics for monitoring
   */
  static async getRetryStatistics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await prisma.paymentFailure.groupBy({
      by: ['resolved'],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        attemptCount: true,
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalPending = await prisma.paymentFailure.count({
      where: {
        resolved: false,
        nextRetryAt: {
          lte: now,
        },
      },
    });

    return {
      last30Days: stats,
      pendingRetries: totalPending,
      generatedAt: now,
    };
  }

  /**
   * Manual retry for a specific payment failure
   */
  static async manualRetry(paymentFailureId: string) {
    const failedPayment = await prisma.paymentFailure.findUnique({
      where: { id: paymentFailureId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            stripeCustomerId: true,
          },
        },
        subscription: {
          select: {
            id: true,
            stripeSubscriptionId: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!failedPayment) {
      throw new Error('Payment failure not found');
    }

    if (failedPayment.resolved) {
      throw new Error('Payment failure already resolved');
    }

    return this.retryPayment(failedPayment, this.DEFAULT_OPTIONS);
  }
}

export default PaymentRetryService;