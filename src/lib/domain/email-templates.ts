import { DomainConfig } from './config';

export interface EmailTemplateData {
  recipientName?: string;
  jobTitle?: string;
  jobUrl?: string;
  companyName?: string;
  unsubscribeUrl?: string;
  manageAlertsUrl?: string;
  jobs?: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    salary?: string;
  }>;
}

export class DomainEmailTemplates {
  constructor(private domainConfig: DomainConfig) {}

  /**
   * Generate job alert email template
   */
  generateJobAlertEmail(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `New ${this.domainConfig.region} Job Alert: ${data.jobTitle} at ${data.companyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${this.domainConfig.branding.primaryColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .job-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${this.domainConfig.branding.primaryColor}; }
            .cta-button { display: inline-block; background: ${this.domainConfig.branding.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.domainConfig.displayName}</h1>
              <p>Your ${this.domainConfig.region} Job Alert</p>
            </div>
            
            <div class="content">
              <h2>New Job Opportunity!</h2>
              <p>Hi ${data.recipientName || 'there'},</p>
              <p>We found a new job in ${this.domainConfig.region} that matches your criteria:</p>
              
              <div class="job-card">
                <h3>${data.jobTitle}</h3>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Location:</strong> ${this.domainConfig.region}</p>
                <a href="${data.jobUrl}" class="cta-button">View Job Details</a>
              </div>
              
              <p>Don't miss out on this opportunity! Apply today.</p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.domainConfig.displayName}. All rights reserved.</p>
              <p>
                <a href="${data.manageAlertsUrl}">Manage Alerts</a> | 
                <a href="${data.unsubscribeUrl}">Unsubscribe</a>
              </p>
              <p>Connecting talent with opportunities in ${this.domainConfig.region}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${this.domainConfig.displayName} - New Job Alert

Hi ${data.recipientName || 'there'},

We found a new job in ${this.domainConfig.region} that matches your criteria:

Job Title: ${data.jobTitle}
Company: ${data.companyName}
Location: ${this.domainConfig.region}

View job details: ${data.jobUrl}

Don't miss out on this opportunity! Apply today.

---
© 2024 ${this.domainConfig.displayName}
Manage Alerts: ${data.manageAlertsUrl}
Unsubscribe: ${data.unsubscribeUrl}
    `;

    return { subject, html, text };
  }

  /**
   * Generate weekly digest email template
   */
  generateWeeklyDigestEmail(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const jobCount = data.jobs?.length || 0;
    const subject = `${jobCount} New Jobs This Week in ${this.domainConfig.region} | ${this.domainConfig.displayName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${this.domainConfig.branding.primaryColor}, ${this.domainConfig.branding.accentColor}); color: white; padding: 30px; text-align: center; }
            .content { padding: 20px; }
            .job-card { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${this.domainConfig.branding.primaryColor}; }
            .job-title { color: ${this.domainConfig.branding.primaryColor}; font-weight: bold; margin-bottom: 5px; }
            .job-meta { color: #666; font-size: 14px; }
            .cta-section { text-align: center; padding: 30px; background: #f8f9fa; margin: 20px 0; }
            .cta-button { display: inline-block; background: ${this.domainConfig.branding.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            .cities { color: ${this.domainConfig.branding.primaryColor}; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.domainConfig.displayName}</h1>
              <h2>Weekly Job Digest</h2>
              <p>${jobCount} new opportunities in ${this.domainConfig.region}</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.recipientName || 'there'},</p>
              <p>Here are the latest job opportunities in <span class="cities">${this.domainConfig.cities.slice(0, 3).join(', ')}</span> and surrounding areas:</p>
              
              ${
                data.jobs
                  ?.map(
                    job => `
                <div class="job-card">
                  <div class="job-title">${job.title}</div>
                  <div class="job-meta">
                    <strong>${job.company}</strong> • ${job.location}
                    ${job.salary ? ` • ${job.salary}` : ''}
                  </div>
                  <a href="${job.url}" style="color: ${this.domainConfig.branding.primaryColor}; text-decoration: none;">View Details →</a>
                </div>
              `
                  )
                  .join('') || '<p>No new jobs this week.</p>'
              }
              
              <div class="cta-section">
                <h3>Looking for more opportunities?</h3>
                <p>Browse all available jobs in ${this.domainConfig.region}</p>
                <a href="https://${this.domainConfig.domain}/jobs" class="cta-button">Browse All Jobs</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>${this.domainConfig.displayName}</strong> - ${this.domainConfig.description}</p>
              <p>Serving ${this.domainConfig.cities.join(', ')} and surrounding areas</p>
              <p>
                <a href="${data.manageAlertsUrl}">Manage Alerts</a> | 
                <a href="${data.unsubscribeUrl}">Unsubscribe</a> |
                <a href="https://${this.domainConfig.domain}">Visit Website</a>
              </p>
              <p>© 2024 ${this.domainConfig.displayName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${this.domainConfig.displayName} - Weekly Job Digest

Hi ${data.recipientName || 'there'},

Here are ${jobCount} new job opportunities in ${this.domainConfig.region}:

${
  data.jobs
    ?.map(
      job => `
• ${job.title} at ${job.company}
  Location: ${job.location}${job.salary ? ` | Salary: ${job.salary}` : ''}
  Apply: ${job.url}
`
    )
    .join('\n') || 'No new jobs this week.'
}

Browse all jobs: https://${this.domainConfig.domain}/jobs

---
${this.domainConfig.displayName} - ${this.domainConfig.description}
Serving ${this.domainConfig.cities.join(', ')} and surrounding areas

Manage Alerts: ${data.manageAlertsUrl}
Unsubscribe: ${data.unsubscribeUrl}
Website: https://${this.domainConfig.domain}
    `;

    return { subject, html, text };
  }

  /**
   * Generate welcome email template
   */
  generateWelcomeEmail(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `Welcome to ${this.domainConfig.displayName} - Your ${this.domainConfig.region} Job Search Starts Here!`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${this.domainConfig.branding.primaryColor}, ${this.domainConfig.branding.accentColor}); color: white; padding: 40px; text-align: center; }
            .content { padding: 30px; }
            .feature-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${this.domainConfig.branding.primaryColor}; }
            .cta-button { display: inline-block; background: ${this.domainConfig.branding.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            .cities { color: ${this.domainConfig.branding.primaryColor}; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${this.domainConfig.displayName}!</h1>
              <p>Your local job search in ${this.domainConfig.region} starts here</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.recipientName || 'there'},</p>
              <p>Welcome to ${this.domainConfig.displayName}! We're excited to help you find your next opportunity in <span class="cities">${this.domainConfig.cities.slice(0, 3).join(', ')}</span> and the greater ${this.domainConfig.region} area.</p>
              
              <div class="feature-box">
                <h3>🎯 Local Focus</h3>
                <p>We specialize in connecting talent with employers specifically in ${this.domainConfig.region}, ensuring you find opportunities close to home.</p>
              </div>
              
              <div class="feature-box">
                <h3>🔔 Smart Alerts</h3>
                <p>Set up job alerts to get notified when new positions matching your criteria are posted in your area.</p>
              </div>
              
              <div class="feature-box">
                <h3>🏢 Local Employers</h3>
                <p>Connect with employers in ${this.domainConfig.cities.join(', ')} who are actively hiring in your field.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://${this.domainConfig.domain}/jobs" class="cta-button">Browse Jobs</a>
                <a href="https://${this.domainConfig.domain}/alerts" class="cta-button">Set Up Alerts</a>
              </div>
              
              <p>Ready to get started? Browse our current job listings or set up personalized job alerts to stay informed about new opportunities.</p>
            </div>
            
            <div class="footer">
              <p><strong>${this.domainConfig.displayName}</strong> - ${this.domainConfig.description}</p>
              <p>Proudly serving ${this.domainConfig.region}</p>
              <p>
                <a href="https://${this.domainConfig.domain}">Visit Website</a> |
                <a href="${data.manageAlertsUrl}">Manage Alerts</a> |
                <a href="${data.unsubscribeUrl}">Unsubscribe</a>
              </p>
              <p>© 2024 ${this.domainConfig.displayName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${this.domainConfig.displayName}!

Hi ${data.recipientName || 'there'},

Welcome to ${this.domainConfig.displayName}! We're excited to help you find your next opportunity in ${this.domainConfig.region}.

What makes us special:

🎯 Local Focus
We specialize in connecting talent with employers specifically in ${this.domainConfig.region}.

🔔 Smart Alerts  
Set up job alerts to get notified when new positions are posted in your area.

🏢 Local Employers
Connect with employers in ${this.domainConfig.cities.join(', ')} who are actively hiring.

Get started:
- Browse Jobs: https://${this.domainConfig.domain}/jobs
- Set Up Alerts: https://${this.domainConfig.domain}/alerts

---
${this.domainConfig.displayName} - ${this.domainConfig.description}
Proudly serving ${this.domainConfig.region}

Website: https://${this.domainConfig.domain}
Manage Alerts: ${data.manageAlertsUrl}
Unsubscribe: ${data.unsubscribeUrl}
    `;

    return { subject, html, text };
  }
}

// Factory function to create domain-specific email templates
export function createDomainEmailTemplates(
  domainConfig: DomainConfig
): DomainEmailTemplates {
  return new DomainEmailTemplates(domainConfig);
}
