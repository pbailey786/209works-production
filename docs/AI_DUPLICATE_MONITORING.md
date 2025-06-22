# AI Duplicate Monitoring System

## Overview

The 209 Works platform now includes a comprehensive duplicate detection and monitoring system designed to work with AI assistants to identify and manage duplicate job postings.

## Key Changes Made

### 1. Free Job Post Duration
- **Changed from 30 days to 7 days** for free job postings
- Premium job posts remain at 30 days
- Updated display text and expiration logic

### 2. Duplicate Detection System

#### Database Schema
- Added duplicate tracking fields to `Job` table
- Created `JobPostingPattern` table for pattern analysis
- Created `DuplicateJobAlert` table for flagged duplicates
- Added database functions for automatic duplicate detection

#### Automatic Detection
- **Title Hash Matching**: Detects exact title duplicates
- **Description Hash Matching**: Identifies similar job descriptions
- **Company + Location Similarity**: Finds similar jobs from same company
- **Posting Pattern Analysis**: Tracks suspicious posting behaviors

### 3. AI Assistant Integration

#### API Endpoints

**Check for Duplicates:**
```
POST /api/ai/duplicate-check
Headers: x-api-key: YOUR_AI_ASSISTANT_API_KEY
```

**Monitor Duplicates (Admin):**
```
GET /api/admin/duplicate-monitoring?type=alerts
GET /api/admin/duplicate-monitoring?type=patterns
GET /api/admin/duplicate-monitoring?type=statistics
```

**Review Duplicates (Admin):**
```
POST /api/admin/duplicate-monitoring
{
  "alertId": "alert-id",
  "reviewStatus": "confirmed|false_positive|ignored",
  "actionTaken": "removed|flagged|none",
  "notes": "Review notes"
}
```

## AI Assistant Usage Guide

### 1. Real-time Duplicate Checking

When a new job is posted, AI assistants can check for duplicates:

```javascript
const response = await fetch('/api/ai/duplicate-check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.AI_ASSISTANT_API_KEY
  },
  body: JSON.stringify({
    jobData: {
      title: "Software Developer",
      company: "Tech Corp",
      location: "Modesto, CA",
      employerId: "employer-id",
      description: "Job description..."
    }
  })
});

const result = await response.json();
// Returns: duplicates, risk assessment, recommendations
```

### 2. Risk Assessment

The system provides automated risk scoring:

- **HIGH RISK (0.7+)**: Manual review required
- **MEDIUM RISK (0.4-0.7)**: Additional verification recommended  
- **LOW RISK (0-0.4)**: Appears unique

### 3. Pattern Detection

Monitors for suspicious patterns:
- High-frequency posting (>10 posts from same employer)
- Identical job titles with minor variations
- Same company posting identical jobs in multiple locations
- Rapid-fire posting (multiple posts per day)

### 4. Automated Actions

The system can automatically:
- Flag suspicious posts for review
- Calculate similarity scores
- Track posting patterns
- Generate alerts for admin review

## Database Functions

### Key Functions Available

1. **`calculate_text_hash(text)`**: Normalizes and hashes text for comparison
2. **`detect_job_duplicates(job_id)`**: Finds potential duplicates for a job
3. **Automatic Triggers**: Detect duplicates when jobs are created

### Views for Monitoring

- **`DuplicateJobsView`**: Complete view of all duplicate alerts with job details
- **Admin Dashboard Queries**: Pre-built queries for monitoring

## Implementation Steps

### 1. Apply Database Schema
```sql
-- Run in your database
\i scripts/add-duplicate-tracking.sql
```

### 2. Set Environment Variables
```bash
# Add to your .env
AI_ASSISTANT_API_KEY=your-secure-api-key-here
```

### 3. Configure AI Assistant

The AI assistant should:
1. Check all new job posts for duplicates
2. Flag high-risk posts for manual review
3. Monitor posting patterns
4. Generate daily/weekly duplicate reports

## Monitoring Dashboard

Admins can monitor duplicates through:

1. **Pending Alerts**: Jobs flagged as potential duplicates
2. **Posting Patterns**: Employers with suspicious posting behavior
3. **Statistics**: Overall duplicate detection metrics
4. **Review Queue**: Manual review interface for flagged posts

## Example AI Assistant Prompts

### For Duplicate Detection:
```
"Check this job posting for duplicates and assess risk level. 
Job: [title], Company: [company], Location: [location]
Provide recommendations for approval/rejection."
```

### For Pattern Analysis:
```
"Analyze posting patterns for employer [employer-id]. 
Look for signs of spam, duplicate content, or suspicious behavior.
Generate a risk assessment report."
```

## Benefits

1. **Spam Prevention**: Automatically detect and flag duplicate posts
2. **Quality Control**: Maintain high-quality job listings
3. **User Experience**: Reduce duplicate content for job seekers
4. **Admin Efficiency**: Automated flagging reduces manual review time
5. **Pattern Recognition**: Identify problematic employers early

## Future Enhancements

1. **Machine Learning**: Train models on confirmed duplicates
2. **Semantic Analysis**: Use AI to detect similar meaning, not just text
3. **Cross-platform Detection**: Check against external job boards
4. **Employer Scoring**: Reputation system based on posting quality
5. **Real-time Notifications**: Instant alerts for high-risk posts

## API Response Examples

### Duplicate Check Response:
```json
{
  "success": true,
  "jobInfo": {
    "title": "Software Developer",
    "company": "Tech Corp"
  },
  "duplicates": [
    {
      "duplicate_job_id": "job-123",
      "similarity_score": 0.95,
      "detection_method": "title_hash"
    }
  ],
  "riskAssessment": {
    "score": 0.8,
    "level": "HIGH",
    "factors": ["High-similarity duplicate found"]
  },
  "recommendations": [
    "🚨 HIGH RISK: Manual review required",
    "Potential exact duplicate detected"
  ]
}
```

This system provides a robust foundation for AI-assisted duplicate detection and quality control on the 209 Works platform.
