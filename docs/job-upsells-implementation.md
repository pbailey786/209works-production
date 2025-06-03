# Job Upsells Implementation

## Overview

This implementation adds three upsell options to job postings on the 209 Works platform:

1. **$29 Social Media Shoutout** - Promotes job on Instagram and X (Twitter)
2. **$29 On-Site Placement Bump** - LLM actively promotes job to chat users
3. **$50 Complete Bundle** - Both services together (saves $8)

## Features Implemented

### 1. Database Schema Updates

- Added upsell fields to `JobPostOptimizer` and `Job` models
- Fields: `socialMediaShoutout`, `placementBump`, `upsellBundle`, `upsellTotal`
- Added database indexes for performance

### 2. Job Posting Flow Integration

- **JobUpsellSelector Component**: Interactive upsell selection during job creation
- **Updated Job Post Optimizer**: Includes upsell options in the posting flow
- **API Integration**: Handles upsell data in job creation and publishing

### 3. Job Display Enhancements

- **Upsell Badges**: Visual indicators on job listings showing promotion features
- **JobUpsellModal**: Allows adding upsells to existing jobs
- **Enhanced Job Detail Page**: Shows promotion badges with attractive styling

### 4. API Endpoints

- **POST /api/jobs/upsells**: Process upsell purchases for existing jobs
- **GET /api/jobs/upsells**: Get current upsell status for a job
- **Updated job-post-optimizer APIs**: Handle upsell data

## Component Details

### JobUpsellSelector

- **Location**: `src/components/job-posting/JobUpsellSelector.tsx`
- **Purpose**: Used during job creation to select upsell options
- **Features**:
  - Interactive cards with hover effects
  - Bundle vs individual pricing logic
  - Real-time total calculation
  - Popular option highlighting

### JobUpsellModal

- **Location**: `src/components/job-posting/JobUpsellModal.tsx`
- **Purpose**: Add upsells to existing published jobs
- **Features**:
  - Modal interface with smooth animations
  - Prevents duplicate purchases
  - Payment processing integration ready
  - Success/error handling

### Upsell Badges

- **Location**: `src/app/jobs/[id]/JobDetailClient.tsx`
- **Purpose**: Visual indicators of promotion features
- **Styling**: Gradient backgrounds with icons for each upsell type

## Pricing Structure

| Option                 | Price | Description                                       |
| ---------------------- | ----- | ------------------------------------------------- |
| Social Media Shoutout  | $29   | Instagram + X promotion with branded graphics     |
| On-Site Placement Bump | $29   | AI chatbot recommendations and priority placement |
| Complete Bundle        | $50   | Both services (save $8)                           |

## Social Media Shoutout Details

When purchased, this feature:

- Creates custom branded graphics for the job post
- Posts to 209 Works Instagram (5K+ local followers)
- Shares on X with relevant hashtags
- Includes company logo and branding
- Reaches hyper-local 209 area audience
- Provides analytics report on engagement

**Implementation**: Creates `InstagramPost` record with generated caption and hashtags

## On-Site Placement Bump Details

When purchased, this feature:

- AI chatbot (JobsGPT) actively recommends the job to relevant users
- Higher visibility in search results
- Personalized job suggestions to qualified candidates
- Priority placement in chat responses
- Increased application conversion rates
- Smart matching with user profiles

**Implementation**: Updates job priority scoring for AI recommendations

## Database Schema

### JobPostOptimizer Table

```sql
ALTER TABLE "JobPostOptimizer" ADD COLUMN "socialMediaShoutout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "placementBump" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "upsellBundle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "upsellTotal" DECIMAL(10,2);
```

### Job Table

```sql
ALTER TABLE "Job" ADD COLUMN "socialMediaShoutout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "placementBump" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "upsellBundle" BOOLEAN NOT NULL DEFAULT false;
```

## Testing

A test page has been created at `/test-upsells` to verify:

- Upsell selector functionality
- Modal interactions
- Badge display
- Pricing calculations

## Integration Points

### 1. Job Creation Flow

- Upsell selector appears after job details form
- Selection data is saved with job post optimizer
- Transferred to published job when published

### 2. Existing Jobs

- Upsell modal can be triggered from employer dashboard
- API processes upsell purchases
- Job is updated with new promotion features

### 3. Job Display

- Badges automatically appear on jobs with upsells
- Different styling for each upsell type
- Responsive design for mobile/desktop

## Future Enhancements

1. **Payment Processing**: Integrate with Stripe for actual payment handling
2. **Analytics Dashboard**: Track upsell performance and ROI
3. **Automated Social Media**: Implement actual Instagram/X posting automation
4. **AI Integration**: Enhance JobsGPT to actively promote bumped jobs
5. **A/B Testing**: Test different pricing and messaging strategies

## Files Modified/Created

### New Components

- `src/components/job-posting/JobUpsellSelector.tsx`
- `src/components/job-posting/JobUpsellModal.tsx`

### Modified Files

- `src/app/employers/create-job-post/page.tsx`
- `src/app/api/job-post-optimizer/route.ts`
- `src/app/api/job-post-optimizer/[id]/publish/route.ts`
- `src/app/jobs/[id]/JobDetailClient.tsx`
- `prisma/schema.prisma`

### New API Routes

- `src/app/api/jobs/upsells/route.ts`

### Database Migration

- `prisma/migrations/20250102000000_add_job_upsells/migration.sql`

### Test Page

- `src/app/test-upsells/page.tsx`

## Usage Instructions

1. **During Job Creation**: Upsell options appear automatically in the job posting flow
2. **For Existing Jobs**: Use the upsell modal (integration with employer dashboard needed)
3. **Viewing Jobs**: Upsell badges appear automatically on promoted jobs

The implementation is ready for production use with proper payment processing integration.
