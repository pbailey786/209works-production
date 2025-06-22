# Instagram Post Automation System

## Overview

The Instagram Post Automation System is a comprehensive solution for automatically generating, scheduling, and publishing Instagram posts for job listings. The system includes image generation, post scheduling, template management, and API integration capabilities.

## Features

### ✅ Completed Features

1. **Dynamic Image Generation**

   - 4 professional templates (Modern, Classic, Minimal, Gradient)
   - Customizable colors, fonts, and layouts
   - Automatic job data integration
   - High-quality PNG output (1080x1080)

2. **Post Scheduling System**

   - Queue-based scheduling with Redis/BullMQ
   - Automatic retry logic for failed posts
   - Flexible scheduling options
   - Post status tracking (draft, scheduled, published, failed)

3. **Database Models**

   - `InstagramPost` - Individual post records
   - `InstagramTemplate` - Reusable post templates
   - `InstagramSchedule` - Automated posting schedules
   - Full Prisma integration

4. **API Integration Layer**

   - Meta Graph API ready structure
   - Comprehensive error handling
   - Credential validation
   - Analytics data collection

5. **REST API Endpoints**
   - `/api/instagram/posts` - CRUD operations for posts
   - `/api/instagram/posts/[id]` - Individual post management
   - `/api/instagram/generate-image` - Image generation

### 🚧 Pending Features (Requires Meta API Setup)

1. **Analytics and Engagement Tracking**

   - Post performance metrics
   - Engagement analytics dashboard
   - Audience insights

2. **Live Instagram Publishing**
   - Actual Meta Graph API integration
   - Real-time post publishing
   - Media upload to Instagram

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   API Routes    │    │   Services      │
│                 │    │                 │    │                 │
│ - Post Creator  │◄──►│ - Posts CRUD    │◄──►│ - Image Gen     │
│ - Scheduler     │    │ - Image Gen     │    │ - Scheduler     │
│ - Analytics     │    │ - Templates     │    │ - Instagram API │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Queue System  │
                       │                 │    │                 │
                       │ - Posts         │    │ - Redis/BullMQ  │
                       │ - Templates     │    │ - Job Queue     │
                       │ - Schedules     │    │ - Retry Logic   │
                       └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### 1. Dependencies

The following packages have been installed:

```bash
npm install canvas sharp
```

### 2. Database Migration

Run the Prisma migration to create the Instagram tables:

```bash
npx prisma generate
npx prisma db push
```

### 3. Environment Variables

Add to your `.env` file:

```env
# Instagram API (when ready)
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
FACEBOOK_PAGE_ID=your_page_id

# Redis for queue management
REDIS_URL=redis://localhost:6379
```

### 4. Test the System

Run the test script to verify everything works:

```bash
npx ts-node src/scripts/test-instagram-automation.ts
```

## Usage Examples

### 1. Generate an Image

```typescript
import InstagramImageGenerator from '@/lib/services/instagram-image-generator';

const generator = new InstagramImageGenerator();

const jobData = {
  jobTitle: 'Senior Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  salary: '$120,000 - $180,000',
  jobType: 'FULL TIME',
};

const imageBuffer = await generator.generateJobImage(jobData, {
  template: 'modern',
  brandColor: '#3b82f6',
});
```

### 2. Schedule a Post

```typescript
import InstagramScheduler from '@/lib/services/instagram-scheduler';

const scheduler = new InstagramScheduler();

const post = await scheduler.scheduleJobPost(userId, jobId, {
  scheduledAt: new Date('2024-01-15T10:00:00Z'),
  imageOptions: { template: 'gradient' },
});
```

### 3. Create a Template

```typescript
const template = await prisma.instagramTemplate.create({
  data: {
    name: 'Job Alert Template',
    type: 'job_listing',
    captionTemplate:
      '🚀 New Job Alert!\n\n📋 {{jobTitle}}\n🏢 {{company}}\n📍 {{location}}\n\n#209jobs #hiring',
    hashtags: ['209jobs', 'hiring', 'jobs'],
    creatorId: userId,
  },
});
```

## API Reference

### POST /api/instagram/posts

Create a new Instagram post.

**Request Body:**

```json
{
  "jobId": "job-uuid",
  "caption": "Check out this amazing job opportunity!",
  "hashtags": ["209jobs", "hiring", "tech"],
  "scheduledAt": "2024-01-15T10:00:00Z",
  "imageOptions": {
    "template": "modern",
    "brandColor": "#3b82f6"
  },
  "type": "job_listing"
}
```

### GET /api/instagram/posts

Get user's Instagram posts.

**Query Parameters:**

- `status` - Filter by status (scheduled, published)
- `limit` - Number of posts to return (default: 20)

### POST /api/instagram/generate-image

Generate an Instagram image.

**Request Body:**

```json
{
  "jobId": "job-uuid",
  "options": {
    "template": "modern",
    "backgroundColor": "#1a1a1a",
    "textColor": "#ffffff",
    "brandColor": "#3b82f6"
  }
}
```

## Image Templates

### 1. Modern Template

- Clean geometric design
- Brand accent colors
- Professional typography
- Call-to-action button

### 2. Classic Template

- Traditional layout
- Border design
- Formal presentation
- Company-focused

### 3. Minimal Template

- Lots of white space
- Simple typography
- Clean lines
- Subtle branding

### 4. Gradient Template

- Colorful gradient background
- Eye-catching design
- Modern aesthetic
- High contrast text

## Database Schema

### InstagramPost

```sql
- id: UUID (Primary Key)
- caption: Text
- hashtags: String[]
- type: Enum (job_listing, company_highlight, etc.)
- status: Enum (draft, scheduled, published, failed)
- scheduledAt: DateTime?
- publishedAt: DateTime?
- jobId: UUID? (Foreign Key)
- creatorId: UUID (Foreign Key)
- imageData: Bytes?
- instagramPostId: String?
- instagramUrl: String?
- likes, comments, shares, reach, impressions: Int
- errorMessage: String?
- retryCount: Int
```

### InstagramTemplate

```sql
- id: UUID (Primary Key)
- name: String
- description: String?
- type: Enum
- captionTemplate: String
- hashtags: String[]
- backgroundImage: String?
- textColor, backgroundColor, fontFamily: String
- fontSize: Int
- layout: JSON?
- isActive: Boolean
- usageCount: Int
- creatorId: UUID (Foreign Key)
```

### InstagramSchedule

```sql
- id: UUID (Primary Key)
- name: String
- description: String?
- isActive: Boolean
- timezone: String
- postTimes: String[]
- daysOfWeek: Int[]
- templateId: UUID? (Foreign Key)
- autoPostNewJobs: Boolean
- jobCategories: String[]
- maxPostsPerDay: Int
- creatorId: UUID (Foreign Key)
```

## Queue System

The system uses Redis and BullMQ for reliable post scheduling:

- **Queue Name:** `instagram-posts`
- **Job Types:** `publish-post`
- **Retry Logic:** 3 attempts with exponential backoff
- **Cleanup:** Automatic removal of old completed/failed jobs

## Error Handling

The system includes comprehensive error handling:

1. **Image Generation Errors**

   - Canvas rendering failures
   - Font loading issues
   - Memory constraints

2. **Scheduling Errors**

   - Invalid dates
   - Queue connection issues
   - Database constraints

3. **API Errors**
   - Instagram API rate limits
   - Authentication failures
   - Network timeouts

## Testing

Run the comprehensive test suite:

```bash
# Test all components
npx ts-node src/scripts/test-instagram-automation.ts

# Test specific components
npm test -- instagram
```

The test script verifies:

- ✅ Image generation (all templates)
- ✅ Database models and relationships
- ✅ Post scheduling logic
- ✅ Template system
- ✅ API utilities
- ✅ Queue management

## Next Steps

### For Meta API Integration:

1. **Set up Meta Developer Account**

   - Create Facebook App
   - Add Instagram Basic Display API
   - Get access tokens

2. **Configure Webhooks**

   - Set up webhook endpoints
   - Handle Instagram events
   - Update post metrics

3. **Implement Image Upload**

   - CDN integration (AWS S3, Cloudinary)
   - Image optimization
   - URL generation

4. **Add Analytics Dashboard**
   - Performance metrics UI
   - Engagement tracking
   - ROI calculations

### Alternative Solutions:

1. **Make.com Integration**

   - Webhook-based posting
   - Visual workflow builder
   - No API limits

2. **Zapier Integration**

   - Pre-built Instagram connectors
   - Easy setup
   - Multiple trigger options

3. **Buffer/Hootsuite API**
   - Third-party scheduling
   - Multi-platform support
   - Analytics included

## Security Considerations

1. **API Keys**

   - Store in environment variables
   - Rotate regularly
   - Use least privilege access

2. **Image Data**

   - Validate image content
   - Limit file sizes
   - Sanitize user inputs

3. **Rate Limiting**
   - Respect Instagram API limits
   - Implement backoff strategies
   - Monitor usage quotas

## Performance Optimization

1. **Image Generation**

   - Cache generated images
   - Optimize canvas operations
   - Use worker threads for heavy processing

2. **Database Queries**

   - Index frequently queried fields
   - Use connection pooling
   - Implement query optimization

3. **Queue Processing**
   - Adjust concurrency based on load
   - Monitor queue health
   - Implement circuit breakers

## Monitoring & Logging

The system includes comprehensive logging:

- **Image Generation:** Canvas operations, template rendering
- **Scheduling:** Queue operations, job processing
- **API Calls:** Request/response logging, error tracking
- **Database:** Query performance, connection health

## Conclusion

The Instagram Post Automation System provides a solid foundation for automated social media marketing. The modular architecture allows for easy extension and customization, while the comprehensive error handling ensures reliable operation.

The system is ready for Meta API integration when credentials become available, and can be easily adapted to work with alternative solutions like Make.com or third-party scheduling services.
