import React from 'react';
import { render } from '@react-email/render';

// Import email templates
import JobAlertEmail from '@/components/emails/job-alert-email';
import WeeklyDigestEmail from '@/components/emails/weekly-digest-email';
import WelcomeEmail from '@/components/emails/welcome-email';
import PasswordResetEmail from '@/components/emails/password-reset-email';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'job_seeker' | 'employer' | 'system' | 'marketing';
  component: React.ComponentType<any>;
  defaultProps: Record<string, any>;
  requiredProps: string[];
  previewProps: Record<string, any>;
}

export interface TemplateRenderResult {
  html: string;
  text: string;
  subject: string;
}

export class TemplateManager {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register default email templates
   */
  private registerDefaultTemplates() {
    // Job Seeker Templates
    this.registerTemplate({
      id: 'job-alert',
      name: 'Job Alert',
      description: 'Notification email for new job matches',
      category: 'job_seeker',
      component: JobAlertEmail,
      defaultProps: {
        userName: 'Job Seeker',
        jobTitle: 'Software Developer',
        companyName: 'Tech Company',
        location: 'Modesto, CA',
        jobType: 'Full-time',
        description: 'We are looking for a talented developer...',
        jobUrl: '#',
        unsubscribeUrl: '#',
      },
      requiredProps: ['userName', 'jobTitle', 'companyName', 'location', 'jobUrl', 'unsubscribeUrl'],
      previewProps: {
        userName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'Innovative Tech Solutions',
        location: 'Stockton, CA',
        salary: '$80,000 - $120,000',
        jobType: 'Full-time',
        description: 'Join our dynamic team and work on cutting-edge projects that make a real impact in the 209 area.',
        jobUrl: 'https://209.works/jobs/123',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
    });

    this.registerTemplate({
      id: 'weekly-digest',
      name: 'Weekly Job Digest',
      description: 'Weekly summary of new job opportunities',
      category: 'job_seeker',
      component: WeeklyDigestEmail,
      defaultProps: {
        userName: 'Job Seeker',
        jobs: [],
        unsubscribeUrl: '#',
      },
      requiredProps: ['userName', 'jobs', 'unsubscribeUrl'],
      previewProps: {
        userName: 'Sarah Johnson',
        jobs: [
          {
            id: '1',
            title: 'Marketing Manager',
            company: 'Local Business Inc',
            location: 'Modesto, CA',
            salary: '$60,000 - $75,000',
            url: 'https://209.works/jobs/1',
          },
          {
            id: '2',
            title: 'Registered Nurse',
            company: 'Central Valley Hospital',
            location: 'Turlock, CA',
            salary: '$70,000 - $85,000',
            url: 'https://209.works/jobs/2',
          },
        ],
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
    });

    // System Templates
    this.registerTemplate({
      id: 'welcome-email',
      name: 'Welcome Email',
      description: 'Welcome new users to the platform',
      category: 'system',
      component: WelcomeEmail,
      defaultProps: {
        userName: 'User',
        userType: 'job_seeker',
      },
      requiredProps: ['userName', 'userType'],
      previewProps: {
        userName: 'Alex Rodriguez',
        userType: 'job_seeker',
      },
    });

    this.registerTemplate({
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Password reset instructions',
      category: 'system',
      component: PasswordResetEmail,
      defaultProps: {
        userName: 'User',
        resetUrl: '#',
      },
      requiredProps: ['userName', 'resetUrl'],
      previewProps: {
        userName: 'Maria Garcia',
        resetUrl: 'https://209.works/reset-password?token=abc123',
      },
    });
  }

  /**
   * Register a new email template
   */
  registerTemplate(template: EmailTemplate) {
    this.templates.set(template.id, template);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Render a template with provided props
   */
  async renderTemplate(templateId: string, props: Record<string, any>): Promise<TemplateRenderResult> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required props
    const missingProps = template.requiredProps.filter(prop => !(prop in props));
    if (missingProps.length > 0) {
      throw new Error(`Missing required props: ${missingProps.join(', ')}`);
    }

    // Merge with default props
    const finalProps = { ...template.defaultProps, ...props };

    try {
      // Create React element
      const element = React.createElement(template.component, finalProps);

      // Render to HTML
      const html = await render(element);

      // Extract text content (simplified)
      const text = this.extractTextFromHtml(html);

      // Generate subject (can be enhanced with template-specific logic)
      const subject = this.generateSubject(templateId, finalProps);

      return { html, text, subject };
    } catch (error) {
      throw new Error(`Failed to render template ${templateId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(templateId: string): Promise<TemplateRenderResult> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.renderTemplate(templateId, template.previewProps);
  }

  /**
   * Generate subject line based on template and props
   */
  private generateSubject(templateId: string, props: Record<string, any>): string {
    switch (templateId) {
      case 'job-alert':
        return `New Job Alert: ${props.jobTitle} at ${props.companyName}`;
      case 'weekly-digest':
        const jobCount = props.jobs?.length || 0;
        return `${jobCount} New Jobs This Week in the 209 Area`;
      case 'welcome-email':
        return 'Welcome to 209 Works!';
      case 'password-reset':
        return 'Reset Your 209 Works Password';
      default:
        return '209 Works Notification';
    }
  }

  /**
   * Extract plain text from HTML
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate template props
   */
  validateTemplateProps(templateId: string, props: Record<string, any>): { isValid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { isValid: false, errors: [`Template not found: ${templateId}`] };
    }

    const errors: string[] = [];
    
    // Check required props
    template.requiredProps.forEach(prop => {
      if (!(prop in props)) {
        errors.push(`Missing required prop: ${prop}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();
