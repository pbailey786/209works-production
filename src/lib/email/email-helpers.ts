import { emailService, EmailServiceOptions } from '@/lib/email/email-service';
import { EmailResult } from '@/lib/agents/email-agent';

export interface JobAlertData {
  userName: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary?: string;
  jobType: string;
  description: string;
  jobUrl: string;
  unsubscribeUrl: string;
}

export interface WeeklyDigestData {
  userName: string;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    url: string;
  }>;
  unsubscribeUrl: string;
}

export interface WelcomeEmailData {
  userName: string;
  userType: 'job_seeker' | 'employer';
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
}

export interface ApplicationConfirmationData {
  userName: string;
  jobTitle: string;
  companyName: string;
  applicationDate: string;
  jobUrl: string;
}

export interface NewApplicantData {
  employerName: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicationDate: string;
  resumeUrl?: string;
  dashboardUrl: string;
}

/**
 * Email helpers for common email scenarios
 */
export class EmailHelpers {
  /**
   * Send job alert email to job seeker
   */
  static async sendJobAlert(
    to: string,
    data: JobAlertData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('job-alert', to, data, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'job-alert' }],
      ...options,
    });
  }

  /**
   * Send weekly job digest to job seeker
   */
  static async sendWeeklyDigest(
    to: string,
    data: WeeklyDigestData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('weekly-digest', to, data, {
      priority: 'low',
      tags: [{ name: 'type', value: 'weekly-digest' }],
      ...options,
    });
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    // Determine the correct template based on user type
    const templateId = data.userType === 'employer' ? 'welcome-employer' : 'welcome-job-seeker';

    return emailService.sendTemplatedEmail(templateId, to, data, {
      priority: 'high',
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'user-type', value: data.userType },
      ],
      ...options,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    to: string,
    data: PasswordResetData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('password-reset', to, data, {
      priority: 'urgent',
      tags: [{ name: 'type', value: 'password-reset' }],
      ...options,
    });
  }

  /**
   * Send application confirmation to job seeker
   */
  static async sendApplicationConfirmation(
    to: string,
    data: ApplicationConfirmationData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('application-confirmation', to, data, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'application-confirmation' }],
      ...options,
    });
  }

  /**
   * Send new applicant notification to employer
   */
  static async sendNewApplicantNotification(
    to: string,
    data: NewApplicantData,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('new-applicant', to, data, {
      priority: 'high',
      tags: [{ name: 'type', value: 'new-applicant' }],
      ...options,
    });
  }

  /**
   * Send bulk job alerts to multiple recipients
   */
  static async sendBulkJobAlerts(
    recipients: Array<{ email: string; data: JobAlertData }>,
    options: EmailServiceOptions & { batchSize?: number; delayBetweenBatches?: number } = {}
  ) {
    const emailRecipients = recipients.map(recipient => ({
      email: recipient.email,
      props: recipient.data,
    }));

    return emailService.sendBulkTemplatedEmails('job-alert', emailRecipients, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'bulk-job-alerts' }],
      batchSize: options.batchSize || 50,
      delayBetweenBatches: options.delayBetweenBatches || 2000,
      ...options,
    });
  }

  /**
   * Send bulk weekly digests
   */
  static async sendBulkWeeklyDigests(
    recipients: Array<{ email: string; data: WeeklyDigestData }>,
    options: EmailServiceOptions & { batchSize?: number; delayBetweenBatches?: number } = {}
  ) {
    const emailRecipients = recipients.map(recipient => ({
      email: recipient.email,
      props: recipient.data,
    }));

    return emailService.sendBulkTemplatedEmails('weekly-digest', emailRecipients, {
      priority: 'low',
      tags: [{ name: 'type', value: 'bulk-weekly-digest' }],
      batchSize: options.batchSize || 100,
      delayBetweenBatches: options.delayBetweenBatches || 1000,
      ...options,
    });
  }

  /**
   * Send job posting confirmation to employer
   */
  static async sendJobPostingConfirmation(
    to: string,
    data: {
      employerName: string;
      jobTitle: string;
      jobId: string;
      jobUrl: string;
      dashboardUrl: string;
    },
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('job-posting-confirmation', to, data, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'job-posting-confirmation' }],
      ...options,
    });
  }

  /**
   * Send system notification email
   */
  static async sendSystemNotification(
    to: string,
    title: string,
    message: string,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    return emailService.sendTemplatedEmail('platform-notice', to, { title, message }, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'platform-notice' }],
      ...options,
    });
  }
}

// Export for convenience
export const {
  sendJobAlert,
  sendWeeklyDigest,
  sendWelcomeEmail,
  sendPasswordReset,
  sendApplicationConfirmation,
  sendNewApplicantNotification,
  sendBulkJobAlerts,
  sendBulkWeeklyDigests,
  sendJobPostingConfirmation,
  sendSystemNotification,
} = EmailHelpers;
