# Job Search API Endpoint Documentation

## Endpoint

`GET /api/v1/jobs/search`

---

## Query Parameters

| Name       | Type    | Description                              | Required | Example     |
| ---------- | ------- | ---------------------------------------- | -------- | ----------- |
| q          | string  | Search keyword(s)                        | No       | developer   |
| location   | string  | City, state, or zip                      | No       | NYC         |
| radius     | number  | Search radius in miles/km                | No       | 25          |
| jobType    | string  | Job type (full-time, part-time, etc.)    | No       | full-time   |
| category   | string  | Job category/industry                    | No       | engineering |
| datePosted | string  | Date (ISO) or relative (e.g., last7days) | No       | 2024-06-01  |
| sortBy     | string  | Sort order: relevance, date              | No       | date        |
| page       | integer | Pagination page                          | No       | 1           |
| limit      | integer | Results per page (max 100)               | No       | 20          |

---

## Request Example

```
GET /api/v1/jobs/search?q=developer&location=NYC&radius=25&jobType=full-time&category=engineering&datePosted=2024-06-01&sortBy=date&page=1&limit=20
```

---

## Response Example

```json
{
  "results": [
    {
      "id": "123",
      "title": "Frontend Developer",
      "company": "Acme Corp",
      "location": "New York, NY",
      "type": "Full-time",
      "category": "Engineering",
      "datePosted": "2024-06-01",
      "description": "Job summary...",
      "applyUrl": "https://..."
    }
    // ...more jobs
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalResults": 120,
    "totalPages": 6
  }
}
```

---

## Error Responses

- **400 Bad Request**
  ```json
  { "error": "Invalid query parameter: radius must be a number" }
  ```
- **500 Server Error**
  ```json
  { "error": "Internal server error" }
  ```

---

## Parameter Validation Rules

- `q`, `location`, `jobType`, `category`: optional, string
- `radius`, `page`, `limit`: optional, must be positive numbers
- `datePosted`: optional, ISO date string or relative (e.g., `last7days`)
- `sortBy`: optional, must be one of `relevance`, `date`
- `limit`: max 100

---

## Authentication

- Public search: No authentication required
- Saving jobs/alerts: Requires authentication (handled elsewhere)

---

## Versioning

- Endpoint is versioned: `/api/v1/jobs/search`

---

## Testing Plan

- Valid/invalid parameters
- Pagination
- Empty results
- Error handling

---

## OpenAPI Spec

See [`openapi/jobs-search.yaml`](./jobs-search.yaml) for the full OpenAPI 3.0 contract.
