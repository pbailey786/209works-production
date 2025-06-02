# Server Actions Documentation

## Overview

This document provides a comprehensive overview of all server actions implemented in the 209jobs application. These server actions enable secure, type-safe form handling and data mutations using Next.js App Router's built-in server actions feature.

## Architecture

All server actions follow a consistent pattern:
- **Type Safety**: Full TypeScript support with Zod validation
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Security**: Authentication checks and authorization validation
- **Performance**: Optimized database queries with proper indexing
- **Caching**: Strategic cache invalidation using `revalidatePath()`

## Action Categories

### 1. Authentication Actions (`src/actions/auth.ts`)

#### Core Features
- **User Registration**: Sign up for jobseekers and employers
- **Authentication**: Sign in with email/password
- **2FA Support**: Two-factor authentication setup and verification
- **Password Management**: Reset and change password functionality
- **Email Verification**: Account verification workflow

#### Available Actions

```typescript
// Sign up new user
signUpAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Sign in existing user
signInAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Sign out user
signOutAction(): Promise<void>

// Request password reset
requestPasswordResetAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Reset password with token
resetPasswordAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Verify email address
verifyEmailAction(token: string): Promise<ActionResult>

// Setup 2FA
setup2FAAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Verify 2FA code
verify2FAAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Disable 2FA
disable2FAAction(userId: string): Promise<ActionResult>
```

#### Security Features
- Password hashing with bcrypt (12 rounds)
- Secure token generation for verification
- Session management for 2FA
- Email confirmation security
- Rate limiting support

---

### 2. Job Management Actions (`src/actions/jobs.ts`)

#### Core Features
- **Job Posting**: Create and manage job listings
- **Job Applications**: Apply to jobs with validation
- **Job Search**: Advanced search with filters
- **Job Saving**: Save/unsave jobs for later
- **Status Management**: Toggle job visibility

#### Available Actions

```typescript
// Create new job posting (employers only)
createJobAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Update existing job
updateJobAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Delete job posting
deleteJobAction(jobId: string, userId: string): Promise<ActionResult>

// Apply to a job (jobseekers only)
applyToJobAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Save/unsave job
saveJobAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Search jobs with filters
searchJobsAction(prevState: any, formData: FormData): Promise<{
  jobs: any[];
  totalCount: number;
  currentPage: number;
}>

// Toggle job active/paused status
toggleJobStatusAction(jobId: string, userId: string): Promise<ActionResult>
```

#### Validation Features
- Comprehensive job posting validation
- Application deadline enforcement
- Duplicate application prevention
- Salary range validation
- Skills and requirements validation

---

### 3. User Management Actions (`src/actions/users.ts`)

#### Core Features
- **Profile Management**: Update user profiles with role-specific fields
- **Privacy Settings**: Control profile visibility and data sharing
- **Notification Preferences**: Manage email, push, and SMS notifications
- **Resume Management**: Upload and manage resume files
- **Account Management**: Password changes and account deletion

#### Available Actions

```typescript
// Update user profile
updateProfileAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Update notification preferences
updateNotificationPreferencesAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Update privacy settings
updatePrivacySettingsAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Change password
changePasswordAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Upload resume
uploadResumeAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Delete account
deleteAccountAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Get user profile (with privacy controls)
getUserProfileAction(profileUserId: string, currentUserId?: string): Promise<{
  user: any | null;
  canViewProfile: boolean;
  isOwnProfile: boolean;
}>

// Search users (for employers)
searchUsersAction(formData: FormData): Promise<{
  users: any[];
  totalCount: number;
  currentPage: number;
}>
```

#### Privacy Features
- **Profile Visibility**: Public, private, or employers-only
- **Data Control**: Choose what information to show
- **Search Settings**: Control discoverability
- **Role-based Access**: Different permissions for employers vs jobseekers

---

### 4. Alert Management Actions (`src/actions/alerts.ts`)

#### Core Features
- **Smart Alerts**: AI-powered job matching with relevance scoring
- **Alert Testing**: Preview and optimize alert criteria
- **Bulk Operations**: Manage multiple alerts efficiently
- **Match Quality**: Analyze and improve search criteria

#### Available Actions

```typescript
// Create job alert
createAlertAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Update alert criteria
updateAlertAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Delete alert
deleteAlertAction(alertId: string, userId: string): Promise<ActionResult>

// Toggle alert active/inactive
toggleAlertStatusAction(alertId: string, userId: string): Promise<ActionResult>

// Test alert and get recommendations
testAlertAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Bulk operations on alerts
bulkAlertOperationAction(
  operation: 'activate' | 'deactivate' | 'delete',
  alertIds: string[],
  userId: string
): Promise<ActionResult>
```

#### Smart Features
- **Relevance Scoring**: 7-factor scoring system for job matching
- **Match Quality Analysis**: Provides feedback on search criteria effectiveness
- **Optimization Recommendations**: AI-generated suggestions to improve results
- **Notification Preview**: See exactly what alerts will look like

---

### 5. Advertisement Actions (`src/actions/ads.ts`)

#### Core Features
- **Campaign Management**: Create and manage advertising campaigns
- **Performance Tracking**: Real-time analytics and reporting
- **Budget Control**: Automatic budget monitoring and limits
- **Multiple Ad Types**: Support for various advertising formats

#### Available Actions

```typescript
// Create advertisement
createAdAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Update advertisement
updateAdAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Delete advertisement
deleteAdAction(adId: string, userId: string): Promise<ActionResult>

// Track ad impression
trackImpressionAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Track ad click
trackClickAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Track conversion
trackConversionAction(prevState: ActionResult | null, formData: FormData): Promise<ActionResult>

// Get analytics data
getAdAnalyticsAction(
  adId: string,
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ success: boolean; data?: any; message?: string; }>

// Bulk ad operations
bulkAdOperationAction(
  operation: 'activate' | 'pause' | 'archive',
  adIds: string[],
  userId: string
): Promise<ActionResult>
```

#### Business Features
- **Multiple Bidding Models**: CPC, CPM, flat-rate pricing
- **Advanced Targeting**: Geographic, demographic, and behavioral targeting
- **Real-time Budget Tracking**: Automatic pause when budgets are exceeded
- **Comprehensive Analytics**: CTR, conversion rates, ROI calculation
- **Fraud Prevention**: Duplicate detection and validation

---

## Common Patterns

### Error Handling
All actions return a consistent `ActionResult` type:

```typescript
export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
};
```

### Validation
- **Zod Integration**: All inputs validated with Zod schemas
- **Type Safety**: Full TypeScript support throughout
- **Custom Validators**: Business logic validation (e.g., budget limits, date ranges)

### Security
- **Authentication**: User session validation
- **Authorization**: Role-based access control
- **Input Sanitization**: All inputs validated and sanitized
- **Rate Limiting**: Protection against abuse

### Performance
- **Database Optimization**: Efficient queries with proper indexing
- **Cache Strategy**: Strategic `revalidatePath()` usage
- **Pagination**: Large datasets handled efficiently
- **Bulk Operations**: Optimized for multiple record operations

---

## Usage Examples

### Using with Next.js Forms

```typescript
import { useFormState } from 'react-dom';
import { signInAction } from '@/actions/auth';

export function SignInForm() {
  const [state, formAction] = useFormState(signInAction, null);
  
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Using with useTransition

```typescript
import { useTransition } from 'react';
import { deleteJobAction } from '@/actions/jobs';

export function DeleteJobButton({ jobId, userId }: { jobId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();
  
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteJobAction(jobId, userId);
      if (result.success) {
        // Handle success
      } else {
        // Handle error
      }
    });
  };
  
  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete Job'}
    </button>
  );
}
```

---

## Integration Points

### Database
- **Prisma ORM**: All database operations use Prisma client
- **Transaction Support**: Critical operations wrapped in transactions
- **Relationship Management**: Proper cascade handling for deletions

### Validation
- **Shared Schemas**: Reuses validation schemas from `/lib/validations/`
- **Type Safety**: Full TypeScript integration
- **Custom Validation**: Business-specific validation rules

### Caching
- **Next.js Cache**: Integrates with Next.js caching system
- **Strategic Invalidation**: Targeted cache clearing for optimal performance
- **Real-time Updates**: Immediate UI updates after successful actions

---

## Security Considerations

### Authentication
- All actions verify user authentication before execution
- Session-based security for 2FA workflows
- Secure token generation and validation

### Authorization
- Role-based access control (jobseeker, employer, admin)
- Resource ownership verification
- Action-specific permissions

### Data Protection
- Input sanitization and validation
- SQL injection prevention through Prisma
- XSS protection through proper data handling

### Rate Limiting
- Built-in protection against abuse
- Configurable limits per action type
- User-specific and global limits

---

## Performance Optimizations

### Database
- Optimized queries with minimal data selection
- Proper indexing for search operations
- Connection pooling through Prisma

### Caching
- Strategic cache invalidation
- Minimal cache clearing for better performance
- Redis integration for advanced caching needs

### Bulk Operations
- Optimized for handling multiple records
- Transaction-based for consistency
- Limited batch sizes to prevent timeouts

---

## Future Enhancements

### Planned Features
- **Background Jobs**: Long-running operations moved to background
- **Enhanced Analytics**: More detailed tracking and reporting
- **API Rate Limiting**: More sophisticated rate limiting
- **Audit Logging**: Comprehensive action logging for compliance

### Scalability Improvements
- **Database Sharding**: Support for horizontal scaling
- **Microservices**: Potential separation of concerns
- **Caching Layers**: Advanced caching strategies
- **Message Queues**: Asynchronous processing for heavy operations

---

## Conclusion

The server actions system provides a robust, type-safe, and performant foundation for the 209jobs application. With comprehensive validation, security measures, and optimized performance, these actions enable seamless user interactions while maintaining data integrity and security.

Each action is designed to be:
- **Reliable**: Comprehensive error handling and validation
- **Secure**: Authentication, authorization, and input validation
- **Performant**: Optimized database queries and caching
- **Maintainable**: Consistent patterns and clear documentation
- **Scalable**: Built to handle growing user base and data volumes 