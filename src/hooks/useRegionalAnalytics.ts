/**
 * Regional Analytics Hook
 * Custom hook for tracking regional job board analytics
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePostHog } from '@/lib/analytics/posthog-provider';
import { usePathname, useSearchParams } from 'next/navigation';

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  region?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: string;
  categories?: string[];
}

interface SearchFilters {
  region?: string;
  jobType?: string;
  location?: string;
  keywords?: string;
  salaryMin?: number;
  salaryMax?: number;
  categories?: string[];
  limit?: number;
  offset?: number;
}

interface SearchResults {
  totalCount: number;
  hasMore: boolean;
  jobs: JobData[];
}

export function useRegionalAnalytics(region?: string) {
  const {
    trackEvent,
    trackJobView,
    trackJobSearch,
    trackJobApplication,
    trackRegionalNavigation,
    setRegionalContext,
    isInitialized,
  } = usePostHog();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasTrackedPageView = useRef(false);

  // Set regional context when region changes
  useEffect(() => {
    if (region && isInitialized) {
      setRegionalContext({
        region,
        domain: window.location.hostname,
      });
    }
  }, [region, isInitialized, setRegionalContext]);

  // Track page views with regional context (only once per page)
  useEffect(() => {
    if (isInitialized && !hasTrackedPageView.current) {
      trackEvent('page_viewed', {
        page_path: pathname,
        page_region: region,
        search_params: Object.fromEntries(searchParams.entries()),
        page_type: getPageType(pathname),
      });
      hasTrackedPageView.current = true;
    }

    // Reset flag when pathname changes
    return () => {
      hasTrackedPageView.current = false;
    };
  }, [pathname, region, isInitialized]); // Removed trackEvent and searchParams from dependencies

  const getPageType = (path: string): string => {
    if (path === '/') return 'home';
    if (path.startsWith('/jobs/') && path.split('/').length === 3)
      return 'job_detail';
    if (path.startsWith('/jobs')) return 'job_search';
    if (path.startsWith('/regional/')) return 'regional_landing';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/employers')) return 'employer';
    if (path.startsWith('/signin') || path.startsWith('/signup')) return 'auth';
    return 'other';
  };

  // Track job view events
  const trackJobViewEvent = useCallback(
    (jobData: JobData, source?: string) => {
      trackJobView(jobData.id, {
        ...jobData,
        view_source: source || 'unknown',
        view_region: region,
        view_timestamp: new Date().toISOString(),
      });
    },
    [trackJobView, region]
  );

  // Track job search events
  const trackJobSearchEvent = useCallback(
    (
      searchQuery: string,
      filters: SearchFilters,
      results: SearchResults,
      searchSource?: string
    ) => {
      trackJobSearch(searchQuery, filters, {
        ...results,
        search_source: searchSource || 'search_page',
        search_region: region,
        search_timestamp: new Date().toISOString(),
      });
    },
    [trackJobSearch, region]
  );

  // Track job application events
  const trackJobApplicationEvent = useCallback(
    (
      jobId: string,
      applicationData: {
        jobTitle?: string;
        jobCompany?: string;
        jobRegion?: string;
        method?: string;
        resumeUrl?: string;
        coverLetter?: string;
        source?: string;
      }
    ) => {
      trackJobApplication(jobId, {
        ...applicationData,
        application_region: region,
        application_timestamp: new Date().toISOString(),
      });
    },
    [trackJobApplication, region]
  );

  // Track regional navigation
  const trackRegionalNavigationEvent = useCallback(
    (fromRegion?: string, toRegion?: string, navigationMethod?: string) => {
      trackRegionalNavigation(fromRegion, toRegion);

      // Additional tracking for navigation method
      trackEvent('regional_navigation_detailed', {
        from_region: fromRegion,
        to_region: toRegion,
        navigation_method: navigationMethod || 'unknown',
        current_page: pathname,
        timestamp: new Date().toISOString(),
      });
    },
    [trackRegionalNavigation, trackEvent, pathname]
  );

  // Track job alert creation
  const trackJobAlertCreation = useCallback(
    (alertData: {
      keywords?: string[];
      region?: string;
      jobType?: string;
      location?: string;
      frequency?: string;
    }) => {
      trackEvent('job_alert_created', {
        alert_keywords: alertData.keywords,
        alert_region: alertData.region || region,
        alert_job_type: alertData.jobType,
        alert_location: alertData.location,
        alert_frequency: alertData.frequency,
        creation_region: region,
        creation_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Track user registration with regional context
  const trackUserRegistration = useCallback(
    (userData: {
      userType?: 'jobseeker' | 'employer';
      source?: string;
      hasResume?: boolean;
    }) => {
      trackEvent('user_registered', {
        user_type: userData.userType,
        registration_source: userData.source,
        registration_region: region,
        has_resume: userData.hasResume,
        registration_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Track job save/unsave events
  const trackJobSaveEvent = useCallback(
    (jobId: string, action: 'save' | 'unsave', jobData?: Partial<JobData>) => {
      trackEvent('job_saved', {
        job_id: jobId,
        save_action: action,
        job_title: jobData?.title,
        job_company: jobData?.company,
        job_region: jobData?.region || region,
        save_region: region,
        save_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Track search filter usage
  const trackSearchFilterUsage = useCallback(
    (filters: SearchFilters) => {
      trackEvent('search_filters_applied', {
        filter_region: filters.region,
        filter_job_type: filters.jobType,
        filter_location: filters.location,
        filter_salary_min: filters.salaryMin,
        filter_salary_max: filters.salaryMax,
        filter_categories: filters.categories,
        applied_from_region: region,
        filter_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Track regional landing page interactions
  const trackRegionalLandingInteraction = useCallback(
    (interactionType: string, interactionData?: Record<string, any>) => {
      trackEvent('regional_landing_interaction', {
        interaction_type: interactionType,
        interaction_region: region,
        interaction_data: interactionData,
        interaction_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Track email alert subscriptions
  const trackEmailAlertSubscription = useCallback(
    (alertData: {
      frequency?: string;
      categories?: string[];
      location?: string;
    }) => {
      trackEvent('email_alert_subscribed', {
        alert_frequency: alertData.frequency,
        alert_categories: alertData.categories,
        alert_location: alertData.location,
        subscription_region: region,
        subscription_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  // Create a stable trackEvent wrapper
  const trackEventWithRegion = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      trackEvent(eventName, {
        ...properties,
        event_region: region,
        event_timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, region]
  );

  return {
    // Core tracking functions
    trackJobView: trackJobViewEvent,
    trackJobSearch: trackJobSearchEvent,
    trackJobApplication: trackJobApplicationEvent,
    trackRegionalNavigation: trackRegionalNavigationEvent,

    // Specialized tracking functions
    trackJobAlert: trackJobAlertCreation,
    trackUserRegistration,
    trackJobSave: trackJobSaveEvent,
    trackSearchFilters: trackSearchFilterUsage,
    trackRegionalLandingInteraction,
    trackEmailAlertSubscription,

    // Generic event tracking
    trackEvent: trackEventWithRegion,

    // State
    isInitialized,
    currentRegion: region,
  };
}
