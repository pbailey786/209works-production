/**
 * Analytics Hook
 * Easy-to-use hook for tracking user behavior throughout the app
 */

import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  timestamp?: Date;
}

export function useAnalytics() {
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionId = useRef<string>();

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Track page views automatically
  useEffect(() => {
    if (user && pathname) {
      trackPageView(pathname, Object.fromEntries(searchParams.entries()));
    }
  }, [pathname, searchParams, user]);

  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {}
  ) => {
    if (!user) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          eventData: {
            ...eventData,
            pathname,
            timestamp: new Date().toISOString(),
          },
          sessionId: sessionId.current,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user, pathname]);

  const trackPageView = useCallback((path: string, params: Record<string, string> = {}) => {
    trackEvent('page_view', {
      pathname: path,
      searchParams: params,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }, [trackEvent]);

  const trackJobSearch = useCallback((query: string, filters: Record<string, any>, resultCount: number) => {
    trackEvent('job_search', {
      query,
      filters,
      resultCount,
      hasResults: resultCount > 0,
    });
  }, [trackEvent]);

  const trackJobView = useCallback((jobId: string, jobData: any) => {
    trackEvent('job_view', {
      jobId,
      jobTitle: jobData.title,
      company: jobData.company,
      industry: jobData.industry,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      location: jobData.location,
    });
  }, [trackEvent]);

  const trackJobApplication = useCallback((jobId: string, jobData: any, applicationData: any) => {
    trackEvent('job_apply', {
      jobId,
      jobTitle: jobData.title,
      company: jobData.company,
      industry: jobData.industry,
      applicationMethod: applicationData.method,
      hasCoverLetter: !!applicationData.coverLetter,
      hasCustomResume: !!applicationData.customResume,
    });
  }, [trackEvent]);

  const trackJobSave = useCallback((jobId: string, jobData: any) => {
    trackEvent('job_save', {
      jobId,
      jobTitle: jobData.title,
      company: jobData.company,
      industry: jobData.industry,
    });
  }, [trackEvent]);

  const trackChatInteraction = useCallback((
    userMessage: string, 
    aiResponse: string, 
    hasCareerInsights: boolean = false
  ) => {
    trackEvent('chat_interaction', {
      message: userMessage,
      aiResponse,
      messageLength: userMessage.length,
      responseLength: aiResponse.length,
      hasCareerInsights,
    });
  }, [trackEvent]);

  const trackProfileUpdate = useCallback((updatedFields: string[], changes: Record<string, any>) => {
    trackEvent('profile_update', {
      updatedFields,
      fieldCount: updatedFields.length,
      changes,
      hasJobTitleChange: updatedFields.includes('currentJobTitle'),
      hasSalaryChange: updatedFields.includes('currentSalary'),
      hasSkillsChange: updatedFields.includes('skills'),
    });
  }, [trackEvent]);

  const trackSalarySearch = useCallback((role: string, currentSalary?: number, targetSalary?: number) => {
    trackEvent('salary_search', {
      role,
      currentSalary,
      targetSalary,
      salaryIncrease: currentSalary && targetSalary 
        ? ((targetSalary - currentSalary) / currentSalary) * 100 
        : null,
    });
  }, [trackEvent]);

  const trackCompanyResearch = useCallback((companyId: string, companyName: string) => {
    trackEvent('company_research', {
      companyId,
      companyName,
    });
  }, [trackEvent]);

  const trackSkillSearch = useCallback((skills: string[], context: string) => {
    trackEvent('skill_search', {
      skills,
      skillCount: skills.length,
      context,
    });
  }, [trackEvent]);

  const trackCareerChangeInterest = useCallback((
    currentIndustry: string, 
    targetIndustry: string, 
    context: string
  ) => {
    trackEvent('career_change_interest', {
      currentIndustry,
      targetIndustry,
      context,
    });
  }, [trackEvent]);

  const trackTrainingProgramInterest = useCallback((
    programName: string, 
    provider: string, 
    industry: string
  ) => {
    trackEvent('training_program_interest', {
      programName,
      provider,
      industry,
    });
  }, [trackEvent]);

  // Convenience methods for common tracking scenarios
  const trackButtonClick = useCallback((buttonName: string, context?: string) => {
    trackEvent('button_click', {
      buttonName,
      context: context || pathname,
    });
  }, [trackEvent, pathname]);

  const trackFormSubmission = useCallback((formName: string, formData?: Record<string, any>) => {
    trackEvent('form_submission', {
      formName,
      formData,
      context: pathname,
    });
  }, [trackEvent, pathname]);

  const trackError = useCallback((errorType: string, errorMessage: string, context?: string) => {
    trackEvent('error', {
      errorType,
      errorMessage,
      context: context || pathname,
      userAgent: navigator.userAgent,
    });
  }, [trackEvent, pathname]);

  const trackFeatureUsage = useCallback((featureName: string, featureData?: Record<string, any>) => {
    trackEvent('feature_usage', {
      featureName,
      featureData,
      context: pathname,
    });
  }, [trackEvent, pathname]);

  // Time tracking for engagement
  const trackTimeSpent = useCallback((elementId: string, timeSpent: number) => {
    trackEvent('time_spent', {
      elementId,
      timeSpent, // in seconds
      context: pathname,
    });
  }, [trackEvent, pathname]);

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    
    // Job-related tracking
    trackJobSearch,
    trackJobView,
    trackJobApplication,
    trackJobSave,
    
    // Career-related tracking
    trackChatInteraction,
    trackProfileUpdate,
    trackSalarySearch,
    trackCompanyResearch,
    trackSkillSearch,
    trackCareerChangeInterest,
    trackTrainingProgramInterest,
    
    // UI interaction tracking
    trackButtonClick,
    trackFormSubmission,
    trackError,
    trackFeatureUsage,
    trackTimeSpent,
    
    // Session info
    sessionId: sessionId.current,
  };
}

// Higher-order component for automatic tracking
export function withAnalytics<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  trackingConfig?: {
    trackMount?: boolean;
    trackUnmount?: boolean;
    trackProps?: string[];
  }
) {
  return function AnalyticsWrappedComponent(props: T) {
    const analytics = useAnalytics();
    const mountTime = useRef<number>();

    useEffect(() => {
      mountTime.current = Date.now();
      
      if (trackingConfig?.trackMount) {
        analytics.trackEvent('component_mount', {
          componentName: Component.displayName || Component.name,
          props: trackingConfig.trackProps 
            ? Object.pick(props, trackingConfig.trackProps)
            : undefined,
        });
      }

      return () => {
        if (trackingConfig?.trackUnmount && mountTime.current) {
          const timeSpent = (Date.now() - mountTime.current) / 1000;
          analytics.trackEvent('component_unmount', {
            componentName: Component.displayName || Component.name,
            timeSpent,
          });
        }
      };
    }, [analytics, props]);

    return <Component {...props} />;
  };
}

// Utility for Object.pick (since it doesn't exist natively)
declare global {
  interface ObjectConstructor {
    pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
  }
}

if (!Object.pick) {
  Object.pick = function<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  };
}
