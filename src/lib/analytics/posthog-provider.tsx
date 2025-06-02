/**
 * PostHog Analytics Provider
 * Provides PostHog analytics with regional context tracking and GDPR compliance
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

interface RegionalContext {
  region?: string;
  domain?: string;
  userAgent?: string;
  referrer?: string;
}

interface PostHogContextType {
  isInitialized: boolean;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackJobView: (jobId: string, jobData: any) => void;
  trackJobSearch: (searchQuery: string, filters: any, results: any) => void;
  trackJobApplication: (jobId: string, applicationData: any) => void;
  trackRegionalNavigation: (fromRegion?: string, toRegion?: string) => void;
  identifyUser: (userId: string, userProperties?: Record<string, any>) => void;
  setRegionalContext: (context: RegionalContext) => void;
  hasConsent: boolean;
  grantConsent: () => void;
  revokeConsent: () => void;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: React.ReactNode;
  apiKey?: string;
  host?: string;
  region?: string;
}

export function PostHogProvider({ 
  children, 
  apiKey, 
  host = 'https://us.i.posthog.com',
  region 
}: PostHogProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [regionalContext, setRegionalContextState] = useState<RegionalContext>({
    region,
    domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  });

  useEffect(() => {
    // Check for existing consent
    const existingConsent = localStorage.getItem('posthog-consent');
    if (existingConsent === 'granted') {
      setHasConsent(true);
    }

    // Initialize PostHog if we have API key and consent
    if (apiKey && (hasConsent || existingConsent === 'granted')) {
      initializePostHog();
    }
  }, [apiKey, hasConsent]);

  const initializePostHog = () => {
    if (!apiKey || isInitialized) return;

    try {
      posthog.init(apiKey, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll handle this manually for regional context
        capture_pageleave: true,
        loaded: (posthog) => {
          // Set regional context as super properties
          posthog.register({
            region: regionalContext.region,
            domain: regionalContext.domain,
            user_agent: regionalContext.userAgent,
            initial_referrer: regionalContext.referrer,
            app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV,
          });

          setIsInitialized(true);
          console.log('PostHog initialized with regional context:', regionalContext);
        },
        // GDPR compliance settings
        opt_out_capturing_by_default: !hasConsent,
        respect_dnt: true,
        disable_session_recording: !hasConsent,
        disable_surveys: !hasConsent,
        // Regional data settings
        property_blacklist: hasConsent ? [] : ['$ip', '$geoip_country_code', '$geoip_city_name'],
      });
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  };

  const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    if (!isInitialized || !hasConsent) return;

    const enrichedProperties = {
      ...properties,
      region: regionalContext.region,
      domain: regionalContext.domain,
      timestamp: new Date().toISOString(),
    };

    posthog.capture(eventName, enrichedProperties);
  };

  const trackJobView = (jobId: string, jobData: any) => {
    trackEvent('job_viewed', {
      job_id: jobId,
      job_title: jobData.title,
      job_company: jobData.company,
      job_location: jobData.location,
      job_region: jobData.region,
      job_type: jobData.jobType,
      job_salary_min: jobData.salaryMin,
      job_salary_max: jobData.salaryMax,
      job_posted_at: jobData.postedAt,
      view_source: 'job_detail_page',
    });
  };

  const trackJobSearch = (searchQuery: string, filters: any, results: any) => {
    trackEvent('job_search_performed', {
      search_query: searchQuery,
      search_region: filters.region,
      search_job_type: filters.jobType,
      search_location: filters.location,
      search_salary_min: filters.salaryMin,
      search_salary_max: filters.salaryMax,
      search_categories: filters.categories,
      results_count: results.totalCount,
      results_has_more: results.hasMore,
      search_page: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
    });
  };

  const trackJobApplication = (jobId: string, applicationData: any) => {
    trackEvent('job_application_started', {
      job_id: jobId,
      job_title: applicationData.jobTitle,
      job_company: applicationData.jobCompany,
      job_region: applicationData.jobRegion,
      application_method: applicationData.method || 'direct',
      has_resume: !!applicationData.resumeUrl,
      has_cover_letter: !!applicationData.coverLetter,
      application_source: 'job_board',
    });
  };

  const trackRegionalNavigation = (fromRegion?: string, toRegion?: string) => {
    trackEvent('regional_navigation', {
      from_region: fromRegion,
      to_region: toRegion,
      navigation_type: fromRegion && toRegion ? 'region_switch' : 'region_entry',
    });
  };

  const identifyUser = (userId: string, userProperties: Record<string, any> = {}) => {
    if (!isInitialized || !hasConsent) return;

    const enrichedProperties = {
      ...userProperties,
      preferred_region: regionalContext.region,
      signup_domain: regionalContext.domain,
      signup_referrer: regionalContext.referrer,
    };

    posthog.identify(userId, enrichedProperties);
  };

  const setRegionalContext = (context: RegionalContext) => {
    setRegionalContextState(prev => ({ ...prev, ...context }));
    
    if (isInitialized && hasConsent) {
      // Update super properties with new regional context
      posthog.register({
        region: context.region || regionalContext.region,
        domain: context.domain || regionalContext.domain,
      });
    }
  };

  const grantConsent = () => {
    setHasConsent(true);
    localStorage.setItem('posthog-consent', 'granted');
    
    if (apiKey && !isInitialized) {
      initializePostHog();
    } else if (isInitialized) {
      // Re-enable tracking
      posthog.opt_in_capturing();
    }
  };

  const revokeConsent = () => {
    setHasConsent(false);
    localStorage.setItem('posthog-consent', 'revoked');
    
    if (isInitialized) {
      posthog.opt_out_capturing();
    }
  };

  const contextValue: PostHogContextType = {
    isInitialized,
    trackEvent,
    trackJobView,
    trackJobSearch,
    trackJobApplication,
    trackRegionalNavigation,
    identifyUser,
    setRegionalContext,
    hasConsent,
    grantConsent,
    revokeConsent,
  };

  // If PostHog is not configured, provide a no-op context
  if (!apiKey) {
    const noOpContext: PostHogContextType = {
      isInitialized: false,
      trackEvent: () => {},
      trackJobView: () => {},
      trackJobSearch: () => {},
      trackJobApplication: () => {},
      trackRegionalNavigation: () => {},
      identifyUser: () => {},
      setRegionalContext: () => {},
      hasConsent: false,
      grantConsent: () => {},
      revokeConsent: () => {},
    };

    return (
      <PostHogContext.Provider value={noOpContext}>
        {children}
      </PostHogContext.Provider>
    );
  }

  return (
    <PostHogContext.Provider value={contextValue}>
      <PHProvider client={posthog}>
        {children}
      </PHProvider>
    </PostHogContext.Provider>
  );
}

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
} 