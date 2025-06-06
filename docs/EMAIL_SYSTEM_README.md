# 📧 209 Works Email System

## Overview

The 209 Works Email System is a comprehensive, secure, and scalable email management solution built with Resend and React Email. It provides a complete email infrastructure with admin dashboard controls, template management, campaign automation, and detailed analytics.

## 🏗️ Architecture

### Core Components

1. **Email Agent** (`src/lib/agents/email-agent.ts`)
   - Direct communication with Resend API
   - Email sending, tracking, and error handling
   - Bulk email processing with rate limiting
   - Security validation and logging

2. **Template Manager** (`src/lib/email/template-manager.ts`)
   - React Email template registration and management
   - Template rendering with props validation
   - Preview generation and template lookup
   - Support for multiple template categories

3. **Email Service** (`src/lib/email/email-service.ts`)
   - High-level service for sending templated emails
   - Campaign management and execution
   - Bulk email operations with batching
   - Integration with Agent and Template Manager

4. **Email Helpers** (`src/lib/email/email-helpers.ts`)
   - Specialized functions for common email scenarios
   - Job seeker emails: alerts, confirmations, digests
   - Employer emails: applicant notifications, job confirmations
   - System emails: welcome, password reset, notifications

## 📧 Email Templates

### Job Seeker Templates
- **Job Alert** (`job-alert-email.tsx`) - New job match notifications
- **Weekly Digest** (`weekly-digest-email.tsx`) - Weekly job summaries
- **Application Confirmation** - Job application confirmations

### Employer Templates
- **New Applicant Alert** - New application notifications
- **Job Posting Confirmation** - Job posting confirmations

### System Templates
- **Welcome Email** (`welcome-email.tsx`) - New user onboarding
- **Password Reset** (`password-reset-email.tsx`) - Password reset instructions

## 🎛️ Admin Dashboard

### Email Management Dashboard (`/admin/email`)
- **Overview Metrics** - Total sent, delivery rates, open rates, click rates
- **System Status** - Email service health, queue status, configuration
- **Quick Actions** - Test emails, manage templates, view campaigns
- **Real-time Monitoring** - Active campaigns, failed deliveries, queue processing

### Template Management (`/admin/email/templates`)
- **Template Library** - Browse all available templates
- **Category Filtering** - Filter by job_seeker, employer, system, marketing
- **Template Editor** - Visual template customization (planned)
- **Usage Analytics** - Template usage statistics and performance

### Campaign Management (`/admin/email/campaigns`)
- **Campaign Overview** - All campaigns with status and metrics
- **Campaign Creation** - Create new email campaigns
- **Performance Tracking** - Open rates, click rates, delivery metrics
- **Scheduling** - Schedule campaigns for future delivery

### Test Email Interface (`/admin/email/test`)
- **Template Testing** - Send test emails using any template
- **Configuration Testing** - Verify email system configuration
- **Multiple Test Types** - Job alerts, digests, welcome emails, etc.
- **Custom Properties** - Override template props for testing

## 🔧 API Endpoints

### Admin Email APIs
- `POST /api/admin/email/test` - Send test emails
- `GET /api/admin/email/test` - Get available test types and templates
- `POST /api/admin/email/send` - Send emails to multiple recipients
- `GET /api/admin/email/send` - Get email types and templates
- `GET /api/admin/email/status` - Get email system status and health

## 🚀 Usage Examples

### Sending a Job Alert
```typescript
import { EmailHelpers } from '@/lib/email/email-helpers';

await EmailHelpers.sendJobAlert('user@example.com', {
  userName: 'John Doe',
  jobTitle: 'Software Engineer',
  companyName: 'Tech Corp',
  location: 'Modesto, CA',
  salary: '$80,000 - $120,000',
  jobType: 'Full-time',
  description: 'Exciting opportunity...',
  jobUrl: 'https://209.works/jobs/123',
  unsubscribeUrl: 'https://209.works/unsubscribe',
});
```

### Sending Bulk Weekly Digests
```typescript
import { EmailHelpers } from '@/lib/email/email-helpers';

const recipients = [
  { 
    email: 'user1@example.com', 
    data: { userName: 'User 1', jobs: [...] } 
  },
  { 
    email: 'user2@example.com', 
    data: { userName: 'User 2', jobs: [...] } 
  },
];

await EmailHelpers.sendBulkWeeklyDigests(recipients, {
  batchSize: 50,
  delayBetweenBatches: 2000,
});
```

### Using Email Service Directly
```typescript
import { emailService } from '@/lib/email/email-service';

await emailService.sendTemplatedEmail(
  'welcome-email',
  'newuser@example.com',
  { userName: 'New User', userType: 'job_seeker' },
  { priority: 'high' }
);
```

## 🔒 Security Features

- **Email Validation** - Comprehensive email address validation
- **Content Sanitization** - HTML content sanitization for security
- **Rate Limiting** - Built-in rate limiting for bulk operations
- **Security Headers** - Secure email headers generation
- **Audit Logging** - Complete audit trail for all email operations
- **Permission-based Access** - RBAC integration for admin features

## 📊 Analytics & Monitoring

### Email Metrics
- **Delivery Rates** - Track successful email deliveries
- **Open Rates** - Monitor email open rates by template
- **Click Rates** - Track link clicks and engagement
- **Bounce Rates** - Monitor bounced emails and failures
- **Unsubscribe Rates** - Track unsubscribe patterns

### System Health
- **Service Status** - Real-time email service health monitoring
- **Queue Monitoring** - Track email queue processing
- **Error Tracking** - Monitor and alert on email failures
- **Performance Metrics** - Email processing times and throughput

## 🛠️ Configuration

### Environment Variables
```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_EMAIL_FROM=noreply@209.works
ALERT_EMAIL_FROM=alerts@209.works
EMPLOYER_EMAIL_FROM=employers@209.works
SUPPORT_EMAIL=support@209.works
```

### Email Configuration
- **Provider**: Resend
- **Rate Limits**: 1,000 emails/hour, 10,000 emails/day
- **Batch Size**: 50 emails per batch
- **Retry Logic**: 3 attempts with exponential backoff
- **Queue Processing**: Background job processing with Redis

## 🔄 Integration Points

### Existing Systems
- **User Authentication** - Integrated with NextAuth.js
- **Job Alerts** - Connected to job alert system
- **User Management** - Integrated with user profiles
- **Analytics** - Connected to platform analytics

### External Services
- **Resend API** - Email delivery service
- **Redis** - Queue management and caching
- **Database** - Email logs and campaign data
- **Security Monitor** - Audit logging and security events

## 🚀 Getting Started

1. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   # Add your Resend API key and email configuration
   ```

2. **Test Email Configuration**
   - Visit `/admin/email/test`
   - Send a configuration test email
   - Verify email delivery

3. **Explore Templates**
   - Visit `/admin/email/templates`
   - Preview available templates
   - Test template rendering

4. **Send Test Emails**
   - Use the test interface to send sample emails
   - Verify template rendering and delivery
   - Check email formatting across devices

## 📈 Future Enhancements

- **Visual Template Editor** - Drag-and-drop template builder
- **A/B Testing** - Template and subject line testing
- **Advanced Segmentation** - User-based email segmentation
- **Webhook Integration** - Real-time delivery status updates
- **Email Automation** - Trigger-based email sequences
- **Advanced Analytics** - Detailed engagement analytics

## 🐛 Troubleshooting

### Common Issues
1. **Email Not Sending**
   - Check Resend API key configuration
   - Verify FROM email address is verified in Resend
   - Check rate limits and quotas

2. **Template Rendering Errors**
   - Validate template props
   - Check React Email component syntax
   - Review error logs in admin dashboard

3. **High Bounce Rates**
   - Validate email addresses before sending
   - Check email content for spam triggers
   - Review sender reputation

### Support
- **Admin Dashboard**: `/admin/email` for system status
- **Test Interface**: `/admin/email/test` for debugging
- **Logs**: Check application logs for detailed error information
- **Documentation**: Refer to Resend documentation for API issues

---

Built with ❤️ for the 209 Works platform
