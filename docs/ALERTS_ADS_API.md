# Alert and Advertisement API Documentation

This document describes the comprehensive Alert and Advertisement API systems implemented for 209jobs.

## Overview

The Alert and Ad API systems provide:

- **Job Alerts** with frequency controls and smart matching
- **Advertisement Management** with comprehensive targeting and tracking
- **Real-time Impression/Click/Conversion Tracking** for monetization
- **Advanced Analytics** with insights and optimization recommendations
- **Role-based Access Control** for security and privacy

## Quick Start

### Job Alert Management

```bash
# Create a job alert
POST /api/alerts
{
  "name": "Frontend Developer Jobs",
  "criteria": {
    "keywords": ["react", "javascript"],
    "location": "San Francisco",
    "salaryMin": 80000,
    "remote": true
  },
  "frequency": "daily"
}

# Test an alert
POST /api/alerts/{id}/test
{
  "dryRun": true
}
```

### Advertisement Management

```bash
# Create an advertisement
POST /api/ads
{
  "name": "Hire React Developers",
  "type": "banner",
  "content": {
    "title": "Looking for React Experts?",
    "description": "Join our growing team...",
    "ctaText": "Apply Now",
    "ctaUrl": "https://company.com/jobs"
  },
  "bidding": {
    "type": "cpc",
    "bidAmount": 2.50,
    "dailyBudget": 100
  },
  "schedule": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-02-01T00:00:00Z"
  }
}

# Track ad impression
POST /api/ads/impression
{
  "adId": "ad-uuid",
  "page": "/jobs/search",
  "position": "sidebar"
}
```

## Alert API Endpoints

### 1. List User Alerts

**Endpoint:** `GET /api/alerts`

**Authentication:** Required (Users see their own alerts only)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `isActive` | boolean | Filter by active status |
| `frequency` | enum | Filter by frequency (`immediate`, `daily`, `weekly`, `monthly`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (max: 100) |
| `sortBy` | enum | Sort field (`name`, `createdAt`, `lastSent`) |
| `sortOrder` | enum | Sort direction (`asc`, `desc`) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "alert-123",
        "name": "Frontend Developer Jobs",
        "description": "React and JavaScript opportunities",
        "criteria": {
          "keywords": ["react", "javascript"],
          "location": "San Francisco",
          "salaryMin": 80000,
          "remote": true
        },
        "frequency": "daily",
        "isActive": true,
        "maxResults": 10,
        "lastSent": "2024-01-15T09:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "stats": {
          "totalNotifications": 15,
          "recentMatches": 8,
          "lastMatchDate": "2024-01-15T09:00:00Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNextPage": true
    }
  }
}
```

### 2. Create Alert

**Endpoint:** `POST /api/alerts`

**Authentication:** Required

**Rate Limit:** 20 alerts per user (100 for admins)

**Request Body:**

```json
{
  "name": "Software Engineer - Remote",
  "description": "Remote software engineering opportunities",
  "criteria": {
    "keywords": ["software engineer", "developer"],
    "jobTitle": "Software Engineer",
    "company": "Google",
    "location": "Remote",
    "remote": true,
    "radius": 50,
    "jobType": "full-time",
    "experienceLevel": "mid",
    "salaryMin": 100000,
    "salaryMax": 180000,
    "skills": ["Python", "JavaScript", "AWS"],
    "excludeKeywords": ["internship", "junior"],
    "industry": "Technology",
    "companySize": "large"
  },
  "frequency": "immediate",
  "isActive": true,
  "maxResults": 20
}
```

### 3. Get Alert Details

**Endpoint:** `GET /api/alerts/:id`

**Authentication:** Required (Users can only access their own alerts)

**Response includes:**
- Alert configuration
- Recent matching jobs preview
- Performance statistics
- Estimated next run time

### 4. Update Alert

**Endpoint:** `PUT /api/alerts/:id`

**Authentication:** Required

**Request Body:** Same as create, but all fields optional

### 5. Delete Alert

**Endpoint:** `DELETE /api/alerts/:id`

**Authentication:** Required

### 6. Test Alert

**Endpoint:** `POST /api/alerts/:id/test`

**Purpose:** Preview matching jobs and optimize criteria

**Request Body:**

```json
{
  "dryRun": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert-123",
      "name": "Frontend Developer Jobs",
      "frequency": "daily"
    },
    "testResults": {
      "totalMatches": 12,
      "matchingJobs": [
        {
          "id": "job-456",
          "title": "Senior React Developer",
          "company": "TechCorp",
          "location": "San Francisco, CA",
          "salaryMin": 120000,
          "salaryMax": 150000,
          "relevanceScore": 8.5,
          "matchedFields": ["title", "skills"],
          "snippet": "We are looking for a senior React developer..."
        }
      ],
      "matchQuality": {
        "score": 85,
        "level": "excellent",
        "feedback": "Excellent matches! Your criteria are well-defined."
      },
      "recommendations": [
        "Your alert criteria are well-balanced!"
      ]
    },
    "notificationPreview": {
      "subject": "12 new jobs matching 'Frontend Developer Jobs'",
      "preview": "Found 12 new opportunities including Senior React Developer, Frontend Engineer",
      "emailBody": {
        "heading": "New Job Matches for 'Frontend Developer Jobs'",
        "summary": "We found 12 new jobs that match your alert criteria.",
        "jobs": [...]
      }
    },
    "dryRun": true
  }
}
```

## Advertisement API Endpoints

### 1. List Advertisements

**Endpoint:** `GET /api/ads`

**Authentication:** Required (Employers see their own, Admins see all)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `advertiserId` | UUID | Filter by advertiser (Admin only) |
| `status` | enum | Filter by status |
| `type` | enum | Filter by ad type |
| `isActive` | boolean | Filter by current activity |
| `dateFrom` | datetime | Start date filter |
| `dateTo` | datetime | End date filter |
| `page` | number | Page number |
| `limit` | number | Items per page |
| `sortBy` | enum | Sort field |
| `sortOrder` | enum | Sort direction |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "ad-789",
        "name": "Hire React Developers",
        "type": "banner",
        "status": "active",
        "content": {
          "title": "Looking for React Experts?",
          "description": "Join our growing team of innovators...",
          "imageUrl": "https://cdn.company.com/ad-image.jpg",
          "ctaText": "Apply Now",
          "ctaUrl": "https://company.com/careers"
        },
        "bidding": {
          "type": "cpc",
          "bidAmount": 2.50,
          "dailyBudget": 100,
          "totalBudget": 3000
        },
        "schedule": {
          "startDate": "2024-01-01T00:00:00Z",
          "endDate": "2024-02-01T00:00:00Z"
        },
        "metrics": {
          "impressions": 15420,
          "clicks": 234,
          "conversions": 12,
          "ctr": 1.52,
          "conversionRate": 5.13,
          "estimatedSpend": 585.00,
          "costPerClick": 2.50
        },
        "isCurrentlyActive": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 15
    }
  }
}
```

### 2. Create Advertisement

**Endpoint:** `POST /api/ads`

**Authentication:** Required (Employers only)

**Rate Limit:** 50 ads per employer

**Request Body:**

```json
{
  "name": "Q1 Developer Recruitment Campaign",
  "type": "featured_job",
  "content": {
    "title": "Join Our Engineering Team",
    "description": "We're looking for talented developers to join our remote-first team. Competitive salary, great benefits, and cutting-edge projects.",
    "imageUrl": "https://company.com/images/recruitment-banner.jpg",
    "videoUrl": "https://company.com/videos/company-culture.mp4",
    "ctaText": "View Open Positions",
    "ctaUrl": "https://company.com/careers",
    "companyLogo": "https://company.com/logo.png",
    "salaryRange": "$80,000 - $150,000",
    "location": "Remote",
    "jobType": "Full-time"
  },
  "targeting": {
    "countries": ["US", "CA"],
    "states": ["CA", "NY", "TX"],
    "cities": ["San Francisco", "New York", "Austin"],
    "radius": 50,
    "jobTitles": ["Software Engineer", "Frontend Developer", "Backend Developer"],
    "industries": ["Technology", "Software"],
    "experienceLevels": ["mid", "senior"],
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "searchKeywords": ["remote developer", "tech jobs"],
    "deviceTypes": ["desktop", "mobile"],
    "daysOfWeek": [1, 2, 3, 4, 5],
    "hoursOfDay": [9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  "bidding": {
    "type": "cpc",
    "bidAmount": 3.00,
    "dailyBudget": 150,
    "totalBudget": 4500,
    "maxCpc": 5.00
  },
  "schedule": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-03-31T23:59:59Z",
    "timezone": "America/Los_Angeles",
    "isAlwaysOn": false
  },
  "priority": 7,
  "notes": "Focus on senior developers with React experience"
}
```

### 3. Get Advertisement Details

**Endpoint:** `GET /api/ads/:id`

**Authentication:** Required (Role-based access)

**Response includes:**
- Complete ad configuration
- Performance metrics (all-time and recent)
- Budget utilization
- Targeting effectiveness analysis
- Optimization recommendations

### 4. Update Advertisement

**Endpoint:** `PUT /api/ads/:id`

**Authentication:** Required

**Features:**
- Status transition validation
- Schedule change restrictions for active ads
- Automatic re-estimation of reach

### 5. Delete Advertisement

**Endpoint:** `DELETE /api/ads/:id`

**Authentication:** Required

**Restrictions:**
- Cannot delete active ads with recorded spend
- Must pause first, then delete

## Ad Tracking Endpoints

### 1. Track Impression

**Endpoint:** `POST /api/ads/impression`

**Purpose:** Record when an ad is displayed

**Rate Limit:** 1000 requests/minute

**Request Body:**

```json
{
  "adId": "ad-uuid",
  "userId": "user-uuid",
  "sessionId": "session_123",
  "page": "/jobs/search",
  "position": "sidebar",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Features:**
- Duplicate prevention (30-second window)
- Automatic budget checking for CPM ads
- Schedule validation
- User/session tracking

### 2. Track Click

**Endpoint:** `POST /api/ads/click`

**Purpose:** Record when an ad is clicked

**Rate Limit:** 500 requests/minute

**Request Body:**

```json
{
  "adId": "ad-uuid",
  "impressionId": "impression-uuid",
  "userId": "user-uuid",
  "sessionId": "session_123",
  "targetUrl": "https://company.com/careers",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Features:**
- URL validation against ad content
- CPC billing calculation
- Budget monitoring and auto-pause
- Click-through rate calculation

### 3. Track Conversion

**Endpoint:** `POST /api/ads/conversion`

**Purpose:** Record conversion events (job applications, signups)

**Rate Limit:** 200 requests/minute

**Request Body:**

```json
{
  "adId": "ad-uuid",
  "clickId": "click-uuid",
  "userId": "user-uuid",
  "type": "job_apply",
  "value": 50.00,
  "customEvent": "premium_signup",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Conversion Types:**
- `job_view` - Job listing viewed
- `job_apply` - Job application submitted
- `signup` - User registration
- `purchase` - Premium subscription
- `custom` - Custom conversion event

**Features:**
- ROI calculation
- Conversion funnel analysis
- Attribution tracking (24-hour window)
- Revenue reporting

## Analytics Endpoint

### Get Ad Analytics

**Endpoint:** `GET /api/ads/stats`

**Authentication:** Required (Role-based access)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `adIds` | array | Specific ads to analyze |
| `advertiserId` | UUID | Advertiser filter (Admin only) |
| `dateFrom` | datetime | Start date |
| `dateTo` | datetime | End date |
| `groupBy` | enum | Grouping (`day`, `week`, `month`, `ad`, `type`) |
| `metrics` | array | Metrics to include |

**Available Metrics:**
- `impressions` - Total ad impressions
- `clicks` - Total ad clicks
- `conversions` - Total conversions
- `ctr` - Click-through rate
- `conversion_rate` - Conversion rate
- `cost` - Total spend
- `cpc` - Cost per click
- `cpm` - Cost per thousand impressions
- `revenue` - Total revenue
- `roas` - Return on ad spend

**Example Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAds": 5,
      "totalImpressions": 45620,
      "totalClicks": 1234,
      "totalConversions": 67,
      "totalCost": 3085.50,
      "totalRevenue": 3350.00,
      "overallCtr": 2.71,
      "overallConversionRate": 5.43,
      "averageCpc": 2.50,
      "overallRoas": 108.56,
      "estimatedReach": 28945
    },
    "breakdown": [
      {
        "group": "2024-01-15",
        "impressions": 1250,
        "clicks": 34,
        "conversions": 2,
        "ctr": 2.72,
        "conversionRate": 5.88,
        "cost": 85.00,
        "revenue": 100.00,
        "uniqueUsers": 892,
        "uniqueSessions": 1015
      }
    ],
    "trends": [
      {
        "period": "2024-01-15",
        "impressions": 1250,
        "clicks": 34,
        "conversions": 2,
        "ctr": 2.72,
        "conversionRate": 5.88
      }
    ],
    "insights": [
      "Excellent click-through rate! Your ads are highly engaging.",
      "Outstanding conversion rate indicates excellent ad-to-landing page alignment.",
      "Excellent ROI! Consider increasing budget to scale successful campaigns."
    ],
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "groupBy": "day"
    }
  }
}
```

## Security and Privacy

### Rate Limiting

- **Alert endpoints**: 30 requests/minute
- **Ad management**: 30 requests/minute  
- **Impression tracking**: 1000 requests/minute
- **Click tracking**: 500 requests/minute
- **Conversion tracking**: 200 requests/minute
- **Analytics**: Premium rate limits

### Access Control

- **Alerts**: Users can only manage their own alerts
- **Ads**: Employers can only manage their own ads
- **Analytics**: Role-based access (employers see own data, admins see all)
- **Tracking**: Public endpoints with validation

### Data Privacy

- **PII Protection**: Email addresses not exposed in search results
- **Anonymization**: User IDs optional in tracking calls
- **Retention**: Configurable data retention policies
- **GDPR Compliance**: Data deletion and export capabilities

## Error Handling

### Common Error Codes

- `400` - Validation error (invalid parameters)
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid alert criteria",
    "details": {
      "salaryMin": "Must be a positive number",
      "frequency": "Must be one of: immediate, daily, weekly, monthly"
    }
  }
}
```

## Performance Considerations

### Caching Strategy

- **Alert listings**: 5-minute TTL
- **Ad analytics**: 30-minute TTL
- **Impression data**: 15-minute TTL
- **User preferences**: 1-hour TTL

### Database Optimization

```sql
-- Recommended indexes for optimal performance
CREATE INDEX idx_alert_user_active ON job_alert(user_id, is_active);
CREATE INDEX idx_alert_frequency ON job_alert(frequency, last_sent);

CREATE INDEX idx_ad_status_schedule ON advertisement(status, start_date, end_date);
CREATE INDEX idx_ad_advertiser ON advertisement(advertiser_id, status);

CREATE INDEX idx_impression_ad_timestamp ON ad_impression(ad_id, timestamp);
CREATE INDEX idx_click_ad_timestamp ON ad_click(ad_id, timestamp);
CREATE INDEX idx_conversion_ad_timestamp ON ad_conversion(ad_id, timestamp);
```

### Monitoring

- **Response times**: < 200ms for most endpoints
- **Cache hit rates**: > 80% for analytics
- **Error rates**: < 0.1%
- **Budget tracking**: Real-time for critical thresholds

## Integration Examples

### Frontend Alert Management

```javascript
// React hook for alert management
export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const createAlert = async (alertData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });
      const result = await response.json();
      
      if (result.success) {
        setAlerts(prev => [...prev, result.data]);
        return result.data;
      }
    } finally {
      setLoading(false);
    }
  };
  
  const testAlert = async (alertId) => {
    const response = await fetch(`/api/alerts/${alertId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true }),
    });
    return response.json();
  };
  
  return { alerts, createAlert, testAlert, loading };
}
```

### Ad Tracking Implementation

```javascript
// Ad impression tracking
function trackImpression(adId, options = {}) {
  fetch('/api/ads/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adId,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      page: window.location.pathname,
      position: options.position || 'unknown',
      timestamp: new Date().toISOString(),
    }),
  });
}

// Ad click tracking with redirect
function trackClickAndRedirect(adId, targetUrl, impressionId) {
  fetch('/api/ads/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adId,
      impressionId,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      targetUrl,
      timestamp: new Date().toISOString(),
    }),
  }).then(() => {
    // Redirect after tracking
    window.open(targetUrl, '_blank');
  });
}
```

## Migration and Deployment

### Database Schema

The system requires additional database tables for alerts and ads. See the Prisma schema for complete definitions:

- `JobAlert` - User job alerts
- `Advertisement` - Ad campaigns  
- `AdImpression` - Impression tracking
- `AdClick` - Click tracking
- `AdConversion` - Conversion tracking

### Environment Variables

```env
# Redis for caching
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Ad system configuration
MAX_ALERTS_PER_USER=20
MAX_ADS_PER_EMPLOYER=50
AD_APPROVAL_REQUIRED=true

# Notification settings
ALERT_EMAIL_FROM=alerts@209jobs.com
ALERT_WEBHOOK_SECRET=your_webhook_secret
```

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Rate limiting configured
- [ ] Email service for alerts
- [ ] Monitoring and alerting
- [ ] Analytics dashboard
- [ ] Ad approval workflow
- [ ] Budget monitoring alerts

---

For additional support or questions, contact the development team or refer to the API middleware and validation documentation. 