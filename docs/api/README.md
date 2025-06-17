# 209jobs API Documentation

Welcome to the comprehensive documentation for the 209jobs API! This documentation provides everything you need to integrate with our job board platform and build powerful recruitment solutions.

## 📋 Quick Start

1. **[Get API Access](#getting-started)** - Sign up and get your credentials
2. **[Authentication](#authentication)** - Set up secure API access
3. **[First API Call](#first-api-call)** - Make your first request
4. **[Explore Endpoints](#api-reference)** - Discover all available features

## 📚 Documentation Overview

### Core Documentation

| Document                                                    | Description                                                      | Audience      |
| ----------------------------------------------------------- | ---------------------------------------------------------------- | ------------- |
| [OpenAPI Specification](./openapi.yaml)                     | Complete API reference with all endpoints, schemas, and examples | Developers    |
| [Usage Guide](./USAGE_GUIDE.md)                             | Comprehensive guide with practical examples and best practices   | All users     |
| [Authentication Guide](./AUTHENTICATION.md)                 | Detailed authentication methods, security, and implementation    | Developers    |
| [Postman Collection](./209jobs-api.postman_collection.json) | Ready-to-use collection for API testing                          | QA/Developers |

### Additional Resources

- **[Rate Limiting](#rate-limiting)** - Understand API limits and best practices
- **[Error Codes](#error-handling)** - Complete error reference guide
- **[Webhooks](#webhooks)** - Real-time event notifications
- **[SDKs](#official-sdks)** - Official client libraries
- **[Examples](#code-examples)** - Sample implementations

## 🚀 Getting Started

### Prerequisites

- A 209jobs account ([Sign up here](https://209jobs.com/signup))
- Basic understanding of REST APIs
- Development environment (any language that supports HTTP requests)

### API Endpoints

| Environment    | Base URL                             | Purpose                 |
| -------------- | ------------------------------------ | ----------------------- |
| **Production** | `https://api.209jobs.com/v1`         | Live applications       |
| **Staging**    | `https://api-staging.209jobs.com/v1` | Testing and development |
| **Local**      | `http://localhost:3000/api`          | Local development       |

### Authentication Options

1. **JWT Tokens** (Recommended for user-facing apps)

   - Secure, stateless authentication
   - Automatic expiration and refresh
   - Role-based access control

2. **API Keys** (Recommended for server-to-server)
   - Simple, persistent authentication
   - Scoped permissions
   - Easy key rotation

## 🔧 First API Call

### Using cURL

```bash
# Search for jobs (no authentication required)
curl -X GET "https://api.209jobs.com/v1/jobs?query=software+engineer&location=San+Francisco" \
  -H "Content-Type: application/json"
```

### Using JavaScript

```javascript
// Using fetch API
const response = await fetch(
  'https://api.209jobs.com/v1/jobs?query=software+engineer'
);
const data = await response.json();
console.log(data);
```

### Using Python

```python
import requests

response = requests.get('https://api.209jobs.com/v1/jobs',
                       params={'query': 'software engineer'})
data = response.json()
print(data)
```

## 🔐 Authentication

### JWT Token Authentication

Perfect for web and mobile applications:

```bash
# Login to get JWT token
curl -X POST https://api.209jobs.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Key Authentication

Ideal for server-to-server integrations:

```bash
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "X-API-Key: sk_live_your_api_key_here"
```

**📖 [Complete Authentication Guide →](./AUTHENTICATION.md)**

## 🎯 Core Features

### 🔍 Job Management

**Search & Filter Jobs**

- Full-text search across titles and descriptions
- Location-based filtering with radius support
- Salary range, job type, and experience level filters
- Skills-based filtering and company search
- Advanced semantic search with AI

**Job Posting (Employers)**

- Create and manage job listings
- Update job details and status
- Track application metrics
- Set expiration dates

**Job Applications (Jobseekers)**

- Submit applications with cover letters
- Track application status
- Save jobs for later
- Application history

### 👤 User Management

**Profile Management**

- Role-based profiles (jobseeker/employer/admin)
- Privacy settings and visibility controls
- Skills, experience, and preference management
- Professional portfolio links

**User Search (Employers)**

- Find qualified candidates
- Filter by skills, experience, and location
- Respect user privacy settings

### 🔔 Smart Alerts

**AI-Powered Job Matching**

- Create alerts with detailed criteria
- 7-factor relevance scoring system
- Smart recommendations for optimization
- Test alerts before activation

**Flexible Notifications**

- Multiple frequency options (immediate, daily, weekly, monthly)
- Email, push, and SMS notifications
- Customizable result limits

### 📈 Advertisement Platform

**Campaign Management**

- Multiple ad types (banner, sponsored search, native)
- Advanced targeting options
- Budget controls and optimization
- A/B testing capabilities

**Real-time Analytics**

- Impressions, clicks, and conversion tracking
- CTR and conversion rate analysis
- ROI calculation and optimization insights
- Custom reporting and insights

## ⚡ Rate Limiting

API endpoints are rate-limited to ensure fair usage:

| Authentication Type   | Requests per Minute |
| --------------------- | ------------------- |
| Unauthenticated       | 20                  |
| JWT Token             | 100                 |
| API Key (Development) | 50                  |
| API Key (Production)  | 200                 |
| Admin                 | 500                 |

**Rate Limit Headers:**

- `X-RateLimit-Limit`: Request limit per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## 🛠️ Error Handling

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": {
    /* field-specific errors */
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes

| Code | Meaning               | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 429  | Too Many Requests     | Rate limit exceeded           |
| 500  | Internal Server Error | Server error                  |

## 🔗 Webhooks

Receive real-time notifications for important events:

### Supported Events

- `job.applied` - New job application received
- `alert.matched` - Job alert found matching jobs
- `ad.performance` - Advertisement performance updates
- `user.registered` - New user registration
- `payment.completed` - Payment transaction completed

### Webhook Setup

```bash
curl -X POST https://api.209jobs.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/209jobs",
    "events": ["job.applied", "alert.matched"],
    "secret": "your-webhook-secret"
  }'
```

## 📦 Official SDKs

### JavaScript/TypeScript

```bash
npm install @209jobs/api-client
```

```javascript
import { JobsAPI } from '@209jobs/api-client';

const client = new JobsAPI({
  apiKey: 'your-api-key',
  environment: 'production',
});

const jobs = await client.jobs.search({
  query: 'software engineer',
  location: 'San Francisco',
});
```

### Python

```bash
pip install py209jobs
```

```python
from py209jobs import JobsAPI

client = JobsAPI(api_key='your-api-key')
jobs = client.jobs.search(query='software engineer', location='San Francisco')
```

### Other Languages

- **PHP**: `composer require 209jobs/api-client`
- **Java**: `com.209jobs:api-client`
- **Ruby**: `gem install jobs209-api`
- **Go**: `go get github.com/209jobs/go-client`

## 📋 Code Examples

### Complete Job Search with Filters

```javascript
async function searchJobs() {
  const response = await fetch(
    'https://api.209jobs.com/v1/jobs?' +
      new URLSearchParams({
        query: 'senior react developer',
        location: 'San Francisco',
        remote: 'true',
        jobType: 'full-time',
        salaryMin: '100000',
        skills: 'React,TypeScript,Node.js',
        page: '1',
        limit: '20',
      })
  );

  const data = await response.json();

  if (data.success) {
    console.log(`Found ${data.data.totalCount} jobs`);
    data.data.jobs.forEach(job => {
      console.log(
        `${job.title} at ${job.company} - $${job.salaryMin}-${job.salaryMax}`
      );
    });
  }
}
```

### Creating a Job Alert

```python
import requests

def create_job_alert(token):
    url = 'https://api.209jobs.com/v1/alerts'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    alert_data = {
        'name': 'Senior React Developer Opportunities',
        'criteria': {
            'keywords': ['React', 'Frontend', 'JavaScript'],
            'location': 'San Francisco',
            'remote': True,
            'experienceLevel': 'senior',
            'salaryMin': 120000
        },
        'frequency': 'daily',
        'maxResults': 10
    }

    response = requests.post(url, json=alert_data, headers=headers)
    return response.json()
```

### Advertisement Campaign Management

```bash
# Create advertisement campaign
curl -X POST https://api.209jobs.com/v1/ads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hire Top Developers",
    "type": "sponsored_search",
    "content": {
      "headline": "Join Our Development Team",
      "ctaText": "Apply Now",
      "ctaUrl": "https://company.com/careers"
    },
    "targeting": {
      "professional": {
        "skills": ["JavaScript", "React", "Node.js"],
        "experienceLevels": ["mid", "senior"]
      }
    },
    "biddingModel": "cpc",
    "bidAmount": 2.50,
    "dailyBudget": 100
  }'
```

## 🧪 Testing with Postman

1. **Download** the [Postman Collection](./209jobs-api.postman_collection.json)
2. **Import** into Postman
3. **Set Environment Variables**:
   - `base_url`: `https://api.209jobs.com/v1`
   - `api_key`: Your API key
4. **Run Authentication** requests to get JWT tokens
5. **Explore** all endpoints with pre-configured examples

## 🔍 API Reference

### Endpoint Categories

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/2fa/setup` - Setup 2FA
- `POST /auth/verify` - Verify email

#### Jobs

- `GET /jobs` - Search jobs
- `POST /jobs` - Create job (employers)
- `GET /jobs/{id}` - Get job details
- `PUT /jobs/{id}` - Update job
- `DELETE /jobs/{id}` - Delete job
- `POST /jobs/{id}/apply` - Apply to job
- `POST /jobs/semantic-search` - AI job search

#### Users

- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update profile
- `GET /users/{id}/applications` - Get applications
- `GET /users/search` - Search users (employers)

#### Alerts

- `GET /alerts` - Get user alerts
- `POST /alerts` - Create alert
- `GET /alerts/{id}` - Get alert details
- `PUT /alerts/{id}` - Update alert
- `DELETE /alerts/{id}` - Delete alert
- `POST /alerts/{id}/test` - Test alert

#### Advertisements

- `GET /ads` - Get advertisements
- `POST /ads` - Create ad campaign
- `GET /ads/{id}` - Get ad details & analytics
- `PUT /ads/{id}` - Update advertisement
- `DELETE /ads/{id}` - Delete advertisement

#### Ad Tracking

- `POST /ads/impression` - Track impression
- `POST /ads/click` - Track click
- `POST /ads/conversion` - Track conversion
- `GET /ads/stats` - Get analytics

**📖 [Complete API Reference →](./openapi.yaml)**

## 🌐 Interactive Documentation

Access our interactive API documentation:

- **Swagger UI**: [https://docs.209jobs.com/api](https://docs.209jobs.com/api)
- **Redoc**: [https://docs.209jobs.com/redoc](https://docs.209jobs.com/redoc)

## 💬 Support & Community

### Get Help

- **Documentation**: You're here! 📚
- **Support Portal**: [https://support.209jobs.com](https://support.209jobs.com)
- **Email Support**: [api-support@209jobs.com](mailto:api-support@209jobs.com)
- **Status Page**: [https://status.209jobs.com](https://status.209jobs.com)

### Community

- **Developer Forum**: [https://community.209jobs.com](https://community.209jobs.com)
- **Discord**: [Join our Discord](https://discord.gg/209jobs)
- **GitHub**: [https://github.com/209jobs](https://github.com/209jobs)
- **Twitter**: [@209jobs_dev](https://twitter.com/209jobs_dev)

### Contributing

- **Report Issues**: [GitHub Issues](https://github.com/209jobs/api-docs/issues)
- **Suggest Features**: [Feature Requests](https://github.com/209jobs/api-docs/discussions)
- **Improve Docs**: [Documentation PRs](https://github.com/209jobs/api-docs/pulls)

## 📝 Changelog

### Version 1.0.0 (Current)

- ✅ Complete API specification
- ✅ Authentication system with JWT & API keys
- ✅ Job management and search functionality
- ✅ User profiles and role-based access
- ✅ Smart job alerts with AI matching
- ✅ Advertisement platform with analytics
- ✅ Real-time tracking and webhooks
- ✅ Rate limiting and security features

### Upcoming Features

- 🔄 GraphQL API endpoint
- 🔄 Bulk import/export functionality
- 🔄 Advanced analytics dashboards
- 🔄 Machine learning job recommendations
- 🔄 Video interview integration

## 📄 Legal

- **[Terms of Service](https://209jobs.com/terms)**
- **[Privacy Policy](https://209jobs.com/privacy)**
- **[API License Agreement](https://209jobs.com/api-license)**

---

## 🎉 Ready to Get Started?

1. **[Sign up for an account](https://209jobs.com/signup)** if you haven't already
2. **[Generate your API credentials](https://209jobs.com/dashboard/api)**
3. **[Try the Postman collection](./209jobs-api.postman_collection.json)** for quick testing
4. **[Read the usage guide](./USAGE_GUIDE.md)** for detailed implementation examples
5. **[Join our community](https://community.209jobs.com)** to connect with other developers

Happy coding! 🚀

---

**Last Updated**: January 2024  
**API Version**: v1.0.0  
**Documentation Version**: 1.0.0
