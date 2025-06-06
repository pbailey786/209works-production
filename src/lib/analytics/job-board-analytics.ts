/**
 * Job Board Analytics Service
 * Comprehensive tracking for all job board interactions and business events
 */

import { usePostHog } from './posthog-provider';

// Event Types
export interface JobSearchEvent {
  searchQuery: string;
  filters: {
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    categories?: string[];
    remote?: boolean;
    experienceLevel?: string;
  };
  results: {
    totalCount: number;
    hasMore: boolean;
    searchTime: number; // milliseconds
    page: number;
  };
  source: 'homepage' | 'jobs_page' | 'header_search' | 'mobile_search';
}

export interface JobViewEvent {
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  categories: string[];
  postedAt: string;
  viewSource:
    | 'search_results'
    | 'featured'
    | 'related'
    | 'direct_link'
    | 'email';
  timeOnPage?: number; // seconds
}

export interface JobApplicationEvent {
  jobId: string;
  jobTitle: string;
  company: string;
  applicationMethod: 'direct' | 'external' | 'email' | 'phone';
  hasResume: boolean;
  hasCoverLetter: boolean;
  applicationSource: 'job_detail' | 'quick_apply' | 'saved_jobs';
  timeToApply?: number; // seconds from job view to application
}

export interface UserRegistrationEvent {
  userType: 'jobseeker' | 'employer';
  registrationMethod: 'email' | 'google' | 'linkedin';
  source: 'homepage' | 'job_application' | 'job_posting' | 'direct';
  hasResume: boolean;
  profileCompleteness: number; // percentage
}

export interface JobPostingEvent {
  jobId: string;
  employerId: string;
  jobTitle: string;
  jobType: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  categories: string[];
  postingMethod: 'manual' | 'bulk_upload' | 'api';
  isPromoted: boolean;
  timeToPost: number; // seconds from start to completion
}

export interface EmailAlertEvent {
  alertId: string;
  userId: string;
  alertType: 'job_search' | 'company_updates' | 'industry_news';
  frequency: 'daily' | 'weekly' | 'instant';
  filters: {
    keywords?: string[];
    location?: string;
    jobType?: string;
    categories?: string[];
  };
  source: 'job_search' | 'profile' | 'homepage';
}

export interface UserEngagementEvent {
  sessionId: string;
  userId?: string;
  sessionDuration: number; // seconds
  pageViews: number;
  jobsViewed: number;
  searchesPerformed: number;
  applicationsStarted: number;
  applicationsCompleted: number;
  bounceRate: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  trafficSource: 'organic' | 'direct' | 'social' | 'email' | 'paid';
}

/**
 * Job Board Analytics Hook
 * Provides comprehensive tracking for all job board events
 */
export function useJobBoardAnalytics() {
  const { trackEvent, identifyUser, isInitialized } = usePostHog();

  // Job Search Tracking
  const trackJobSearch = (event: JobSearchEvent) => {
    if (!isInitialized) return;

    trackEvent('job_search_performed', {
      // Search details
      search_query: event.searchQuery,
      search_query_length: event.searchQuery.length,
      search_has_query: event.searchQuery.length > 0,

      // Filters
      filter_location: event.filters.location,
      filter_job_type: event.filters.jobType,
      filter_salary_min: event.filters.salaryMin,
      filter_salary_max: event.filters.salaryMax,
      filter_categories: event.filters.categories,
      filter_remote: event.filters.remote,
      filter_experience_level: event.filters.experienceLevel,
      filter_count: Object.values(event.filters).filter(Boolean).length,

      // Results
      results_count: event.results.totalCount,
      results_has_more: event.results.hasMore,
      search_time_ms: event.results.searchTime,
      search_page: event.results.page,
      results_per_page:
        event.results.totalCount > 0
          ? Math.min(20, event.results.totalCount)
          : 0,

      // Context
      search_source: event.source,
      timestamp: new Date().toISOString(),
    });
  };

  // Job View Tracking
  const trackJobView = (event: JobViewEvent) => {
    if (!isInitialized) return;

    trackEvent('job_viewed', {
      // Job details
      job_id: event.jobId,
      job_title: event.jobTitle,
      job_company: event.company,
      job_location: event.location,
      job_type: event.jobType,
      job_salary_min: event.salaryMin,
      job_salary_max: event.salaryMax,
      job_categories: event.categories,
      job_posted_at: event.postedAt,
      job_age_days: Math.floor(
        (Date.now() - new Date(event.postedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),

      // View context
      view_source: event.viewSource,
      time_on_page: event.timeOnPage,

      // Derived metrics
      has_salary: !!(event.salaryMin || event.salaryMax),
      salary_range:
        event.salaryMin && event.salaryMax
          ? event.salaryMax - event.salaryMin
          : null,

      timestamp: new Date().toISOString(),
    });
  };

  // Job Application Tracking
  const trackJobApplication = (event: JobApplicationEvent) => {
    if (!isInitialized) return;

    trackEvent('job_application_started', {
      // Job details
      job_id: event.jobId,
      job_title: event.jobTitle,
      job_company: event.company,

      // Application details
      application_method: event.applicationMethod,
      has_resume: event.hasResume,
      has_cover_letter: event.hasCoverLetter,
      application_source: event.applicationSource,
      time_to_apply: event.timeToApply,

      // Application quality score
      application_quality_score:
        (event.hasResume ? 40 : 0) +
        (event.hasCoverLetter ? 30 : 0) +
        (event.applicationMethod === 'direct' ? 30 : 20),

      timestamp: new Date().toISOString(),
    });
  };

  // User Registration Tracking
  const trackUserRegistration = (event: UserRegistrationEvent) => {
    if (!isInitialized) return;

    trackEvent('user_registered', {
      user_type: event.userType,
      registration_method: event.registrationMethod,
      registration_source: event.source,
      has_resume: event.hasResume,
      profile_completeness: event.profileCompleteness,

      // Registration quality indicators
      is_complete_registration: event.profileCompleteness >= 80,
      registration_quality_score:
        (event.hasResume ? 50 : 0) + event.profileCompleteness * 0.5,

      timestamp: new Date().toISOString(),
    });
  };

  // Job Posting Tracking
  const trackJobPosting = (event: JobPostingEvent) => {
    if (!isInitialized) return;

    trackEvent('job_posted', {
      // Job details
      job_id: event.jobId,
      employer_id: event.employerId,
      job_title: event.jobTitle,
      job_type: event.jobType,
      job_location: event.location,
      job_salary_min: event.salaryMin,
      job_salary_max: event.salaryMax,
      job_categories: event.categories,

      // Posting details
      posting_method: event.postingMethod,
      is_promoted: event.isPromoted,
      time_to_post: event.timeToPost,

      // Job quality indicators
      has_salary: !!(event.salaryMin || event.salaryMax),
      job_quality_score:
        (event.jobTitle.length > 10 ? 20 : 10) +
        (event.salaryMin ? 30 : 0) +
        (event.categories.length > 0 ? 20 : 0) +
        (event.isPromoted ? 30 : 0),

      timestamp: new Date().toISOString(),
    });
  };

  // Email Alert Tracking
  const trackEmailAlert = (event: EmailAlertEvent) => {
    if (!isInitialized) return;

    trackEvent('email_alert_created', {
      alert_id: event.alertId,
      user_id: event.userId,
      alert_type: event.alertType,
      alert_frequency: event.frequency,
      alert_source: event.source,

      // Alert filters
      alert_keywords: event.filters.keywords,
      alert_location: event.filters.location,
      alert_job_type: event.filters.jobType,
      alert_categories: event.filters.categories,
      alert_filter_count: Object.values(event.filters).filter(Boolean).length,

      // Alert quality
      alert_specificity_score:
        (event.filters.keywords?.length || 0) * 10 +
        (event.filters.location ? 20 : 0) +
        (event.filters.jobType ? 15 : 0) +
        (event.filters.categories?.length || 0) * 5,

      timestamp: new Date().toISOString(),
    });
  };

  // User Engagement Session Tracking
  const trackUserSession = (event: UserEngagementEvent) => {
    if (!isInitialized) return;

    trackEvent('user_session_completed', {
      session_id: event.sessionId,
      user_id: event.userId,
      session_duration: event.sessionDuration,
      page_views: event.pageViews,
      jobs_viewed: event.jobsViewed,
      searches_performed: event.searchesPerformed,
      applications_started: event.applicationsStarted,
      applications_completed: event.applicationsCompleted,
      bounce_rate: event.bounceRate,
      device_type: event.deviceType,
      traffic_source: event.trafficSource,

      // Engagement quality metrics
      engagement_score:
        (event.sessionDuration / 60) * 2 + // 2 points per minute
        event.pageViews * 5 +
        event.jobsViewed * 10 +
        event.searchesPerformed * 15 +
        event.applicationsStarted * 50 +
        event.applicationsCompleted * 100,

      conversion_rate:
        event.applicationsCompleted / Math.max(event.jobsViewed, 1),
      search_to_view_rate:
        event.jobsViewed / Math.max(event.searchesPerformed, 1),

      timestamp: new Date().toISOString(),
    });
  };

  // Job Save/Unsave Tracking
  const trackJobSave = (
    jobId: string,
    action: 'save' | 'unsave',
    jobData?: Partial<JobViewEvent>
  ) => {
    if (!isInitialized) return;

    trackEvent('job_saved', {
      job_id: jobId,
      save_action: action,
      job_title: jobData?.jobTitle,
      job_company: jobData?.company,
      job_type: jobData?.jobType,
      job_location: jobData?.location,

      timestamp: new Date().toISOString(),
    });
  };

  // User Identification
  const identifyJobBoardUser = (
    userId: string,
    userProperties: {
      userType: 'jobseeker' | 'employer';
      email?: string;
      name?: string;
      location?: string;
      industry?: string;
      experienceLevel?: string;
      profileCompleteness: number;
      registrationDate: string;
      lastActiveDate: string;
    }
  ) => {
    if (!isInitialized) return;

    identifyUser(userId, {
      user_type: userProperties.userType,
      email: userProperties.email,
      name: userProperties.name,
      location: userProperties.location,
      industry: userProperties.industry,
      experience_level: userProperties.experienceLevel,
      profile_completeness: userProperties.profileCompleteness,
      registration_date: userProperties.registrationDate,
      last_active_date: userProperties.lastActiveDate,

      // User quality indicators
      is_active_user:
        new Date(userProperties.lastActiveDate) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      user_tenure_days: Math.floor(
        (Date.now() - new Date(userProperties.registrationDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    });
  };

  return {
    // Core tracking functions
    trackJobSearch,
    trackJobView,
    trackJobApplication,
    trackUserRegistration,
    trackJobPosting,
    trackEmailAlert,
    trackUserSession,
    trackJobSave,

    // User management
    identifyJobBoardUser,

    // State
    isInitialized,
  };
}
