# Search and Filter System

This document describes the comprehensive search and filter system implemented for the 209jobs API.

## Overview

The search system provides:

- **Enhanced Job Search** with relevance scoring and faceted search
- **User/Candidate Search** for employers
- **Geolocation-based Search** with radius filtering
- **Autocomplete and Suggestions** for improved UX
- **Advanced Filtering** with multiple parameters
- **Caching and Performance** optimization
- **Search Analytics** and tracking

## Quick Start

### Basic Job Search

```bash
GET /api/jobs/search?q=software+engineer&limit=20
```

### Enhanced Job Search with Filters

```bash
GET /api/jobs/search?q=react+developer&location=san+francisco&remote=true&salaryMin=80000&includeSnippets=true&includeFacets=true
```

### User Search (Employers Only)

```bash
GET /api/users/search?q=javascript&skills=react,node.js&location=remote
```

### Geolocation Search

```bash
GET /api/search/location?lat=37.7749&lng=-122.4194&radius=25&query=software+engineer
```

### Autocomplete

```bash
GET /api/search/autocomplete?q=soft&type=jobs&limit=10
```

### Search Suggestions

```bash
GET /api/search/suggestions?type=trending&category=all&limit=10
```

## API Endpoints

### 1. Enhanced Job Search

**Endpoint:** `GET /api/jobs/search`

**Features:**

- Full-text search with relevance scoring
- Geolocation-based filtering
- Faceted search capabilities
- Result snippets and highlighting
- Advanced filtering options

**Parameters:**

| Parameter                | Type    | Description                             |
| ------------------------ | ------- | --------------------------------------- |
| `q`                      | string  | Search query                            |
| `location`               | string  | Location filter                         |
| `lat`, `lng`             | number  | Coordinates for geolocation search      |
| `radius`                 | number  | Search radius in miles (1-100)          |
| `jobType`                | enum    | Job type filter                         |
| `company`                | string  | Company name filter                     |
| `remote`                 | boolean | Remote work filter                      |
| `salaryMin`, `salaryMax` | number  | Salary range filters                    |
| `datePosted`             | enum    | Date posted filter (`24h`, `7d`, `30d`) |
| `skills`                 | array   | Skills filter                           |
| `experience`             | enum    | Experience level                        |
| `includeSnippets`        | boolean | Include text snippets                   |
| `includeFacets`          | boolean | Include search facets                   |
| `useRelevanceScoring`    | boolean | Use relevance scoring                   |
| `page`, `limit`          | number  | Pagination                              |
| `cursor`                 | string  | Cursor-based pagination                 |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "item": {
          "id": "job-123",
          "title": "Senior React Developer",
          "company": "TechCorp",
          "location": "San Francisco, CA",
          "salaryMin": 120000,
          "salaryMax": 150000,
          "isRemote": true
        },
        "relevanceScore": 8.5,
        "matchedFields": ["title", "description"],
        "snippet": "We are looking for a senior React developer with experience in..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 94,
      "hasNextPage": true
    },
    "metadata": {
      "queryTime": 125,
      "cached": false,
      "facets": {
        "jobTypes": [
          { "value": "full-time", "count": 78 },
          { "value": "contract", "count": 16 }
        ],
        "salaryRanges": [
          { "range": "$80K - $100K", "count": 25 },
          { "range": "$100K - $120K", "count": 32 }
        ]
      }
    },
    "searchMetadata": {
      "query": "react developer",
      "totalResults": 94,
      "searchType": "enhanced",
      "relevanceScoring": true,
      "geolocationUsed": false,
      "filtersApplied": ["location", "remote"]
    }
  }
}
```

### 2. User/Candidate Search

**Endpoint:** `GET /api/users/search` (Employers/Admins only)

**Purpose:** Find qualified candidates

**Parameters:**

| Parameter           | Type    | Description               |
| ------------------- | ------- | ------------------------- |
| `q`                 | string  | Search query              |
| `location`          | string  | Location filter           |
| `skills`            | array   | Required skills           |
| `experience`        | enum    | Experience level          |
| `education`         | enum    | Education level           |
| `remote`            | boolean | Remote availability       |
| `workAuthorization` | enum    | Work authorization status |

**Example:**

```bash
GET /api/users/search?q=javascript&skills=react,node.js&experience=senior&remote=true
```

### 3. Geolocation Search

**Endpoint:** `GET /api/search/location`

**Purpose:** Find jobs near specific coordinates

**Parameters:**

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| `lat`     | number | ✓        | Latitude (-90 to 90)    |
| `lng`     | number | ✓        | Longitude (-180 to 180) |
| `radius`  | number | ✓        | Search radius in miles  |
| `query`   | string | ✗        | Optional search query   |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "searchLocation": {
      "lat": 37.7749,
      "lng": -122.4194,
      "radius": 25
    },
    "totalResults": 42,
    "results": [
      {
        "id": "job-456",
        "title": "Software Engineer",
        "company": "StartupCo",
        "location": "San Francisco, CA",
        "distance": 2.3,
        "relevanceScore": 7.2
      }
    ],
    "insights": {
      "averageDistance": 12.4,
      "jobTypes": [{ "type": "full-time", "count": 35, "percentage": 83.3 }],
      "salaryRange": {
        "min": 70000,
        "max": 180000,
        "average": 125000
      },
      "topCompanies": [{ "company": "Google", "jobCount": 8 }],
      "remotePercentage": 45.2
    }
  }
}
```

### 4. Autocomplete

**Endpoint:** `GET /api/search/autocomplete`

**Purpose:** Provide search suggestions as user types

**Parameters:**

| Parameter | Type   | Description                                                  |
| --------- | ------ | ------------------------------------------------------------ |
| `q`       | string | Search query (min 1 char)                                    |
| `type`    | enum   | Suggestion type (`jobs`, `companies`, `locations`, `skills`) |
| `limit`   | number | Max suggestions (1-20)                                       |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "query": "soft",
    "type": "jobs",
    "suggestions": [
      "Software Engineer",
      "Software Developer",
      "Software Architect",
      "Software QA Engineer"
    ],
    "cached": true
  }
}
```

### 5. Search Suggestions

**Endpoint:** `GET /api/search/suggestions`

**Purpose:** Get trending, popular, or recent search suggestions

**Parameters:**

| Parameter  | Type   | Description                                                  |
| ---------- | ------ | ------------------------------------------------------------ |
| `type`     | enum   | Suggestion type (`trending`, `popular`, `recent`)            |
| `category` | enum   | Category (`all`, `jobs`, `locations`, `companies`, `skills`) |
| `limit`    | number | Max suggestions                                              |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "trending",
    "category": "all",
    "suggestions": [
      {
        "query": "artificial intelligence",
        "type": "skill",
        "frequency": 89,
        "trend": "up"
      },
      {
        "query": "remote software engineer",
        "type": "job",
        "frequency": 76,
        "trend": "stable"
      }
    ]
  }
}
```

## Search Algorithms

### Relevance Scoring

The relevance scoring algorithm considers multiple factors:

**Weight Factors:**

- **Title Match** (Weight: 10): Direct matches in job title
- **Exact Title Match** (Weight: 20): Exact phrase match in title
- **Description Match** (Weight: 5): Matches in job description
- **Company Match** (Weight: 8): Matches in company name
- **Location Match** (Weight: 6): Matches in location
- **Skills Match** (Weight: 12): Matches in required skills
- **Recency** (Weight: 3): Newer jobs score higher

**Scoring Formula:**

```
Total Score = Σ(FieldMatch × Weight) + RecencyBonus
```

### Text Processing

**Normalization:**

- Convert to lowercase
- Remove special characters
- Normalize whitespace
- Filter stop words

**Keyword Extraction:**

- Extract meaningful terms (2+ characters)
- Remove common stop words
- Generate partial matches for longer words

### Geolocation Algorithm

**Distance Calculation:**
Uses Haversine formula for accurate distance calculation:

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

## Faceted Search

The system automatically generates facets for search results:

### Job Search Facets

- **Job Types**: Distribution of job types
- **Companies**: Top companies with job counts
- **Locations**: Popular job locations
- **Salary Ranges**: Predefined salary buckets
- **Recency**: Time-based filters
- **Remote Work**: Remote vs on-site distribution

### Facet Generation

```javascript
// Example facet response
{
  "jobTypes": [
    { "value": "full-time", "count": 156 },
    { "value": "contract", "count": 43 }
  ],
  "salaryRanges": [
    { "range": "$80K - $100K", "count": 34 },
    { "range": "$100K - $120K", "count": 58 }
  ],
  "remote": [
    { "value": "Remote", "count": 89 },
    { "value": "On-site", "count": 67 }
  ]
}
```

## Performance Optimization

### Caching Strategy

**Cache Layers:**

1. **Redis Cache**: Primary caching layer
2. **Search Result Caching**: TTL varies by search type
3. **Autocomplete Caching**: Medium TTL for suggestions
4. **Facet Caching**: Short TTL for dynamic data

**Cache Keys:**

```
search:jobs-enhanced:{query}:{filters}:{pagination}
search:autocomplete:{type}:{query}:{limit}
search:suggestions:{type}:{category}:{limit}
```

**TTL Strategy:**

- **Search Results**: 5 minutes (short TTL)
- **Autocomplete**: 30 minutes (medium TTL)
- **Suggestions**: 15 minutes (trending data)
- **Geolocation**: 30 minutes (location data)

### Database Optimization

**Recommended Indexes:**

```sql
-- Full-text search indexes
CREATE INDEX idx_job_title_fulltext ON job USING gin(to_tsvector('english', title));
CREATE INDEX idx_job_description_fulltext ON job USING gin(to_tsvector('english', description));
CREATE INDEX idx_job_company_fulltext ON job USING gin(to_tsvector('english', company));

-- Filter indexes
CREATE INDEX idx_job_location ON job(location);
CREATE INDEX idx_job_type ON job(job_type);
CREATE INDEX idx_job_salary ON job(salary_min, salary_max);
CREATE INDEX idx_job_remote ON job(is_remote);
CREATE INDEX idx_job_created_at ON job(created_at);

-- Geolocation indexes (if lat/lng columns exist)
CREATE INDEX idx_job_location_gist ON job USING gist(ll_to_earth(latitude, longitude));

-- User search indexes
CREATE INDEX idx_user_skills_gin ON "user" USING gin(skills);
CREATE INDEX idx_user_location ON "user"(location);
CREATE INDEX idx_user_role ON "user"(role);
```

## Error Handling

### Common Error Responses

**Validation Errors:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid search parameters",
    "details": {
      "radius": "Must be between 1 and 100 miles"
    }
  }
}
```

**Rate Limiting:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many search requests"
  }
}
```

## Usage Examples

### Frontend Integration

**React Hook for Job Search:**

```javascript
import { useState, useEffect } from 'react';

export function useJobSearch(filters) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/jobs/search?${params}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (filters.q) {
      searchJobs();
    }
  }, [filters]);

  return { results, loading };
}
```

**Autocomplete Component:**

```javascript
import { useState, useDebounce } from 'react';

function SearchAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async q => {
    const response = await fetch(
      `/api/search/autocomplete?q=${encodeURIComponent(q)}&type=jobs`
    );
    const data = await response.json();
    setSuggestions(data.data.suggestions);
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search jobs..."
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => onSelect(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Security Considerations

### Rate Limiting

- **Search endpoints**: 30 requests/minute
- **Autocomplete**: 60 requests/minute
- **Premium users**: Higher limits

### Data Privacy

- **User search**: Restricted to employers/admins
- **Email addresses**: Never exposed in search results
- **Location data**: Generalized for privacy

### Input Validation

- All search parameters are validated
- SQL injection prevention through parameterized queries
- XSS prevention through proper encoding

## Monitoring and Analytics

### Performance Metrics

- **Search latency**: Average response time
- **Cache hit ratio**: Percentage of cached responses
- **Popular queries**: Most searched terms
- **Conversion rates**: Search to application rates

### Logging

Search queries are logged for:

- Performance monitoring
- Popular query analysis
- Error tracking
- Usage analytics

## Migration Guide

### From Basic to Enhanced Search

1. **Update API calls** to use new parameters
2. **Handle faceted responses** in frontend
3. **Implement autocomplete** for better UX
4. **Add geolocation search** if needed
5. **Update error handling** for new error codes

### Database Migrations

```sql
-- Add indexes for better search performance
CREATE INDEX CONCURRENTLY idx_job_search_composite
ON job(created_at DESC, salary_min, job_type)
WHERE created_at > NOW() - INTERVAL '90 days';

-- Add geolocation columns if implementing location search
ALTER TABLE job ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE job ADD COLUMN longitude DECIMAL(11,8);
CREATE INDEX idx_job_coordinates ON job USING gist(ll_to_earth(latitude, longitude));
```

## Future Enhancements

### Planned Features

1. **Machine Learning Recommendations**
2. **Semantic Search** with embeddings
3. **Search Analytics Dashboard**
4. **Advanced Saved Searches**
5. **Real-time Search Updates**
6. **Multi-language Support**

### Performance Improvements

1. **Elasticsearch Integration**
2. **Search Result Clustering**
3. **Predictive Caching**
4. **Edge Caching** with CDN

---

For more information, see:

- [API Middleware Documentation](./API_MIDDLEWARE.md)
- [Caching and Pagination Documentation](./CACHING_PAGINATION.md)
- [API Validation Documentation](./API_VALIDATION.md)
