# 209jobs API Usage Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Making Your First API Call](#making-your-first-api-call)
4. [Core Features](#core-features)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [SDKs and Libraries](#sdks-and-libraries)
9. [Webhook Integration](#webhook-integration)
10. [Advanced Examples](#advanced-examples)

## Getting Started

The 209jobs API is a RESTful API that provides comprehensive job board functionality. All API endpoints return JSON responses and use standard HTTP status codes.

### Base URLs

- **Production**: `https://api.209jobs.com/v1`
- **Staging**: `https://api-staging.209jobs.com/v1` 
- **Development**: `http://localhost:3000/api`

### Prerequisites

1. A 209jobs account (jobseeker, employer, or admin)
2. API credentials (JWT token or API key)
3. Basic understanding of REST APIs and HTTP

## Authentication

The 209jobs API supports two authentication methods:

### 1. JWT Token Authentication (Recommended)

Most suitable for web applications and mobile apps.

```bash
# Get a JWT token by logging in
curl -X POST https://api.209jobs.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "jobseeker"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

Use the token in subsequent requests:
```bash
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. API Key Authentication

Best for server-to-server integrations and automation.

```bash
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "X-API-Key: your-api-key-here"
```

## Making Your First API Call

Let's start with a simple job search:

```bash
curl -X GET "https://api.209jobs.com/v1/jobs?query=software+engineer&location=San+Francisco&limit=5" \
  -H "Content-Type: application/json"
```

Example Response:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-123",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "jobType": "full-time",
        "experienceLevel": "senior",
        "salaryMin": 120000,
        "salaryMax": 180000,
        "isRemote": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "applicationCount": 25
      }
      // ... more jobs
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 10,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    },
    "totalCount": 50
  }
}
```

## Core Features

### 1. Job Management

#### Creating a Job Posting (Employers Only)

```javascript
const createJob = async () => {
  const response = await fetch('https://api.209jobs.com/v1/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      title: 'Frontend Developer',
      company: 'Awesome Startup',
      description: 'We are looking for a passionate frontend developer...',
      requirements: 'React, TypeScript, 3+ years experience',
      location: 'San Francisco, CA',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salaryMin: 80000,
      salaryMax: 120000,
      skills: ['React', 'TypeScript', 'CSS', 'HTML'],
      isRemote: true,
      applicationEmail: 'jobs@awesomestartup.com'
    })
  });
  
  const data = await response.json();
  console.log('Job created:', data);
};
```

#### Advanced Job Search

```python
import requests

def search_jobs(query, filters=None):
    """Search for jobs with advanced filtering"""
    
    url = "https://api.209jobs.com/v1/jobs"
    params = {
        'query': query,
        'location': filters.get('location') if filters else None,
        'jobType': filters.get('job_type') if filters else None,
        'remote': filters.get('remote') if filters else None,
        'salaryMin': filters.get('salary_min') if filters else None,
        'salaryMax': filters.get('salary_max') if filters else None,
        'skills': ','.join(filters.get('skills', [])) if filters else None,
        'sort': 'relevance',
        'limit': 20
    }
    
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}
    
    response = requests.get(url, params=params)
    return response.json()

# Example usage
results = search_jobs(
    query="python developer",
    filters={
        'location': 'Remote',
        'job_type': 'full-time',
        'remote': True,
        'salary_min': 70000,
        'skills': ['Python', 'Django', 'PostgreSQL']
    }
)
```

#### Semantic Job Search

```bash
curl -X POST https://api.209jobs.com/v1/jobs/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I want to work on machine learning projects using Python and TensorFlow at a startup",
    "location": "San Francisco Bay Area",
    "radius": 25,
    "limit": 10
  }'
```

### 2. Job Applications

#### Applying to a Job

```javascript
const applyToJob = async (jobId) => {
  const response = await fetch(`https://api.209jobs.com/v1/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      coverLetter: 'Dear Hiring Manager, I am excited to apply...',
      resumeUrl: 'https://example.com/resume.pdf',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      portfolioUrl: 'https://johndoe.dev',
      additionalNotes: 'Available for interviews next week'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Application submitted successfully!');
  } else {
    console.error('Application failed:', data.message);
  }
};
```

### 3. User Profile Management

#### Updating Profile

```python
import requests

def update_profile(user_id, profile_data, token):
    """Update user profile information"""
    
    url = f"https://api.209jobs.com/v1/users/{user_id}"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.put(url, json=profile_data, headers=headers)
    return response.json()

# Example for jobseeker
jobseeker_profile = {
    'name': 'John Doe',
    'bio': 'Passionate software engineer with 5 years of experience',
    'location': 'San Francisco, CA',
    'currentTitle': 'Senior Software Engineer',
    'experienceLevel': 'senior',
    'skills': ['JavaScript', 'React', 'Node.js', 'Python'],
    'expectedSalaryMin': 100000,
    'expectedSalaryMax': 150000,
    'isOpenToWork': True,
    'isOpenToRemote': True,
    'preferredJobTypes': ['full-time', 'contract'],
    'linkedinUrl': 'https://linkedin.com/in/johndoe'
}

# Example for employer
employer_profile = {
    'name': 'Jane Smith',
    'companyName': 'Tech Innovations Inc',
    'companyWebsite': 'https://techinnovations.com',
    'companySize': '51-200',
    'industry': 'Technology',
    'location': 'San Francisco, CA'
}
```

### 4. Job Alerts

#### Creating Smart Job Alerts

```javascript
const createJobAlert = async () => {
  const alertData = {
    name: 'Senior React Developer Opportunities',
    description: 'Notify me of senior React developer positions in SF',
    criteria: {
      keywords: ['React', 'Frontend', 'JavaScript'],
      jobTitle: 'Senior Developer',
      location: 'San Francisco',
      radius: 25,
      remote: true,
      jobType: 'full-time',
      experienceLevel: 'senior',
      salaryMin: 120000,
      skills: ['React', 'TypeScript', 'Node.js'],
      excludeKeywords: ['junior', 'intern'],
      excludeCompanies: ['Company X']
    },
    frequency: 'daily',
    maxResults: 10
  };

  const response = await fetch('https://api.209jobs.com/v1/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify(alertData)
  });

  const data = await response.json();
  console.log('Alert created:', data);
};
```

#### Testing Job Alerts

```bash
curl -X POST https://api.209jobs.com/v1/alerts/alert-id-123/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "dryRun": true
  }'
```

### 5. Advertisement Management

#### Creating an Advertisement Campaign

```python
def create_ad_campaign(token):
    """Create a new advertisement campaign"""
    
    ad_data = {
        'title': 'Hire Top Software Engineers',
        'description': 'Reach qualified software engineers actively looking for new opportunities',
        'type': 'sponsored_search',
        'content': {
            'headline': 'Join Our Award-Winning Development Team',
            'description': 'Build next-generation software solutions',
            'ctaText': 'Apply Now',
            'ctaUrl': 'https://company.com/careers',
            'logoUrl': 'https://company.com/logo.png'
        },
        'targeting': {
            'geographic': {
                'cities': ['San Francisco', 'New York', 'Seattle'],
                'radius': 25
            },
            'professional': {
                'jobTitles': ['Software Engineer', 'Developer'],
                'skills': ['JavaScript', 'Python', 'React'],
                'experienceLevels': ['mid', 'senior']
            },
            'behavioral': {
                'jobSeekerStatus': 'active'
            }
        },
        'biddingModel': 'cpc',
        'bidAmount': 2.50,
        'dailyBudget': 100,
        'totalBudget': 3000,
        'startDate': '2024-02-01T00:00:00Z',
        'endDate': '2024-02-29T23:59:59Z'
    }
    
    response = requests.post(
        'https://api.209jobs.com/v1/ads',
        json=ad_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
    )
    
    return response.json()
```

#### Tracking Ad Performance

```javascript
const getAdAnalytics = async (adId) => {
  const response = await fetch(
    `https://api.209jobs.com/v1/ads/${adId}?startDate=2024-01-01&endDate=2024-01-31`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    const { performance, budget } = data.data;
    console.log(`CTR: ${performance.ctr}%`);
    console.log(`Conversion Rate: ${performance.conversionRate}%`);
    console.log(`Spend: $${performance.currentSpend}`);
    console.log(`Budget Remaining: $${budget.remaining}`);
  }
};
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Standard endpoints**: 100 requests per minute
- **Search endpoints**: 500 requests per minute  
- **Tracking endpoints**: 1000 requests per minute
- **Auth endpoints**: 200 requests per minute

### Handling Rate Limits

```javascript
const makeAPICall = async (url, options) => {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeAPICall(url, options);
  }
  
  return response.json();
};
```

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  },
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Handling Best Practices

```python
import requests
from typing import Dict, Any

def api_request(method: str, url: str, **kwargs) -> Dict[Any, Any]:
    """Make API request with comprehensive error handling"""
    
    try:
        response = requests.request(method, url, **kwargs)
        
        # Handle different HTTP status codes
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            error_data = response.json()
            raise ValueError(f"Bad request: {error_data.get('message')}")
        elif response.status_code == 401:
            raise PermissionError("Authentication required")
        elif response.status_code == 403:
            raise PermissionError("Insufficient permissions")
        elif response.status_code == 404:
            raise FileNotFoundError("Resource not found")
        elif response.status_code == 429:
            retry_after = response.headers.get('Retry-After', 60)
            raise Exception(f"Rate limited. Retry after {retry_after} seconds")
        elif response.status_code >= 500:
            raise Exception("Server error. Please try again later")
        else:
            response.raise_for_status()
            
    except requests.exceptions.ConnectionError:
        raise ConnectionError("Failed to connect to API")
    except requests.exceptions.Timeout:
        raise TimeoutError("Request timed out")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Request failed: {str(e)}")
```

## Best Practices

### 1. Caching

Implement caching for frequently accessed data:

```javascript
class JobsAPIClient {
  constructor(token) {
    this.token = token;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async searchJobs(query, useCache = true) {
    const cacheKey = JSON.stringify(query);
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const response = await fetch('https://api.209jobs.com/v1/jobs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await response.json();
    
    if (useCache) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  }
}
```

### 2. Pagination

Handle large datasets efficiently:

```python
def get_all_jobs(query_params):
    """Fetch all jobs using pagination"""
    
    all_jobs = []
    page = 1
    
    while True:
        params = {**query_params, 'page': page, 'limit': 50}
        response = requests.get(
            'https://api.209jobs.com/v1/jobs',
            params=params
        )
        
        data = response.json()
        
        if not data['success']:
            break
            
        jobs = data['data']['jobs']
        all_jobs.extend(jobs)
        
        pagination = data['data']['pagination']
        if not pagination['hasNext']:
            break
            
        page += 1
    
    return all_jobs
```

### 3. Bulk Operations

Use bulk operations when possible:

```javascript
const bulkUpdateAlerts = async (alertIds, operation) => {
  const response = await fetch('https://api.209jobs.com/v1/alerts/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      operation, // 'activate', 'deactivate', or 'delete'
      alertIds
    })
  });
  
  const data = await response.json();
  console.log(`${data.data.affectedCount} alerts ${operation}d`);
};
```

## SDKs and Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@209jobs/api-client`
- **Python**: `py209jobs`
- **PHP**: `209jobs/api-client`
- **Java**: `com.209jobs.api-client`

### JavaScript SDK Example

```bash
npm install @209jobs/api-client
```

```javascript
import { JobsAPI } from '@209jobs/api-client';

const client = new JobsAPI({
  apiKey: 'your-api-key',
  environment: 'production' // or 'staging'
});

// Search jobs
const jobs = await client.jobs.search({
  query: 'software engineer',
  location: 'San Francisco',
  jobType: 'full-time'
});

// Create job alert
const alert = await client.alerts.create({
  name: 'My Job Alert',
  criteria: {
    keywords: ['React', 'JavaScript'],
    location: 'Remote'
  },
  frequency: 'daily'
});
```

### Python SDK Example

```bash
pip install py209jobs
```

```python
from py209jobs import JobsAPI

client = JobsAPI(api_key='your-api-key')

# Search jobs
jobs = client.jobs.search(
    query='python developer',
    location='New York',
    remote=True
)

# Apply to job
application = client.jobs.apply(
    job_id='job-123',
    cover_letter='Dear Hiring Manager...',
    resume_url='https://example.com/resume.pdf'
)
```

## Webhook Integration

Set up webhooks to receive real-time notifications:

### 1. Webhook Configuration

```bash
curl -X POST https://api.209jobs.com/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://yourapp.com/webhooks/209jobs",
    "events": ["job.applied", "alert.matched", "ad.performance"],
    "secret": "your-webhook-secret"
  }'
```

### 2. Webhook Handler Example

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhooks/209jobs', (req, res) => {
  const signature = req.headers['x-209jobs-signature'];
  const payload = JSON.stringify(req.body);
  const secret = 'your-webhook-secret';
  
  // Verify webhook signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  
  if (signature !== `sha256=${digest}`) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'job.applied':
      console.log(`New application for job ${data.jobId}`);
      // Handle job application
      break;
      
    case 'alert.matched':
      console.log(`Alert ${data.alertId} found ${data.matches} new jobs`);
      // Handle alert matches
      break;
      
    case 'ad.performance':
      console.log(`Ad ${data.adId} performance update`);
      // Handle ad performance data
      break;
  }
  
  res.status(200).send('OK');
});
```

## Advanced Examples

### 1. Building a Job Recommendation Engine

```python
class JobRecommendationEngine:
    def __init__(self, api_client):
        self.client = api_client
    
    def get_recommendations(self, user_id):
        """Get personalized job recommendations"""
        
        # Get user profile
        user = self.client.users.get(user_id)
        
        # Build search criteria based on user profile
        criteria = {
            'skills': user['skills'],
            'location': user['location'],
            'job_type': user['preferred_job_types'],
            'salary_min': user['expected_salary_min'],
            'remote': user['is_open_to_remote']
        }
        
        # Search for relevant jobs
        jobs = self.client.jobs.search(**criteria)
        
        # Apply ML scoring (simplified)
        scored_jobs = self.score_jobs(jobs, user)
        
        return sorted(scored_jobs, key=lambda x: x['score'], reverse=True)
    
    def score_jobs(self, jobs, user):
        """Score jobs based on user preferences"""
        scored_jobs = []
        
        for job in jobs:
            score = 0
            
            # Skill match scoring
            user_skills = set(user['skills'])
            job_skills = set(job['skills'])
            skill_match = len(user_skills.intersection(job_skills)) / len(user_skills)
            score += skill_match * 40
            
            # Salary scoring
            if job['salary_min'] and job['salary_max']:
                salary_mid = (job['salary_min'] + job['salary_max']) / 2
                expected_mid = (user['expected_salary_min'] + user['expected_salary_max']) / 2
                if salary_mid >= expected_mid:
                    score += 30
            
            # Location scoring
            if job['location'] == user['location'] or job['is_remote']:
                score += 20
            
            # Experience level scoring
            if job['experience_level'] == user['experience_level']:
                score += 10
            
            scored_jobs.append({
                **job,
                'score': score
            })
        
        return scored_jobs
```

### 2. Analytics Dashboard Integration

```javascript
class AnalyticsDashboard {
  constructor(apiClient) {
    this.client = apiClient;
  }

  async getEmployerMetrics(employerId, dateRange) {
    const [jobs, applications, ads] = await Promise.all([
      this.client.jobs.list({ employerId }),
      this.client.applications.list({ employerId }),
      this.client.ads.list({ employerId })
    ]);

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: applications.length,
      applicationRate: applications.length / jobs.length,
      adSpend: ads.reduce((sum, ad) => sum + ad.currentSpend, 0),
      adPerformance: this.calculateAdPerformance(ads)
    };
  }

  calculateAdPerformance(ads) {
    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
    const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);

    return {
      ctr: totalClicks / totalImpressions * 100,
      conversionRate: totalConversions / totalClicks * 100,
      totalImpressions,
      totalClicks,
      totalConversions
    };
  }
}
```

### 3. Automated Job Posting from ATS

```python
class ATSIntegration:
    def __init__(self, jobs_api_client, ats_api_client):
        self.jobs_api = jobs_api_client
        self.ats_api = ats_api_client
    
    def sync_jobs(self):
        """Sync job postings from ATS to 209jobs"""
        
        # Get approved jobs from ATS
        ats_jobs = self.ats_api.get_approved_jobs()
        
        for ats_job in ats_jobs:
            # Check if job already exists
            existing_job = self.jobs_api.jobs.search(
                query=ats_job['title'],
                company=ats_job['company']
            )
            
            if not existing_job['data']['jobs']:
                # Transform ATS job to 209jobs format
                job_data = self.transform_job_data(ats_job)
                
                # Create job posting
                result = self.jobs_api.jobs.create(job_data)
                
                if result['success']:
                    print(f"Created job: {job_data['title']}")
                    
                    # Update ATS with 209jobs job ID
                    self.ats_api.update_job(
                        ats_job['id'],
                        {'209jobs_id': result['data']['id']}
                    )
    
    def transform_job_data(self, ats_job):
        """Transform ATS job data to 209jobs format"""
        return {
            'title': ats_job['title'],
            'company': ats_job['company'],
            'description': ats_job['description'],
            'requirements': ats_job['requirements'],
            'location': ats_job['location'],
            'jobType': ats_job['employment_type'],
            'experienceLevel': ats_job['experience_level'],
            'salaryMin': ats_job.get('salary_min'),
            'salaryMax': ats_job.get('salary_max'),
            'skills': ats_job.get('skills', []),
            'isRemote': ats_job.get('remote', False),
            'applicationEmail': ats_job['application_email']
        }
```

## Conclusion

The 209jobs API provides a comprehensive set of tools for building job board integrations, career platforms, and recruitment solutions. This usage guide covers the most common use cases, but the API is flexible enough to support a wide variety of custom implementations.

For additional support, please refer to:
- [API Reference Documentation](./openapi.yaml)
- [Authentication Guide](./AUTHENTICATION.md)
- [Rate Limiting Documentation](./RATE_LIMITING.md)
- [Support Portal](https://support.209jobs.com)

Happy coding! 🚀 