# Email Queue System Documentation

## Overview

The Email Queue System is a robust, production-ready solution for managing high-volume email sending with rate limiting, retry mechanisms, and comprehensive monitoring. Built using BullMQ and Redis, it provides reliable email delivery with proper error handling and logging.

## Architecture

### Core Components

1. **EmailQueueService** (`src/lib/services/email-queue.ts`)

   - Singleton service managing the email queue
   - Handles job creation, processing, and monitoring
   - Provides helper methods for common email types

2. **Email Queue API** (`src/app/api/email-queue/route.ts`)

   - REST API for queue management and monitoring
   - Supports adding jobs, bulk operations, and queue control
   - Secured with admin authentication

3. **Cron Integration**
   - Updated cron jobs to use the queue system
   - Seamless integration with existing email alert and digest systems

## Features

### Rate Limiting & Concurrency

- **Rate Limit**: 10 emails per minute (configurable)
- **Concurrency**: 5 concurrent email processing workers
- **Backoff Strategy**: Exponential backoff for retries (starting at 2 seconds)

### Job Management

- **Priority System**: Critical, High, Normal, Low priority levels
- **Retry Logic**: Up to 3 retry attempts with exponential backoff
- **Job Persistence**: Keeps last 100 completed jobs and 50 failed jobs
- **Bulk Operations**: Support for adding multiple jobs at once

### Monitoring & Logging

- **Queue Statistics**: Real-time monitoring of queue status
- **Email Logging**: Comprehensive logging to database
- **Event Listeners**: Detailed logging of job lifecycle events
- **Health Checks**: Built-in health monitoring

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# OR for Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_url

# Alternative Redis settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Admin access for queue management
ADMIN_SECRET=your_admin_secret
CRON_SECRET=your_cron_secret
```

### Queue Configuration

```typescript
const QUEUE_CONFIG = {
  name: 'email-queue',
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  limiter: {
    max: 10, // Max 10 emails per minute
    duration: 60 * 1000,
  },
};
```

## Usage

### Basic Email Job

```typescript
import { emailQueue } from '@/lib/services/email-queue';

const job = await emailQueue.addEmailJob({
  type: 'generic',
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome-email',
  data: {
    userName: 'John Doe',
    // ... template data
  },
  priority: 'normal',
  metadata: {
    campaign: 'onboarding',
  },
});
```

### Job Alert Email (Helper Method)

```typescript
const job = await emailQueue.addJobAlertEmail(
  'user@example.com',
  'John Doe',
  matchingJobs,
  'alert-id',
  'user-id',
  'high' // priority
);
```

### Weekly Digest Email (Helper Method)

```typescript
const job = await emailQueue.addWeeklyDigestEmail(
  'user@example.com',
  'John Doe',
  weeklyJobs,
  '209 Area',
  'user-id',
  'normal' // priority
);
```

### Bulk Job Addition

```typescript
const jobs = await emailQueue.addBulkEmailJobs([
  {
    data: {
      type: 'job_alert',
      to: 'user1@example.com',
      // ... job data
    },
    options: {
      priority: 75,
      delay: 5000, // 5 second delay
    },
  },
  // ... more jobs
]);
```

## API Endpoints

### GET /api/email-queue

Get queue statistics and health status.

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_SECRET
```

**Response:**

```json
{
  "message": "Email queue status",
  "data": {
    "stats": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "delayed": 1,
      "paused": 0
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "queueName": "email-queue",
    "isHealthy": true
  }
}
```

### POST /api/email-queue

Add email job(s) to the queue.

**Single Job:**

```json
{
  "type": "job_alert",
  "to": "user@example.com",
  "subject": "New Job Alert",
  "template": "job-alert",
  "data": {
    "userName": "John Doe",
    "jobTitle": "Software Engineer"
  },
  "priority": "normal"
}
```

**Bulk Jobs:**

```json
{
  "jobs": [
    {
      "data": {
        "type": "job_alert",
        "to": "user1@example.com"
        // ... job data
      },
      "options": {
        "priority": 75,
        "delay": 1000
      }
    }
  ]
}
```

### POST /api/email-queue?action=pause

Pause the email queue.

### POST /api/email-queue?action=resume

Resume the email queue.

### POST /api/email-queue?action=clear

Clear all jobs from the queue.

### DELETE /api/email-queue

Gracefully close the queue system.

## NPM Scripts

```bash
# Queue Management
npm run queue:status    # Get queue statistics
npm run queue:pause     # Pause email processing
npm run queue:resume    # Resume email processing
npm run queue:clear     # Clear all jobs from queue
npm run queue:test      # Run comprehensive queue tests

# Cron Management (includes queue integration)
npm run cron:start      # Start cron scheduler
npm run cron:stop       # Stop cron scheduler
npm run cron:status     # Get cron status
npm run cron:test       # Test cron jobs
```

## Email Templates

The system supports multiple email templates:

### Job Alert Template

- **Template ID**: `job-alert`
- **Component**: `JobAlertEmail`
- **Data Requirements**:
  ```typescript
  {
    userName: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salary: string;
    jobType: string;
    description: string;
    jobUrl: string;
    unsubscribeUrl: string;
    additionalJobsCount: number;
    totalMatchingJobs: number;
  }
  ```

### Weekly Digest Template

- **Template ID**: `weekly-digest`
- **Component**: `WeeklyDigestEmail`
- **Data Requirements**:
  ```typescript
  {
    userName: string;
    jobs: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      salary?: string;
      jobType: string;
      postedDate: string;
      url: string;
    }>;
    location: string;
    unsubscribeUrl: string;
    manageAlertsUrl: string;
  }
  ```

## Error Handling

### Retry Logic

- **Max Attempts**: 3 retries per job
- **Backoff Strategy**: Exponential (2s, 4s, 8s)
- **Failed Job Storage**: Last 50 failed jobs kept for analysis

### Error Types

1. **Email Service Errors**: Resend API failures
2. **Template Errors**: Missing or invalid templates
3. **Database Errors**: Logging failures
4. **Unsubscribe Checks**: User preference validation

### Monitoring

- All errors logged to console with job context
- Failed jobs stored in Redis for analysis
- Email logs created in database for tracking

## Performance Considerations

### Scalability

- **Horizontal Scaling**: Multiple workers can process the same queue
- **Redis Clustering**: Supports Redis cluster for high availability
- **Rate Limiting**: Prevents overwhelming email services

### Memory Management

- **Job Cleanup**: Automatic removal of old completed/failed jobs
- **Connection Pooling**: Efficient Redis connection management
- **Lazy Loading**: Queue initialization on first use

## Security

### Authentication

- Admin endpoints protected with bearer token authentication
- Environment-based secret management
- Separate secrets for different environments

### Data Protection

- Email addresses handled securely
- Unsubscribe token validation
- Metadata sanitization

## Testing

### Test Script

Run comprehensive tests with:

```bash
npm run queue:test
```

### Test Coverage

- Queue initialization and connection
- Single and bulk job addition
- Helper method functionality
- Queue management operations
- Statistics and monitoring
- Graceful shutdown

### Manual Testing

```bash
# Check queue status
curl -H "Authorization: Bearer $ADMIN_SECRET" http://localhost:3000/api/email-queue

# Add test job
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"generic","to":"test@example.com","subject":"Test","template":"job-alert","data":{}}' \
  http://localhost:3000/api/email-queue
```

## Production Deployment

### Prerequisites

1. Redis instance (local or cloud-based like Upstash)
2. Environment variables configured
3. Email service (Resend) configured

### Deployment Steps

1. Install dependencies: `npm install`
2. Set environment variables
3. Start the application: `npm start`
4. Queue workers start automatically

### Monitoring

- Monitor queue statistics via API
- Check email logs in database
- Set up alerts for failed jobs
- Monitor Redis memory usage

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**

   - Check Redis URL and credentials
   - Verify Redis server is running
   - Check network connectivity

2. **Jobs Not Processing**

   - Verify queue is not paused
   - Check worker initialization
   - Review error logs

3. **High Failed Job Count**

   - Check email service configuration
   - Verify template data structure
   - Review rate limiting settings

4. **Memory Issues**
   - Adjust job retention settings
   - Monitor Redis memory usage
   - Consider Redis clustering

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor queue in real-time
npm run queue:status

# Clear problematic jobs
npm run queue:clear

# Restart queue system
npm run cron:stop && npm run cron:start
```

## Future Enhancements

### Planned Features

1. **Dashboard UI**: Web interface for queue monitoring
2. **Email Analytics**: Open/click tracking integration
3. **Template Management**: Dynamic template system
4. **Advanced Scheduling**: Timezone-aware scheduling
5. **Webhook Support**: External service notifications

### Performance Optimizations

1. **Batch Processing**: Group similar emails
2. **Smart Retry**: Adaptive retry strategies
3. **Load Balancing**: Intelligent worker distribution
4. **Caching**: Template and data caching

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review error logs and queue statistics
3. Test with the provided test script
4. Verify configuration and environment variables

---

_Last Updated: January 2024_
_Version: 1.0.0_
