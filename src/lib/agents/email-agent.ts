import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import { SecurityLogger } from '@/lib/security/security-monitor';
import { emailSecurityValidator } from '@/lib/email/security';

export interface EmailJobData {
  id: string;
  to: string | string[];
  subject: string;
  template?: string;
  templateProps?: Record<string, any>;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId?: string;
  metadata?: Record<string, any>;
  delay?: number;
  retryLimit?: number;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
}

export class EmailAgent {
  private resend: Resend;
  private isDevelopment: boolean;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Send email with comprehensive error handling and security
   */
  async sendEmail(data: EmailJobData): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      // Validate email data
      const validation = this.validateEmailData(data);
      if (!validation.isValid) {
        throw new Error(`Email validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare email content
      let htmlContent: string | undefined = data.html;
      let textContent: string | undefined = data.text;

      // Render React component if provided
      if (data.react) {
        try {
          htmlContent = await render(data.react);
          if (!textContent) {
            textContent = this.extractTextFromHtml(htmlContent);
          }
        } catch (error) {
          console.error('[EMAIL-AGENT] Failed to render React component:', error);
          throw new Error('Failed to render email template');
        }
      }

      // Sanitize HTML content
      if (htmlContent) {
        htmlContent = emailSecurityValidator.sanitizeHtmlContent(htmlContent);
      }

      // Generate secure headers
      const fromAddress = process.env.RESEND_EMAIL_FROM || 'noreply@209.works';
      const recipients = Array.isArray(data.to) ? data.to : [data.to];
      const secureHeaders = emailSecurityValidator.generateSecureHeaders(
        fromAddress,
        recipients,
        data.subject
      );

      // Prepare Resend email data
      const emailPayload: {
        from: string;
        to: string[];
        subject: string;
        html?: string;
        text?: string;
        headers?: Record<string, string>;
        tags?: Array<{ name: string; value: string }>;
      } = {
        from: fromAddress,
        to: recipients,
        subject: data.subject,
        html: htmlContent,
        text: textContent,
        headers: secureHeaders,
        tags: [
          { name: 'priority', value: data.priority },
          { name: 'environment', value: process.env.NODE_ENV || 'development' },
          { name: 'source', value: '209works' },
          { name: 'agent', value: 'email-agent' },
          ...(data.tags || []),
        ],
      };

      // Send email via Resend
      const result = await this.resend.emails.send(emailPayload);

      // Log successful send
      const processingTime = Date.now() - startTime;
      if (this.isDevelopment) {
        console.log(
          `[EMAIL-AGENT] Successfully sent email "${data.subject}" to ${recipients.join(', ')} in ${processingTime}ms`
        );
      }

      // Security logging
      SecurityLogger.loginSuccess(
        data.userId || 'system',
        'email-agent',
        `Email sent: ${data.subject}`
      );

      return {
        success: true,
        data: result.data,
        messageId: result.data?.id,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`[EMAIL-AGENT] Failed to send email after ${processingTime}ms:`, error);
      
      // Security logging for failures
      SecurityLogger.suspiciousRequest(
        'email-agent',
        `Email send failed: ${errorMessage}`,
        { subject: data.subject, recipients: data.to },
        data.userId
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(emails: EmailJobData[], options?: {
    batchSize?: number;
    delayBetweenBatches?: number;
  }): Promise<{ results: EmailResult[]; summary: EmailMetrics }> {
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;
    const results: EmailResult[] = [];
    
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.sendEmail(email));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.success) {
            sent++;
          } else {
            failed++;
          }
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
          });
          failed++;
        }
      });

      // Delay between batches to respect rate limits
      if (i + batchSize < emails.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      results,
      summary: {
        sent,
        delivered: sent, // Will be updated by webhooks
        opened: 0,
        clicked: 0,
        bounced: failed,
        complained: 0,
        unsubscribed: 0,
      },
    };
  }

  /**
   * Validate email data before sending
   */
  private validateEmailData(data: EmailJobData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate recipients
    const recipients = Array.isArray(data.to) ? data.to : [data.to];
    for (const email of recipients) {
      const validation = emailSecurityValidator.validateEmailAddress(email);
      if (!validation.isValid) {
        errors.push(`Invalid recipient email: ${email}`);
      }
    }

    // Validate subject
    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    // Validate content
    if (!data.react && !data.html && !data.text) {
      errors.push('Email content is required (react, html, or text)');
    }

    // Validate priority
    if (!['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmail: EmailJobData = {
        id: `test_${Date.now()}`,
        to: process.env.RESEND_EMAIL_FROM || 'test@209.works',
        subject: '209 Works Email System Test',
        html: '<p>This is a test email from the 209 Works email system.</p>',
        text: 'This is a test email from the 209 Works email system.',
        priority: 'normal',
        metadata: { test: true },
      };

      const result = await this.sendEmail(testEmail);
      return { success: result.success, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const emailAgent = new EmailAgent();
