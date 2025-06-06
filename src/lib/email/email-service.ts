import { emailAgent, EmailJobData, EmailResult, EmailMetrics } from '@/lib/agents/email-agent';
import { templateManager, TemplateRenderResult } from '@/lib/email/template-manager';
import { SecurityLogger } from '@/lib/security/security-monitor';

export interface EmailServiceOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  delay?: number;
  userId?: string;
  metadata?: Record<string, any>;
  tags?: Array<{ name: string; value: string }>;
}

export interface CampaignOptions {
  name: string;
  description?: string;
  scheduledAt?: Date;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  recipients: Array<{ email: string; props: Record<string, any> }>;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  metrics: EmailMetrics;
  options: CampaignOptions;
}

export class EmailService {
  /**
   * Send a templated email to a single recipient
   */
  async sendTemplatedEmail(
    templateId: string,
    to: string,
    templateProps: Record<string, any>,
    options: EmailServiceOptions = {}
  ): Promise<EmailResult> {
    try {
      // Render template
      const rendered = await templateManager.renderTemplate(templateId, templateProps);
      
      // Prepare email data
      const emailData: EmailJobData = {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        priority: options.priority || 'normal',
        userId: options.userId,
        metadata: {
          templateId,
          templateProps,
          ...options.metadata,
        },
        delay: options.delay,
        tags: [
          { name: 'template', value: templateId },
          ...(options.tags || []),
        ],
      };

      // Send email
      const result = await emailAgent.sendEmail(emailData);

      // Log template usage
      if (result.success) {
        SecurityLogger.loginSuccess(
          options.userId || 'system',
          'email-service',
          `Template email sent: ${templateId} to ${to}`
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EMAIL-SERVICE] Failed to send templated email:', error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send bulk templated emails
   */
  async sendBulkTemplatedEmails(
    templateId: string,
    recipients: Array<{ email: string; props: Record<string, any> }>,
    options: EmailServiceOptions & { batchSize?: number; delayBetweenBatches?: number } = {}
  ): Promise<{ results: EmailResult[]; summary: EmailMetrics }> {
    try {
      // Prepare all email jobs
      const emailJobs: EmailJobData[] = [];
      
      for (const recipient of recipients) {
        const rendered = await templateManager.renderTemplate(templateId, recipient.props);
        
        emailJobs.push({
          id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: recipient.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          priority: options.priority || 'normal',
          userId: options.userId,
          metadata: {
            templateId,
            templateProps: recipient.props,
            bulk: true,
            ...options.metadata,
          },
          tags: [
            { name: 'template', value: templateId },
            { name: 'bulk', value: 'true' },
            ...(options.tags || []),
          ],
        });
      }

      // Send bulk emails
      const result = await emailAgent.sendBulkEmails(emailJobs, {
        batchSize: options.batchSize,
        delayBetweenBatches: options.delayBetweenBatches,
      });

      // Log bulk operation
      SecurityLogger.loginSuccess(
        options.userId || 'system',
        'email-service',
        `Bulk template emails sent: ${templateId} to ${recipients.length} recipients`
      );

      return result;
    } catch (error) {
      console.error('[EMAIL-SERVICE] Failed to send bulk templated emails:', error);
      
      return {
        results: [],
        summary: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: recipients.length,
          complained: 0,
          unsubscribed: 0,
        },
      };
    }
  }

  /**
   * Create and manage email campaigns
   */
  async createCampaign(
    templateId: string,
    recipients: Array<{ email: string; props: Record<string, any> }>,
    options: CampaignOptions
  ): Promise<EmailCampaign> {
    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: options.name,
      description: options.description,
      templateId,
      recipients,
      status: options.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: options.scheduledAt,
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
      },
      options,
    };

    // Store campaign (in a real implementation, this would be saved to database)
    console.log('[EMAIL-SERVICE] Campaign created:', campaign.id);

    return campaign;
  }

  /**
   * Execute a campaign
   */
  async executeCampaign(campaignId: string): Promise<{ success: boolean; metrics: EmailMetrics }> {
    // In a real implementation, this would load the campaign from database
    console.log('[EMAIL-SERVICE] Executing campaign:', campaignId);

    // For now, return mock success
    return {
      success: true,
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
      },
    };
  }

  /**
   * Preview a template
   */
  async previewTemplate(templateId: string, props?: Record<string, any>): Promise<TemplateRenderResult> {
    if (props) {
      return templateManager.renderTemplate(templateId, props);
    } else {
      return templateManager.previewTemplate(templateId);
    }
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates() {
    return templateManager.getAllTemplates();
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: 'job_seeker' | 'employer' | 'system' | 'marketing') {
    return templateManager.getTemplatesByCategory(category);
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
    return emailAgent.testConfiguration();
  }

  /**
   * Send a test email
   */
  async sendTestEmail(
    to: string,
    templateId: string,
    templateProps?: Record<string, any>
  ): Promise<EmailResult> {
    const template = templateManager.getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateId}`,
      };
    }

    const props = templateProps || template.previewProps;
    
    return this.sendTemplatedEmail(templateId, to, props, {
      priority: 'normal',
      metadata: { test: true },
      tags: [{ name: 'test', value: 'true' }],
    });
  }

  /**
   * Get email metrics (placeholder for real implementation)
   */
  async getEmailMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<EmailMetrics> {
    // In a real implementation, this would query the database for actual metrics
    return {
      sent: 1250,
      delivered: 1225,
      opened: 306,
      clicked: 47,
      bounced: 25,
      complained: 2,
      unsubscribed: 8,
    };
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<EmailMetrics> {
    // In a real implementation, this would query the database for campaign-specific metrics
    return {
      sent: 500,
      delivered: 495,
      opened: 124,
      clicked: 19,
      bounced: 5,
      complained: 1,
      unsubscribed: 3,
    };
  }

  /**
   * Validate email template and props
   */
  validateTemplate(templateId: string, props: Record<string, any>): { isValid: boolean; errors: string[] } {
    return templateManager.validateTemplateProps(templateId, props);
  }
}

// Export singleton instance
export const emailService = new EmailService();
