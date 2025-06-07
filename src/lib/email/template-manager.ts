import React from 'react';
import { render } from '@react-email/render';

// Import email templates
import JobAlertEmail from '@/components/emails/job-alert-email';
import WeeklyDigestEmail from '@/components/emails/weekly-digest-email';
import WelcomeJobSeekerEmail from '@/components/emails/welcome-job-seeker-email';
import WelcomeEmployerEmail from '@/components/emails/welcome-employer-email';
import WelcomeEmail from '@/components/emails/welcome-email';
import PasswordResetEmail from '@/components/emails/password-reset-email';
import InterviewInvitationEmail from '@/components/emails/interview-invitation-email';
import ApplicationStatusEmail from '@/components/emails/application-status-email';
import CompanyNewsletterEmail from '@/components/emails/company-newsletter-email';

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

// Create a singleton instance to ensure consistency
let templateManagerInstance: TemplateManager | null = null;

export class TemplateManager {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    if (templateManagerInstance) {
      return templateManagerInstance;
    }
    this.registerDefaultTemplates();
    templateManagerInstance = this;
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
      id: 'welcome-job-seeker',
      name: 'Welcome Job Seeker',
      description: 'Welcome new job seekers to the platform',
      category: 'job_seeker',
      component: WelcomeJobSeekerEmail,
      defaultProps: {
        userName: 'Job Seeker',
        loginUrl: 'https://209.works/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
      requiredProps: ['userName'],
      previewProps: {
        userName: 'Alex Rodriguez',
        loginUrl: 'https://209.works/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
    });

    this.registerTemplate({
      id: 'welcome-employer',
      name: 'Welcome Employer',
      description: 'Welcome new employers to the platform',
      category: 'employer',
      component: WelcomeEmployerEmail,
      defaultProps: {
        companyName: 'Your Company',
        contactName: 'Hiring Manager',
        loginUrl: 'https://209.works/employer/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
      requiredProps: ['companyName', 'contactName'],
      previewProps: {
        companyName: 'Central Valley Tech Solutions',
        contactName: 'Maria Garcia',
        loginUrl: 'https://209.works/employer/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
    });

    this.registerTemplate({
      id: 'welcome-email',
      name: 'Welcome Email (Legacy)',
      description: 'Legacy welcome email template',
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

    // Additional system templates
    this.registerTemplate({
      id: 'application-confirmation',
      name: 'Application Confirmation',
      description: 'Confirmation email when user applies for a job',
      category: 'job_seeker',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        userName: 'Job Seeker',
        jobTitle: 'Software Developer',
        companyName: 'Tech Company',
        applicationDate: new Date().toLocaleDateString(),
        jobUrl: '#',
      },
      requiredProps: ['userName', 'jobTitle', 'companyName'],
      previewProps: {
        userName: 'Alex Rodriguez',
        jobTitle: 'Marketing Manager',
        companyName: 'Central Valley Marketing',
        applicationDate: new Date().toLocaleDateString(),
        jobUrl: 'https://209.works/jobs/123',
      },
    });

    this.registerTemplate({
      id: 'new-applicant',
      name: 'New Applicant Alert',
      description: 'Notification to employers about new job applications',
      category: 'employer',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        employerName: 'Hiring Manager',
        jobTitle: 'Software Developer',
        applicantName: 'Job Seeker',
        applicantEmail: 'jobseeker@example.com',
        applicationDate: new Date().toLocaleDateString(),
        dashboardUrl: 'https://209.works/employers/dashboard',
      },
      requiredProps: ['employerName', 'jobTitle', 'applicantName'],
      previewProps: {
        employerName: 'Maria Garcia',
        jobTitle: 'Marketing Manager',
        applicantName: 'Alex Rodriguez',
        applicantEmail: 'alex.rodriguez@example.com',
        applicationDate: new Date().toLocaleDateString(),
        dashboardUrl: 'https://209.works/employers/dashboard',
      },
    });

    this.registerTemplate({
      id: 'job-posting-confirmation',
      name: 'Job Posting Confirmation',
      description: 'Confirmation email when employer posts a new job',
      category: 'employer',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        employerName: 'Hiring Manager',
        jobTitle: 'Software Developer',
        jobId: 'JOB-123',
        jobUrl: '#',
        dashboardUrl: 'https://209.works/employers/dashboard',
      },
      requiredProps: ['employerName', 'jobTitle', 'jobId'],
      previewProps: {
        employerName: 'Maria Garcia',
        jobTitle: 'Marketing Manager',
        jobId: 'JOB-456',
        jobUrl: 'https://209.works/jobs/456',
        dashboardUrl: 'https://209.works/employers/dashboard',
      },
    });

    this.registerTemplate({
      id: 'system-notification',
      name: 'System Notification',
      description: 'General system notification template',
      category: 'system',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        title: 'System Notification',
        message: 'This is a system notification from 209 Works.',
      },
      requiredProps: ['title', 'message'],
      previewProps: {
        title: 'System Maintenance Notice',
        message: 'We will be performing scheduled maintenance on our servers tonight from 2:00 AM to 4:00 AM PST. During this time, the platform may be temporarily unavailable.',
      },
    });

    // Professional Templates
    this.registerTemplate({
      id: 'interview-invitation',
      name: 'Interview Invitation',
      description: 'Professional interview invitation email',
      category: 'employer',
      component: InterviewInvitationEmail,
      defaultProps: {
        candidateName: 'Candidate',
        jobTitle: 'Position',
        companyName: 'Company',
        interviewDate: 'Date TBD',
        interviewTime: 'Time TBD',
        interviewType: 'video',
        interviewerName: 'Hiring Manager',
        interviewerTitle: 'Manager',
        contactEmail: 'hr@company.com',
      },
      requiredProps: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'interviewerName', 'contactEmail'],
      previewProps: {
        candidateName: 'Sarah Johnson',
        jobTitle: 'Senior Software Engineer',
        companyName: 'Central Valley Tech Solutions',
        interviewDate: 'Friday, January 26, 2024',
        interviewTime: '2:00 PM PST',
        interviewType: 'video',
        meetingLink: 'https://zoom.us/j/123456789',
        interviewerName: 'Maria Garcia',
        interviewerTitle: 'Engineering Manager',
        contactEmail: 'maria@cvtech.com',
        contactPhone: '(209) 555-0123',
        instructions: 'Please test your camera and microphone before the interview. We\'ll discuss your technical background and experience with React and Node.js.',
      },
    });

    this.registerTemplate({
      id: 'application-status-accepted',
      name: 'Application Status - Accepted',
      description: 'Notification when candidate is accepted for a position',
      category: 'employer',
      component: ApplicationStatusEmail,
      defaultProps: {
        candidateName: 'Candidate',
        jobTitle: 'Position',
        companyName: 'Company',
        status: 'accepted',
        contactEmail: 'hr@company.com',
        hrName: 'Hiring Team',
      },
      requiredProps: ['candidateName', 'jobTitle', 'companyName', 'status', 'contactEmail'],
      previewProps: {
        candidateName: 'Alex Rodriguez',
        jobTitle: 'Marketing Manager',
        companyName: 'Central Valley Marketing',
        status: 'accepted',
        personalizedMessage: 'We are thrilled to offer you the Marketing Manager position! Your innovative approach to digital marketing and your understanding of the Central Valley market make you the perfect fit for our team.',
        nextSteps: 'Our HR team will contact you within 24 hours with your offer letter and next steps. We\'re excited to have you join our growing team!',
        contactEmail: 'hr@cvmarketing.com',
        hrName: 'Jennifer Thompson',
      },
    });

    this.registerTemplate({
      id: 'application-status-rejected',
      name: 'Application Status - Rejected',
      description: 'Professional rejection email with encouragement',
      category: 'employer',
      component: ApplicationStatusEmail,
      defaultProps: {
        candidateName: 'Candidate',
        jobTitle: 'Position',
        companyName: 'Company',
        status: 'rejected',
        contactEmail: 'hr@company.com',
        hrName: 'Hiring Team',
        futureOpportunities: true,
      },
      requiredProps: ['candidateName', 'jobTitle', 'companyName', 'status', 'contactEmail'],
      previewProps: {
        candidateName: 'Michael Chen',
        jobTitle: 'Software Developer',
        companyName: 'Tech Innovations Inc',
        status: 'rejected',
        personalizedMessage: 'Thank you for your interest in the Software Developer position and for taking the time to interview with our team. While we were impressed with your technical skills and enthusiasm, we have decided to move forward with a candidate whose experience more closely aligns with our immediate project needs.',
        feedbackMessage: 'Your portfolio demonstrated strong frontend development skills, and we encourage you to continue building experience with backend technologies.',
        futureOpportunities: true,
        contactEmail: 'careers@techinnovations.com',
        hrName: 'David Kim',
      },
    });

    this.registerTemplate({
      id: 'company-newsletter',
      name: 'Company Newsletter',
      description: 'Professional monthly newsletter template',
      category: 'marketing',
      component: CompanyNewsletterEmail,
      defaultProps: {
        newsletterTitle: '209 Works Monthly Newsletter',
        edition: 'January 2024',
        date: new Date().toLocaleDateString(),
        featuredStory: {
          title: 'Featured Story',
          content: 'Newsletter content here...',
          ctaText: 'Read More',
          ctaUrl: '#',
        },
        newsItems: [],
        unsubscribeUrl: '#',
        webViewUrl: '#',
      },
      requiredProps: ['newsletterTitle', 'edition', 'featuredStory', 'unsubscribeUrl', 'webViewUrl'],
      previewProps: {
        recipientName: 'Sarah Johnson',
        newsletterTitle: '209 Works Monthly Newsletter',
        edition: 'January 2024',
        date: new Date().toLocaleDateString(),
        featuredStory: {
          title: 'Central Valley Tech Boom: New Opportunities in 2024',
          content: 'The Central Valley is experiencing unprecedented growth in the technology sector. With major companies establishing offices in Modesto, Stockton, and Fresno, job opportunities for tech professionals have increased by 35% this year. From software development to data analytics, the 209 area is becoming a hub for innovation.',
          ctaText: 'Explore Tech Jobs',
          ctaUrl: 'https://209.works/jobs?category=technology',
        },
        newsItems: [
          {
            id: '1',
            title: 'New Partnership with UC Merced',
            excerpt: '209 Works announces partnership with UC Merced to connect students with local internship opportunities.',
            readMoreUrl: 'https://209.works/news/uc-merced-partnership',
            category: 'news',
          },
          {
            id: '2',
            title: 'Resume Tips for 2024',
            excerpt: 'Learn how to optimize your resume for applicant tracking systems and stand out to employers.',
            readMoreUrl: 'https://209.works/blog/resume-tips-2024',
            category: 'tip',
          },
        ],
        jobSpotlight: {
          title: 'Senior Data Analyst',
          company: 'AgTech Solutions',
          location: 'Modesto, CA',
          salary: '$75,000 - $95,000',
          url: 'https://209.works/jobs/senior-data-analyst',
        },
        platformStats: {
          newJobs: 247,
          newCompanies: 18,
          newJobSeekers: 432,
        },
        upcomingEvents: [
          {
            title: 'Central Valley Career Fair',
            date: 'February 15, 2024',
            location: 'Modesto Centre Plaza',
            url: 'https://209.works/events/career-fair-feb-2024',
          },
        ],
        unsubscribeUrl: 'https://209.works/unsubscribe',
        webViewUrl: 'https://209.works/newsletter/january-2024',
      },
    });
  }

  /**
   * Create a generic system notification template component
   */
  private createSystemNotificationTemplate() {
    return (props: any) => {
      const {
        title = 'Notification',
        message = 'This is a notification from 209 Works.',
        userName,
        jobTitle,
        companyName,
        employerName,
        applicantName,
        applicationDate,
        jobUrl,
        dashboardUrl,
        resetUrl,
        ...otherProps
      } = props;

      // Generate content based on available props
      let content = message;

      if (jobTitle && companyName && userName) {
        // Application confirmation
        content = `
          <h2>Application Submitted Successfully!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          <p>Your application was submitted on ${applicationDate || new Date().toLocaleDateString()}.</p>
          <p>The employer will review your application and contact you if you're selected for an interview.</p>
          ${jobUrl ? `<p><a href="${jobUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Posting</a></p>` : ''}
        `;
      } else if (employerName && applicantName && jobTitle) {
        // New applicant notification
        content = `
          <h2>New Application Received</h2>
          <p>Hi ${employerName},</p>
          <p>You have received a new application for the <strong>${jobTitle}</strong> position.</p>
          <p><strong>Applicant:</strong> ${applicantName}</p>
          <p><strong>Applied on:</strong> ${applicationDate || new Date().toLocaleDateString()}</p>
          ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Application</a></p>` : ''}
        `;
      } else if (employerName && jobTitle && props.jobId) {
        // Job posting confirmation
        content = `
          <h2>Job Posted Successfully!</h2>
          <p>Hi ${employerName},</p>
          <p>Your job posting for <strong>${jobTitle}</strong> has been successfully published.</p>
          <p><strong>Job ID:</strong> ${props.jobId}</p>
          ${jobUrl ? `<p><a href="${jobUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Posting</a></p>` : ''}
          ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="color: #1e40af;">Manage Your Jobs</a></p>` : ''}
        `;
      }

      return React.createElement('div', {
        style: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px 20px',
          backgroundColor: '#ffffff',
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: {
            textAlign: 'center',
            marginBottom: '40px',
            borderBottom: '3px solid #10b981',
            paddingBottom: '20px',
          }
        }, [
          React.createElement('h1', {
            key: 'logo',
            style: {
              color: '#10b981',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0',
            }
          }, '209 Works'),
          React.createElement('p', {
            key: 'tagline',
            style: {
              color: '#6b7280',
              fontSize: '14px',
              margin: '5px 0 0 0',
            }
          }, 'Your Local Job Platform')
        ]),
        React.createElement('div', {
          key: 'content',
          dangerouslySetInnerHTML: { __html: content }
        }),
        React.createElement('div', {
          key: 'footer',
          style: {
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }
        }, [
          React.createElement('p', { key: 'footer-text' }, 'Built for the 209. Made for the people who work here.'),
          React.createElement('p', { key: 'contact' }, [
            'Questions? Contact us at ',
            React.createElement('a', {
              key: 'email-link',
              href: 'mailto:support@209.works',
              style: { color: '#10b981' }
            }, 'support@209.works')
          ])
        ])
      ]);
    };
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
  getAllTemplates(): Record<string, EmailTemplate> {
    const result: Record<string, EmailTemplate> = {};
    for (const [id, template] of this.templates.entries()) {
      result[id] = template;
    }
    return result;
  }

  /**
   * Get all templates as array
   */
  getAllTemplatesArray(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
    return this.getAllTemplatesArray().filter(template => template.category === category);
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
      // Return a fallback template for preview purposes
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Template Not Found</h1>
          <p>The email template "${templateId}" could not be found.</p>
          <p>Available templates:</p>
          <ul>
            ${Object.keys(this.templates).map(id => `<li>${id}</li>`).join('')}
          </ul>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is a preview message from 209 Works Email System</p>
        </div>
      `;

      return {
        html: fallbackHtml,
        subject: `Template Not Found: ${templateId}`,
        text: `Template "${templateId}" not found. Available templates: ${Object.keys(this.templates).join(', ')}`
      };
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
    // Enhanced subject generation with template-specific logic
    switch (templateId) {
      case 'job-alert':
        return `New Job Alert: ${props.jobTitle || 'Job Opportunity'} at ${props.companyName || 'Company'}`;
      case 'weekly-digest':
        return `Your Weekly Job Digest - ${props.jobs?.length || 0} New Jobs in ${props.location || '209 Area'}`;
      case 'welcome-job-seeker':
        return `Welcome to 209 Works, ${props.userName || 'Job Seeker'}!`;
      case 'welcome-employer':
        return `Welcome to 209 Works, ${props.companyName || 'Company'}!`;
      case 'password-reset':
        return 'Reset Your 209 Works Password';
      case 'application-confirmation':
        return `Application Confirmed: ${props.jobTitle || 'Job'} at ${props.companyName || 'Company'}`;
      case 'new-applicant':
        return `New Application: ${props.applicantName || 'Candidate'} for ${props.jobTitle || 'Position'}`;
      case 'job-posting-confirmation':
        return `Job Posted Successfully: ${props.jobTitle || 'Your Job'}`;
      case 'system-notification':
        return props.title || 'System Notification from 209 Works';
      case 'interview-invitation':
        return `Interview Invitation: ${props.jobTitle || 'Position'} at ${props.companyName || 'Company'}`;
      case 'application-status-accepted':
        return `Congratulations! You've Been Selected for ${props.jobTitle || 'Position'}`;
      case 'application-status-rejected':
        return `Thank You for Your Interest in ${props.jobTitle || 'Position'}`;
      case 'company-newsletter':
        return `${props.newsletterTitle || '209 Works Newsletter'} - ${props.edition || 'Latest Edition'}`;
      default:
        return `Notification from 209 Works`;
    }
  }

  /**
   * Extract plain text from HTML (simplified)
   */
  private extractTextFromHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
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
    for (const requiredProp of template.requiredProps) {
      if (!(requiredProp in props)) {
        errors.push(`Missing required prop: ${requiredProp}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();
