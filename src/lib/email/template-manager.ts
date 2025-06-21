import { render } from '@react-email/render';
import path from "path";

// Import all email components
import JobAlertEmail from '@/components/emails/job-alert-email';
import WeeklyDigestEmail from '@/components/emails/weekly-digest-email';
import WelcomeJobSeekerEmail from '@/components/emails/welcome-job-seeker-email';
import WelcomeEmployerEmail from '@/components/emails/welcome-employer-email';
import ApplicationStatusEmail from '@/components/emails/application-status-email';
import CreditConfirmationEmail from '@/components/emails/credit-confirmation-email';
import InterviewInvitationEmail from '@/components/emails/interview-invitation-email';
import PasswordResetEmail from '@/components/emails/password-reset-email';
import PlatformNoticeEmail from '@/components/emails/platform-notice-email';
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

/**
 * Email Template Manager for 209 Works
 * 
 * Manages all email templates with consistent branding and styling.
 * All templates use the new brand colors:
 * - Orange (#ff6b35): Primary buttons, links, accents
 * - Dark Green (#2d4a3e): Backgrounds, secondary buttons
 * - Light Green (#9fdf9f): Hero text, highlights
 */
export class TemplateManager {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    // Job Seeker Templates
    this.registerTemplate({
      id: 'job-alert',
      name: 'Job Alert',
      description: 'Personalized job alert notifications for job seekers',
      category: 'job_seeker',
      component: JobAlertEmail,
      defaultProps: {
        userName: 'Job Seeker',
        jobTitle: 'Software Developer',
        companyName: 'Tech Company',
        location: 'Stockton, CA',
        jobType: 'Full-time',
        description: 'We are looking for a talented developer to join our team...',
        jobUrl: 'https://209.works/jobs/123',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
      requiredProps: ['userName', 'jobTitle', 'companyName', 'jobUrl'],
      previewProps: {
        userName: 'Alex Rodriguez',
        jobTitle: 'Marketing Manager',
        companyName: 'Central Valley Growth Partners',
        location: 'Modesto, CA',
        salary: '$55,000 - $70,000',
        jobType: 'Full-time',
        description: 'Join our dynamic marketing team and help local businesses grow! We\'re looking for a creative marketing professional with 3+ years of experience in digital marketing, content creation, and campaign management.',
        jobUrl: 'https://209.works/jobs/marketing-manager-cvgp',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
    });

    this.registerTemplate({
      id: 'weekly-digest',
      name: 'Weekly Job Digest',
      description: 'Weekly summary of new job opportunities in the Central Valley',
      category: 'job_seeker',
      component: WeeklyDigestEmail,
      defaultProps: {
        userName: 'Job Seeker',
        jobs: [],
        totalJobs: 0,
        location: '209 Area',
        unsubscribeUrl: 'https://209.works/unsubscribe',
        viewAllJobsUrl: 'https://209.works/jobs',
      },
      requiredProps: ['userName', 'jobs', 'totalJobs'],
      previewProps: {
        userName: 'Maria Santos',
        totalJobs: 23,
        location: 'Central Valley',
        jobs: [
          {
            id: '1',
            title: 'Registered Nurse',
            company: 'Mercy General Hospital',
            location: 'Modesto, CA',
            type: 'Full-time',
            salary: '$75,000 - $85,000',
            url: 'https://209.works/jobs/rn-mercy',
            postedDate: '2 days ago',
          },
          {
            id: '2',
            title: 'Operations Manager',
            company: 'Valley Manufacturing Co',
            location: 'Stockton, CA',
            type: 'Full-time',
            salary: '$65,000 - $80,000',
            url: 'https://209.works/jobs/ops-manager-vmc',
            postedDate: '1 day ago',
          },
        ],
        unsubscribeUrl: 'https://209.works/unsubscribe',
        viewAllJobsUrl: 'https://209.works/jobs',
      },
    });

    this.registerTemplate({
      id: 'welcome-job-seeker',
      name: 'Welcome Job Seeker',
      description: 'Welcome new job seekers to the 209 Works platform',
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
      id: 'application-confirmation',
      name: 'Application Confirmation',
      description: 'Confirms successful job application submission',
      category: 'job_seeker',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        userName: 'Job Seeker',
        jobTitle: 'Software Developer',
        companyName: 'Tech Company',
        applicationDate: new Date().toLocaleDateString(),
        jobUrl: 'https://209.works/jobs/123',
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
      id: 'application-status-accepted',
      name: 'Application Status – Accepted',
      description: 'Congratulatory email when candidate is accepted',
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
        personalizedMessage: 'We are thrilled to offer you the Marketing Manager position! Your innovative approach to digital marketing and understanding of the Central Valley market make you perfect for our team.',
        nextSteps: 'Our HR team will contact you within 24 hours with your offer letter and next steps. We\'re excited to have you join our growing team!',
        contactEmail: 'hr@cvmarketing.com',
        hrName: 'Jennifer Thompson',
      },
    });

    this.registerTemplate({
      id: 'application-status-rejected',
      name: 'Application Status – Rejected',
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

    // Employer Templates
    this.registerTemplate({
      id: 'welcome-employer',
      name: 'Welcome Employer',
      description: 'Welcome new employers to the 209 Works platform',
      category: 'employer',
      component: WelcomeEmployerEmail,
      defaultProps: {
        companyName: 'Your Company',
        contactName: 'Hiring Manager',
        loginUrl: 'https://209.works/employers/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
      },
      requiredProps: ['companyName', 'contactName'],
      previewProps: {
        companyName: 'Central Valley Tech Solutions',
        contactName: 'Maria Garcia',
        loginUrl: 'https://209.works/employers/signin',
        unsubscribeUrl: 'https://209.works/unsubscribe',
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
      description: 'Confirms successful job posting publication',
      category: 'employer',
      component: this.createSystemNotificationTemplate(),
      defaultProps: {
        employerName: 'Hiring Manager',
        jobTitle: 'Software Developer',
        jobId: 'JOB-123',
        jobUrl: 'https://209.works/jobs/123',
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
      id: 'credit-confirmation',
      name: 'Credit Confirmation',
      description: 'Confirms successful credit purchase and assignment',
      category: 'employer',
      component: CreditConfirmationEmail,
      defaultProps: {
        userName: 'Valued Customer',
        creditAmount: 0,
        planType: 'CREDIT PACK',
        dashboardUrl: 'https://209.works/employers/dashboard',
        expirationDate: null,
      },
      requiredProps: ['userName', 'creditAmount', 'planType', 'dashboardUrl'],
      previewProps: {
        userName: 'Maria Garcia',
        creditAmount: 5,
        planType: 'STANDARD PLAN',
        dashboardUrl: 'https://209.works/employers/dashboard',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    });

    this.registerTemplate({
      id: 'interview-invitation',
      name: 'Interview Invitation',
      description: 'Professional interview invitation with all necessary details',
      category: 'employer',
      component: InterviewInvitationEmail,
      defaultProps: {
        candidateName: 'Candidate',
        jobTitle: 'Position',
        companyName: 'Company',
        interviewDate: 'Monday, January 15, 2024',
        interviewTime: '2:00 PM PST',
        interviewType: 'in-person',
        interviewerName: 'Hiring Manager',
        interviewerTitle: 'Department Head',
        interviewDuration: '45 minutes',
        contactEmail: 'hr@company.com',
        confirmationRequired: true,
      },
      requiredProps: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime'],
      previewProps: {
        candidateName: 'Alex Rodriguez',
        jobTitle: 'Marketing Manager',
        companyName: 'Central Valley Growth Partners',
        interviewDate: 'Wednesday, January 24, 2024',
        interviewTime: '2:00 PM PST',
        interviewType: 'in-person',
        location: '1234 Main Street, Modesto, CA 95354',
        interviewerName: 'Jennifer Thompson',
        interviewerTitle: 'Marketing Director',
        interviewDuration: '60 minutes',
        specialInstructions: 'Please bring a portfolio of your recent marketing campaigns and be prepared to discuss your experience with Central Valley market demographics.',
        contactEmail: 'jennifer@cvgrowth.com',
        confirmationRequired: true,
        confirmationDeadline: 'Monday, January 22, 2024',
      },
    });

    // System Templates
    this.registerTemplate({
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Secure password reset instructions with security tips',
      category: 'system',
      component: PasswordResetEmail,
      defaultProps: {
        userName: 'User',
        resetUrl: '#',
      },
      requiredProps: ['userName', 'resetUrl'],
      previewProps: {
        userName: 'Maria Garcia',
        resetUrl: 'https://209.works/reset-password?token=abc123def456',
      },
    });

    this.registerTemplate({
      id: 'platform-notice',
      name: 'Platform Notice',
      description: 'Important platform notices and system updates (formerly System Notification)',
      category: 'system',
      component: PlatformNoticeEmail,
      defaultProps: {
        recipientName: 'User',
        noticeType: 'general',
        title: 'Platform Notice',
        message: 'This is an important notice from 209 Works.',
        urgencyLevel: 'medium',
        actionRequired: false,
        supportUrl: 'https://209.works/contact',
      },
      requiredProps: ['title', 'message'],
      previewProps: {
        recipientName: 'Alex Rodriguez',
        noticeType: 'maintenance',
        title: 'Scheduled Maintenance Tonight',
        message: 'We will be performing scheduled maintenance on our servers tonight from 2:00 AM to 4:00 AM PST. During this time, the platform may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience as we work to improve our service.',
        urgencyLevel: 'medium',
        actionRequired: false,
        effectiveDate: 'Tonight, 2:00 AM - 4:00 AM PST',
        supportUrl: 'https://209.works/contact',
      },
    });

    // Marketing Templates
    this.registerTemplate({
      id: 'company-newsletter',
      name: 'Company Newsletter',
      description: 'Monthly newsletter with Central Valley job market insights',
      category: 'marketing',
      component: CompanyNewsletterEmail,
      defaultProps: {
        recipientName: 'Subscriber',
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
          content: 'The Central Valley is experiencing unprecedented growth in the technology sector. With major companies establishing offices in Modesto, Stockton, and Fresno, job opportunities for tech professionals have increased by 35% this year. From software development to data analytics, the 209 area is becoming a hub for innovation and career growth.',
          ctaText: 'Explore Tech Jobs',
          ctaUrl: 'https://209.works/jobs?category=technology',
        },
        newsItems: [
          {
            title: 'Healthcare Hiring Surge in Central Valley',
            summary: 'Major hospitals and clinics are expanding, creating 200+ new positions across nursing, administration, and support roles.',
            url: 'https://209.works/news/healthcare-hiring-surge',
            date: 'January 15, 2024',
          },
          {
            title: 'Manufacturing Renaissance in Stockton',
            summary: 'New manufacturing facilities are bringing hundreds of well-paying jobs to the Stockton area, with more planned for 2024.',
            url: 'https://209.works/news/manufacturing-stockton',
            date: 'January 12, 2024',
          },
        ],
        unsubscribeUrl: 'https://209.works/unsubscribe',
        webViewUrl: 'https://209.works/newsletter/january-2024',
      },
    });
  }

  /**
   * Create a simple system notification template for basic notifications
   */
  private createSystemNotificationTemplate() {
    return (props: any) => {
      const { 
        userName, 
        jobTitle, 
        companyName, 
        applicationDate, 
        jobUrl,
        employerName,
        applicantName,
        applicantEmail,
        dashboardUrl,
        jobId 
      } = props;

      let content = '';

      if (userName && jobTitle && companyName) {
        // Application confirmation
        content = `
          <h2 style="color: #2d4a3e;">✅ Application Confirmed!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!</p>
          <p><strong>Application submitted:</strong> ${applicationDate || new Date().toLocaleDateString()}</p>
          <p>We've received your application and will review it carefully. You'll hear back from the employer soon.</p>
          ${jobUrl ? `<p><a href="${jobUrl}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Posting</a></p>` : ''}
          <p style="margin-top: 24px;">Keep applying to increase your chances! Browse more opportunities on 209 Works.</p>
        `;
      } else if (employerName && applicantName && jobTitle) {
        // New applicant notification
        content = `
          <h2 style="color: #2d4a3e;">🎉 New Application Received</h2>
          <p>Hi ${employerName},</p>
          <p>Great news! You have received a new application for the <strong>${jobTitle}</strong> position.</p>
          <p><strong>Applicant:</strong> ${applicantName}</p>
          <p><strong>Email:</strong> ${applicantEmail}</p>
          <p><strong>Applied on:</strong> ${applicationDate || new Date().toLocaleDateString()}</p>
          ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Application</a></p>` : ''}
          <p style="margin-top: 24px;">Don't keep great candidates waiting! Review and respond promptly to attract top talent.</p>
        `;
      } else if (employerName && jobTitle && jobId) {
        // Job posting confirmation
        content = `
          <h2 style="color: #2d4a3e;">🚀 Job Posted Successfully!</h2>
          <p>Hi ${employerName},</p>
          <p>Your job posting for <strong>${jobTitle}</strong> has been successfully published on 209 Works!</p>
          <p><strong>Job ID:</strong> ${jobId}</p>
          <p>Your posting is now live and visible to thousands of qualified candidates in the Central Valley.</p>
          ${jobUrl ? `<p><a href="${jobUrl}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Posting</a></p>` : ''}
          ${dashboardUrl ? `<p><a href="${dashboardUrl}" style="color: #ff6b35; text-decoration: underline;">Manage Your Jobs</a></p>` : ''}
          <p style="margin-top: 24px;">Tip: Jobs with detailed descriptions and competitive benefits get 40% more applications!</p>
        `;
      }

      return React.createElement('div', {
        style: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          style: {
            backgroundColor: '#2d4a3e',
            background: 'linear-gradient(135deg, #2d4a3e 0%, #1e3329 100%)',
            padding: '32px 24px',
            textAlign: 'center',
          }
        }, [
          React.createElement('div', {
            key: 'logo',
            style: { color: '#9fdf9f', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }
          }, '209 Works'),
          React.createElement('div', {
            key: 'tagline',
            style: { color: '#ffffff', fontSize: '16px', margin: '0' }
          }, 'Your Central Valley Job Platform')
        ]),

        // Content
        React.createElement('div', {
          key: 'content',
          style: { padding: '32px 24px' }
        }, [
          React.createElement('div', {
            key: 'main-content',
            dangerouslySetInnerHTML: { __html: content }
          }),
          React.createElement('div', {
            key: 'help-section',
            style: {
              marginTop: '32px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
            }
          }, [
            React.createElement('div', {
              key: 'help-title',
              style: { color: '#2d4a3e', fontWeight: '600' }
            }, 'Questions? We\'re here to help! 🤝'),
            React.createElement('div', {
              key: 'help-contact',
              style: { color: '#166534', fontSize: '14px', marginTop: '4px' }
            }, 'Contact us at support@209.works')
          ])
        ]),

        // Footer
        React.createElement('div', {
          key: 'footer',
          style: {
            backgroundColor: '#f8fafc',
            padding: '24px',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
          }
        }, React.createElement('div', {
          style: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' }
        }, [
          `© ${new Date().getFullYear()} 209 Works. All rights reserved.`,
          React.createElement('br'),
          'Proudly serving the Central Valley with local job opportunities.'
        ]))
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
            ${Object.keys(this.templates).map(id => `<li>${id}</li>`).path.join('')}
          </ul>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is a preview message from 209 Works Email System</p>
        </div>
      `;

      return {
        html: fallbackHtml,
        subject: `Template Not Found: ${templateId}`,
        text: `Template "${templateId}" not found. Available templates: ${Object.keys(this.templates).path.join(', ')}`
      };
    }

    // Validate required props
    const missingProps = template.requiredProps.filter(prop => !(prop in props));
    if (missingProps.length > 0) {
      throw new Error(`Missing required props: ${missingProps.path.join(', ')}`);
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
      case 'platform-notice':
        return props.title || 'Platform Notice from 209 Works';
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

// Create and export singleton instance
export const templateManager = new TemplateManager();
