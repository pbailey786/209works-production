import { prisma } from '@/lib/database/prisma';
import { JobMatchingService } from './job-matching';
import path from "path";


export interface EmailJobMatch {
  jobId: string;
  userId: string;
  score: number;
  matchReason: string[];
  user: {
    name: string | null;
    email: string;
    location: string | null;
  };
  job: {
    title: string;
    company: string;
    location: string;
    description: string;
    salaryMin: number | null;
    salaryMax: number | null;
    jobType: string;
  };
}

export class FeaturedJobEmailService {
  private static readonly BATCH_SIZE = 50;
  private static readonly MAX_EMAILS_PER_HOUR = 100;
  private static readonly MIN_SCORE_FOR_EMAIL = 80;

  /**
   * Send personalized job match emails for a featured job
   */
  static async sendJobMatchEmails(jobId: string): Promise<{
    success: boolean;
    emailsSent: number;
    errors: string[];
  }> {
    try {
      console.log(`📧 Starting email campaign for featured job: ${jobId}`);

      // Get high-scoring matches that haven't been emailed yet
      const matches = await this.getUnsentMatches(jobId);
      
      if (matches.length === 0) {
        console.log(`ℹ️ No unsent matches found for job: ${jobId}`);
        return { success: true, emailsSent: 0, errors: [] };
      }

      // Check rate limits
      const canSend = await this.checkRateLimit(matches.length);
      if (!canSend.allowed) {
        console.log(`⚠️ Rate limit exceeded, can only send ${canSend.maxAllowed} emails`);
        // Trim matches to fit rate limit
        matches.splice(canSend.maxAllowed);
      }

      console.log(`📬 Sending emails to ${matches.length} matched candidates`);

      // Send emails in batches
      const results = await this.sendEmailBatch(matches);

      // Mark emails as sent
      const userIds = results.successful.map(result => result.userId);
      if (userIds.length > 0) {
        await JobMatchingService.markEmailSent(jobId, userIds);
      }

      console.log(`✅ Email campaign completed: ${results.successful.length} sent, ${results.failed.length} failed`);

      return {
        success: true,
        emailsSent: results.successful.length,
        errors: results.failed.map(f => f.error)
      };

    } catch (error) {
      console.error(`❌ Failed to send job match emails for ${jobId}:`, error);
      return {
        success: false,
        emailsSent: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get unsent high-scoring matches for a job
   */
  private static async getUnsentMatches(jobId: string): Promise<EmailJobMatch[]> {
    const matches = await prisma.jobMatch.findMany({
      where: {
        jobId,
        score: {
          gte: this.MIN_SCORE_FOR_EMAIL
        },
        emailSent: false,
        job: {
          featured: true,
          status: 'active'
        },
        user: {
          isActive: true,
          deletedAt: null,
          jobSeekerProfile: {
            optInEmailAlerts: true
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            location: true
          }
        },
        job: {
          select: {
            title: true,
            company: true,
            location: true,
            description: true,
            salaryMin: true,
            salaryMax: true,
            jobType: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    return matches.map(match => ({
      jobId: match.jobId,
      userId: match.userId,
      score: match.score,
      matchReason: match.matchReason,
      user: match.user,
      job: match.job
    }));
  }

  /**
   * Check if we can send emails without exceeding rate limits
   */
  private static async checkRateLimit(requestedCount: number): Promise<{
    allowed: boolean;
    maxAllowed: number;
  }> {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count emails sent in the last hour
    const recentEmailCount = await prisma.jobMatch.count({
      where: {
        emailSent: true,
        emailSentAt: {
          gte: hourAgo
        }
      }
    });

    const remainingQuota = Math.max(0, this.MAX_EMAILS_PER_HOUR - recentEmailCount);
    const allowedCount = Math.min(requestedCount, remainingQuota);

    return {
      allowed: allowedCount === requestedCount,
      maxAllowed: allowedCount
    };
  }

  /**
   * Send a batch of emails
   */
  private static async sendEmailBatch(matches: EmailJobMatch[]): Promise<{
    successful: Array<{ userId: string; messageId?: string }>;
    failed: Array<{ userId: string; error: string }>;
  }> {
    const successful: Array<{ userId: string; messageId?: string }> = [];
    const failed: Array<{ userId: string; error: string }> = [];

    // Process in smaller batches to avoid overwhelming the email service
    for (let i = 0; i < matches.length; i += this.BATCH_SIZE) {
      const batch = matches.slice(i, i + this.BATCH_SIZE);
      
      // Send emails concurrently within the batch
      const batchPromises = batch.map(async (match) => {
        try {
          const messageId = await this.sendSingleEmail(match);
          successful.push({ userId: match.userId, messageId });
        } catch (error) {
          failed.push({
            userId: match.userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.allSettled(batchPromises);

      // Small delay between batches to be respectful to email service
      if (i + this.BATCH_SIZE < matches.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { successful, failed };
  }

  /**
   * Send a single personalized email
   */
  private static async sendSingleEmail(match: EmailJobMatch): Promise<string> {
    const emailContent = this.generateEmailContent(match);
    
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log(`📧 Sending AI job match email to ${match.user.email} for job: ${match.job.title}`);

      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'jobs@209works.com',
        to: match.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        headers: {
          'X-Job-Match-Score': match.score.toString(),
          'X-Job-ID': match.jobId,
          'X-User-ID': match.userId,
          'X-Match-Type': 'ai_featured',
          'X-Email-Type': 'job_match_alert'
        },
        tags: [
          { name: 'type', value: 'job_match' },
          { name: 'score', value: Math.round(match.score).toString() },
          { name: 'job_id', value: match.jobId }
        ]
      });

      if (!result.data?.id) {
        throw new Error('Failed to get email ID from Resend response');
      }

      console.log(`✅ Email sent successfully: ${result.data.id}`);
      return result.data.id;

    } catch (error) {
      console.error(`❌ Failed to send email to ${match.user.email}:`, error);
      throw error;
    }
  }

  /**
   * Generate personalized email content
   */
  private static generateEmailContent(match: EmailJobMatch): {
    subject: string;
    preview: string;
    html: string;
    text: string;
  } {
    const { user, job, score, matchReason } = match;
    const firstName = user.name?.split(' ')[0] || 'there';
    
    // Create tracking URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://209works.com';
    const jobUrl = `${baseUrl}/api/email/track?action=click&job_id=${match.jobId}&user_id=${match.userId}`;
    const unsubscribeUrl = `${baseUrl}/api/email-alerts/unsubscribe?user_id=${match.userId}`;
    const trackingPixelUrl = `${baseUrl}/api/email/track?action=open&job_id=${match.jobId}&user_id=${match.userId}`;

    // Generate match score description
    const getScoreDescription = (score: number): string => {
      if (score >= 95) return 'exceptional match';
      if (score >= 90) return 'strong match';
      if (score >= 85) return 'good match';
      return 'decent match';
    };

    // Format salary
    const formatSalary = (): string => {
      if (job.salaryMin && job.salaryMax) {
        return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
      }
      if (job.salaryMin) return `From $${job.salaryMin.toLocaleString()}`;
      if (job.salaryMax) return `Up to $${job.salaryMax.toLocaleString()}`;
      return '';
    };

    const subject = `${firstName}, we found a ${getScoreDescription(score)} for you: ${job.title} at ${job.company}`;
    const preview = `AI matched you with ${job.title} at ${job.company} (${Math.round(score)}% match)`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2d4a3e, #1d3a2e); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .match-badge { background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 10px; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .job-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 20px 0; }
    .job-title { font-size: 24px; font-weight: bold; color: #2d4a3e; margin: 0 0 8px 0; }
    .company { font-size: 18px; color: #666; margin: 0 0 16px 0; }
    .job-details { display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0; }
    .detail-item { background: white; padding: 8px 12px; border-radius: 4px; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #ff6b35, #e85a2b); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; margin: 20px 0; text-align: center; box-shadow: 0 4px 12px rgba(255,107,53,0.3); }
    .match-reasons { background: #e8f5e8; border-left: 4px solid #4caf50; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .unsubscribe { color: #999; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Perfect Job Match Found!</h1>
      <p>Hi ${firstName}! Our AI found a job that matches your profile perfectly.</p>
      <div class="match-badge">${Math.round(score)}% Match Score</div>
    </div>
    
    <div class="content">
      <div class="job-card">
        <h2 class="job-title">${job.title}</h2>
        <p class="company">📍 ${job.company} • ${job.location}</p>
        
        <div class="job-details">
          <span class="detail-item">💼 ${job.jobType.replace('_', ' ')}</span>
          ${formatSalary() ? `<span class="detail-item">💰 ${formatSalary()}</span>` : ''}
        </div>
        
        <p>${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</p>
        
        <a href="${jobUrl}" class="cta-button">View Job & Apply Now</a>
      </div>
      
      ${matchReason.length > 0 ? `
      <div class="match-reasons">
        <h3>🤖 Why This Job Matches You:</h3>
        <ul>
          ${matchReason.map(reason => {
            const reasonText = {
              'skills_match': '✅ Your skills align with job requirements',
              'experience_match': '💼 Your experience level fits this role',
              'location_match': '📍 Job location matches your preferences',
              'title_match': '🎯 Similar to roles you\'ve held before',
              'industry_experience': '🏢 You have relevant industry experience',
              'ai_similarity': '🤖 AI detected strong overall compatibility'
            }[reason] || `✨ ${reason.replace('_', ' ')}`;
            return `<li>${reasonText}</li>`;
          }).path.join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>⚡ Featured Job Alert:</strong> This employer invested in premium placement to reach top candidates like you. Apply soon - featured jobs typically get filled quickly!</p>
      </div>
      
      <p style="margin-top: 30px;"><strong>Pro tip:</strong> Mention that you heard about this role through 209 Works' AI matching system when you apply - employers love candidates who are proactive about finding the right fit!</p>
    </div>
    
    <div class="footer">
      <p>This email was sent because you opted in to receive AI-matched job alerts.</p>
      <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from job alerts</a></p>
      <p>© 2024 209 Works - Connecting Central Valley talent with opportunity</p>
    </div>
  </div>
  
  <!-- Email tracking pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>
    `;

    const text = `
Hi ${firstName}!

🎯 Perfect Job Match Found! (${Math.round(score)}% match)

${job.title} at ${job.company}
📍 Location: ${job.location}
💼 Type: ${job.jobType.replace('_', ' ')}
${formatSalary() ? `💰 Salary: ${formatSalary()}` : ''}

${job.description.substring(0, 300)}${job.description.length > 300 ? '...' : ''}

Why this job matches you:
${matchReason.map(reason => `• ${reason.replace('_', ' ')}`).path.join('\n')}

Apply now: ${jobUrl}

This is a featured job, which means the employer invested in premium placement to reach top candidates like you. Apply soon!

---
Unsubscribe: ${unsubscribeUrl}
© 2024 209 Works
    `;

    return { subject, preview, html, text };
  }

  /**
   * Get email campaign statistics
   */
  static async getEmailCampaignStats(jobId: string) {
    const stats = await prisma.jobMatch.aggregate({
      where: { jobId },
      _count: {
        id: true
      },
      _avg: {
        score: true
      }
    });

    const emailStats = await prisma.jobMatch.groupBy({
      by: ['emailSent', 'emailOpened', 'emailClicked'],
      where: { jobId },
      _count: true
    });

    return {
      totalMatches: stats._count.id,
      averageScore: stats._avg.score,
      emailStats
    };
  }
}