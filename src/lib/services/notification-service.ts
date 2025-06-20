import { prisma } from '@/lib/database/prisma';
import { EmailHelpers } from '@/lib/email/email-helpers';

export type NotificationType = 
  | 'job_match' 
  | 'application_update' 
  | 'message_received' 
  | 'system_announcement' 
  | 'credit_alert' 
  | 'payment_reminder' 
  | 'security_alert' 
  | 'feature_update' 
  | 'marketing';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  category?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface BulkNotificationData {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  category?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Send a notification to a single user
   */
  static async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      // Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          priority: notificationData.priority || 'normal',
          category: notificationData.category,
          actionUrl: notificationData.actionUrl,
          expiresAt: notificationData.expiresAt,
        },
      });

      // Check user's notification preferences
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: notificationData.userId },
      });

      const user = await prisma.user.findUnique({
        where: { id: notificationData.userId },
        select: { email: true, name: true },
      });

      if (!user) {
        console.error('User not found for notification:', notificationData.userId);
        return false;
      }

      // Send email notification if enabled
      if (this.shouldSendEmail(notificationData.type, preferences)) {
        await this.sendEmailNotification(user, notificationData);
      }

      // TODO: Send push notification if enabled
      if (this.shouldSendPush(notificationData.type, preferences)) {
        await this.sendPushNotification(user, notificationData);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotification(bulkData: BulkNotificationData): Promise<number> {
    try {
      let successCount = 0;

      // Create notifications in batches
      const batchSize = 100;
      for (let i = 0; i < bulkData.userIds.length; i += batchSize) {
        const batch = bulkData.userIds.slice(i, i + batchSize);
        
        const notifications = batch.map(userId => ({
          userId,
          type: bulkData.type,
          title: bulkData.title,
          message: bulkData.message,
          data: bulkData.data,
          priority: bulkData.priority || 'normal',
          category: bulkData.category,
          actionUrl: bulkData.actionUrl,
          expiresAt: bulkData.expiresAt,
        }));

        await prisma.notification.createMany({
          data: notifications,
        });

        successCount += batch.length;
      }

      // Send email notifications for users who have them enabled
      await this.sendBulkEmailNotifications(bulkData);

      return successCount;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return 0;
    }
  }

  /**
   * Send job match notification
   */
  static async sendJobMatchNotification(
    userId: string, 
    jobTitle: string, 
    companyName: string, 
    jobId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'job_match',
      title: 'New Job Match Found!',
      message: `We found a job that matches your preferences: ${jobTitle} at ${companyName}`,
      data: {
        jobId,
        jobTitle,
        companyName,
      },
      priority: 'normal',
      actionUrl: `/jobs/${jobId}`,
    });
  }

  /**
   * Send application update notification
   */
  static async sendApplicationUpdateNotification(
    userId: string,
    jobTitle: string,
    status: string,
    applicationId: string
  ): Promise<boolean> {
    const statusMessages = {
      'viewed': 'Your application has been viewed',
      'shortlisted': 'Congratulations! You\'ve been shortlisted',
      'rejected': 'Application status updated',
      'interview_scheduled': 'Interview scheduled!',
    };

    return this.sendNotification({
      userId,
      type: 'application_update',
      title: 'Application Update',
      message: `${statusMessages[status as keyof typeof statusMessages] || 'Application status updated'} for ${jobTitle}`,
      data: {
        applicationId,
        jobTitle,
        status,
      },
      priority: status === 'interview_scheduled' ? 'high' : 'normal',
      actionUrl: `/profile/applications/${applicationId}`,
    });
  }

  /**
   * Send system announcement
   */
  static async sendSystemAnnouncement(
    userIds: string[],
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<number> {
    return this.sendBulkNotification({
      userIds,
      type: 'system_announcement',
      title,
      message,
      priority: 'normal',
      actionUrl,
    });
  }

  /**
   * Check if email notification should be sent
   */
  private static shouldSendEmail(
    type: NotificationType,
    preferences: any
  ): boolean {
    if (!preferences || !preferences.emailEnabled) return false;

    switch (type) {
      case 'job_match':
        return preferences.jobMatchEmail;
      case 'application_update':
        return preferences.applicationEmail;
      case 'message_received':
        return preferences.messageEmail;
      case 'system_announcement':
      case 'security_alert':
        return preferences.systemEmail;
      case 'marketing':
        return preferences.marketingEmail;
      default:
        return preferences.emailEnabled;
    }
  }

  /**
   * Check if push notification should be sent
   */
  private static shouldSendPush(
    type: NotificationType,
    preferences: any
  ): boolean {
    if (!preferences || !preferences.pushEnabled) return false;

    switch (type) {
      case 'job_match':
        return preferences.jobMatchPush;
      case 'application_update':
        return preferences.applicationPush;
      case 'message_received':
        return preferences.messagePush;
      case 'system_announcement':
      case 'security_alert':
        return preferences.systemPush;
      case 'marketing':
        return preferences.marketingPush;
      default:
        return preferences.pushEnabled;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    user: { email: string; name: string | null },
    notificationData: NotificationData
  ): Promise<void> {
    try {
      await EmailHelpers.sendSystemNotification(
        user.email,
        notificationData.title,
        notificationData.message,
        {
          userId: notificationData.userId,
          metadata: {
            notificationType: notificationData.type,
            actionUrl: notificationData.actionUrl,
          },
        }
      );
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  private static async sendPushNotification(
    user: { email: string; name: string | null },
    notificationData: NotificationData
  ): Promise<void> {
    // TODO: Implement push notification service
    console.log('Push notification would be sent:', {
      user: user.email,
      title: notificationData.title,
      message: notificationData.message,
    });
  }

  /**
   * Send bulk email notifications
   */
  private static async sendBulkEmailNotifications(
    bulkData: BulkNotificationData
  ): Promise<void> {
    try {
      // Get users with email preferences enabled
      const users = await prisma.user.findMany({
        where: {
          id: { in: bulkData.userIds },
        },
        include: {
          notificationPreferences: true,
        },
      });

      const emailUsers = users.filter(user => 
        this.shouldSendEmail(bulkData.type, user.notificationPreferences)
      );

      // Send emails in batches
      const batchSize = 50;
      for (let i = 0; i < emailUsers.length; i += batchSize) {
        const batch = emailUsers.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(user =>
            EmailHelpers.sendSystemNotification(
              user.email,
              bulkData.title,
              bulkData.message,
              {
                userId: user.id,
                metadata: {
                  notificationType: bulkData.type,
                  actionUrl: bulkData.actionUrl,
                },
              }
            )
          )
        );
      }
    } catch (error) {
      console.error('Error sending bulk email notifications:', error);
    }
  }
}
