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
    return emailService.sendTemplatedEmail('welcome-email', to, data, {
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
    // Create inline template for application confirmation
    const templateProps = {
      userName: data.userName,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      applicationDate: data.applicationDate,
      jobUrl: data.jobUrl,
    };

    // For now, use a simple HTML template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Application Submitted Successfully!</h1>
        <p>Hi ${data.userName},</p>
        <p>Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been submitted successfully.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Application Details:</h3>
          <p><strong>Position:</strong> ${data.jobTitle}</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Submitted:</strong> ${data.applicationDate}</p>
        </div>
        <p>The employer will review your application and contact you if you're selected for an interview.</p>
        <a href="${data.jobUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">View Job Posting</a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Good luck with your application!<br>
          The 209 Works Team
        </p>
      </div>
    `;

    return emailService.sendTemplatedEmail('system-notification', to, { html }, {
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
    // Create inline template for new applicant notification
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">New Job Application Received</h1>
        <p>Hi ${data.employerName},</p>
        <p>You have received a new application for your job posting: <strong>${data.jobTitle}</strong></p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Applicant Details:</h3>
          <p><strong>Name:</strong> ${data.applicantName}</p>
          <p><strong>Email:</strong> ${data.applicantEmail}</p>
          <p><strong>Applied:</strong> ${data.applicationDate}</p>
          ${data.resumeUrl ? `<p><strong>Resume:</strong> <a href="${data.resumeUrl}">View Resume</a></p>` : ''}
        </div>
        <p>Review the application and contact the candidate if they're a good fit for your position.</p>
        <a href="${data.dashboardUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Review Application</a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Best regards,<br>
          The 209 Works Team
        </p>
      </div>
    `;

    return emailService.sendTemplatedEmail('system-notification', to, { html }, {
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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Job Posted Successfully!</h1>
        <p>Hi ${data.employerName},</p>
        <p>Your job posting for <strong>${data.jobTitle}</strong> has been published and is now live on 209 Works.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Job Details:</h3>
          <p><strong>Position:</strong> ${data.jobTitle}</p>
          <p><strong>Job ID:</strong> ${data.jobId}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
        <p>Your job posting is now visible to job seekers in the 209 area. You'll receive notifications when candidates apply.</p>
        <div style="margin: 30px 0;">
          <a href="${data.jobUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">View Job Posting</a>
          <a href="${data.dashboardUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Jobs</a>
        </div>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Thank you for using 209 Works!<br>
          The 209 Works Team
        </p>
      </div>
    `;

    return emailService.sendTemplatedEmail('system-notification', to, { html }, {
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
    subject: string,
    message: string,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">209 Works Notification</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message}
        </div>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          The 209 Works Team
        </p>
      </div>
    `;

    return emailService.sendTemplatedEmail('system-notification', to, { html, subject }, {
      priority: 'normal',
      tags: [{ name: 'type', value: 'system-notification' }],
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
