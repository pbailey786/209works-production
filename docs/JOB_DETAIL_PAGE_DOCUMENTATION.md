# Job Detail Page Documentation

## Overview

The Job Detail Page is a comprehensive implementation that provides detailed job information, user interactions, and SEO optimization. This page serves as the primary destination for users to view complete job listings and take actions like saving, sharing, and applying for jobs.

## Architecture

### File Structure

```
src/app/jobs/[id]/
├── page.tsx              # Server-side rendered page component
├── JobDetailClient.tsx   # Client-side interactive components
└── loading.tsx           # Loading UI (if implemented)
```

### Core Components

#### 1. Server Component (`page.tsx`)

- **Purpose**: Handles server-side rendering, metadata generation, and data fetching
- **Key Functions**:
  - `getJob()`: Fetches job data from database
  - `getRelatedJobs()`: Retrieves similar jobs based on categories and location
  - `isJobSaved()`: Checks if the job is saved by the current user
  - `generateMetadata()`: Creates dynamic SEO metadata

#### 2. Client Component (`JobDetailClient.tsx`)

- **Purpose**: Handles interactive features and user actions
- **Key Features**:
  - Save/unsave job functionality
  - Job sharing with Web Share API fallback
  - Job reporting modal and form
  - Related jobs display
  - Responsive design with animations

## Implemented Features

### 1. Job Information Display

- **Complete Job Details**: Title, company, location, description, requirements
- **Salary Information**: Range display with formatting (`$XX,XXX - $XX,XXX`)
- **Job Metadata**: Type, categories, posted date
- **Company Information**: Display with company website links (when available)

### 2. User Interactions

#### Save Job Feature

- **Authentication Check**: Redirects to sign-in if not authenticated
- **Toggle Functionality**: Save/unsave with immediate UI feedback
- **Database Integration**: Uses `JobApplication` model with 'saved' status
- **API Endpoint**: `POST /api/jobs/save`

#### Share Job Feature

- **Web Share API**: Native sharing on supported devices
- **Clipboard Fallback**: Copy link to clipboard for non-supporting browsers
- **Share Data**: Includes title, description, and current URL

#### Report Job Feature

- **Modal Interface**: User-friendly reporting form
- **Validation**: Minimum 10 characters for report reason
- **Logging System**: Stores reports in `job-reports.log` file
- **Success Feedback**: Visual confirmation after submission

### 3. Navigation & UX

#### Breadcrumb Navigation

```typescript
Home > Jobs > [Job Title]
```

- **Responsive Design**: Truncates long job titles
- **Navigation Links**: Clickable breadcrumb items

#### Related Jobs

- **Smart Recommendations**: Based on job categories and location
- **Sidebar Display**: Shows 3-5 related positions
- **Quick Navigation**: Direct links to other job detail pages

### 4. SEO Optimization

#### Dynamic Metadata

```typescript
{
  title: `${job.title} at ${job.company} | 209Jobs`,
  description: `${job.description.substring(0, 160)}...`,
  keywords: [job.title, job.company, job.location, job.type, ...job.categories],
  openGraph: {...},
  twitter: {...}
}
```

#### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "...",
  "description": "...",
  "hiringOrganization": {...},
  "jobLocation": {...},
  "baseSalary": {...}
}
```

### 5. Application Process

- **External Links**: Direct users to original job posting
- **Apply Button**: Prominent call-to-action
- **Source Attribution**: Clear indication of job source (e.g., Indeed, LinkedIn)

## API Endpoints

### 1. Job Data (`GET /api/jobs/[id]`)

- **Purpose**: Fetch individual job details
- **Response**: Complete job object with all fields
- **Error Handling**: 404 for non-existent jobs

### 2. Save Job (`POST /api/jobs/save`)

- **Purpose**: Save or unsave jobs for authenticated users
- **Request Body**: `{ jobId: string }`
- **Response**: `{ saved: boolean, message: string }`
- **Database**: Uses `JobApplication` model with 'saved' status

### 3. Report Job (`POST /api/jobs/report`)

- **Purpose**: Report inappropriate or fraudulent job listings
- **Request Body**: `{ jobId: string, reason: string, reporterUserId?: string }`
- **Validation**: Minimum 10 characters for reason
- **Logging**: Stores reports in file system and console

## Database Schema Integration

### Jobs Table

```sql
Job {
  id: String (UUID)
  title: String
  company: String
  description: Text
  location: String
  type: JobType (enum)
  categories: String[]
  salaryMin: Int?
  salaryMax: Int?
  url: String
  source: String
  postedAt: DateTime
  embedding: Float[] (for semantic search)
}
```

### Job Applications Table

```sql
JobApplication {
  id: String (UUID)
  userId: String
  jobId: String
  status: String ('saved', 'applied', etc.)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Responsive Design

### Mobile Optimization

- **Flexible Layout**: Grid system adapts to screen size
- **Touch-Friendly**: Large buttons and touch targets
- **Readable Typography**: Optimized font sizes and line heights
- **Compressed Navigation**: Collapsible elements on smaller screens

### Desktop Features

- **Sidebar Layout**: Related jobs in dedicated sidebar
- **Expanded Actions**: All action buttons visible
- **Rich Typography**: Enhanced readability with larger screens

## Performance Considerations

### Server-Side Rendering

- **SEO Benefits**: Complete HTML rendered on server
- **Fast Initial Load**: Content visible immediately
- **Dynamic Metadata**: Generated per job for optimal sharing

### Client-Side Optimizations

- **Code Splitting**: JobDetailClient loaded separately
- **Image Optimization**: Next.js automatic image optimization
- **Animation Performance**: Framer Motion with GPU acceleration

### Caching Strategy

- **Database Queries**: Optimized with proper indexing
- **Related Jobs**: Cached based on categories and location
- **Static Assets**: Leverages Next.js static optimization

## Accessibility Features

### ARIA Labels

- **Screen Reader Support**: Descriptive labels for all interactive elements
- **Semantic HTML**: Proper heading hierarchy and structure
- **Focus Management**: Keyboard navigation support

### Visual Design

- **Color Contrast**: WCAG 2.1 AA compliant color schemes
- **Font Sizes**: Scalable typography for visual accessibility
- **Interactive States**: Clear hover and focus indicators

## Future Enhancements (Prepared For)

### Commute-Based Features

- **Location Coordinates**: Jobs stored with lat/lng for distance calculations
- **UI Placeholders**: Space reserved for commute time display
- **API Integration Points**: Ready for Google Maps/transit APIs

### Advanced Interactions

- **Job Comparison**: Framework for comparing multiple positions
- **Application Tracking**: Enhanced status tracking for applied jobs
- **Personalized Recommendations**: ML-based job suggestions

## Testing Strategy

### Unit Tests

- **Component Testing**: Individual component functionality
- **API Testing**: Endpoint validation and error handling
- **Utility Functions**: Date formatting, salary display, etc.

### Integration Tests

- **User Flows**: Complete save/share/report workflows
- **Database Integration**: Data persistence and retrieval
- **Authentication**: Protected routes and user-specific features

### Cross-Browser Testing

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Feature Degradation**: Graceful fallbacks for unsupported features

## Error Handling

### Client-Side Errors

- **Network Failures**: User-friendly error messages
- **Authentication Issues**: Redirect to sign-in when appropriate
- **Validation Errors**: Inline form validation feedback

### Server-Side Errors

- **404 Handling**: Custom not found page for missing jobs
- **Database Errors**: Graceful error responses
- **External API Failures**: Fallback strategies for job data

## Security Considerations

### Input Validation

- **Report Reasons**: Server-side validation and sanitization
- **SQL Injection**: Prisma ORM protections
- **XSS Prevention**: Proper HTML escaping

### Authentication

- **Protected Actions**: Save/report require authentication
- **Session Management**: NextAuth.js integration
- **CSRF Protection**: Built-in Next.js protections

## Monitoring and Analytics

### Performance Monitoring

- **Page Load Times**: Core Web Vitals tracking
- **API Response Times**: Database query performance
- **Error Rates**: Client and server error tracking

### User Analytics

- **Job Views**: Track popular job listings
- **Save Rates**: Monitor job save frequency
- **Report Analytics**: Track report submissions and reasons

## Development Guidelines

### Code Organization

- **Separation of Concerns**: Server/client component split
- **Reusable Components**: Shared UI elements
- **Type Safety**: Full TypeScript implementation

### API Design

- **RESTful Conventions**: Standard HTTP methods and status codes
- **Error Responses**: Consistent error format
- **Response Schemas**: Predictable data structures

### Database Design

- **Normalization**: Efficient data storage
- **Indexing**: Optimized query performance
- **Relationships**: Proper foreign key constraints
