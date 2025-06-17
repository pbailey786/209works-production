/**
 * Session Tracker
 * Automatically tracks user session engagement and behavior patterns
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  useJobBoardAnalytics,
  UserEngagementEvent,
} from './job-board-analytics';

interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  jobsViewed: number;
  searchesPerformed: number;
  applicationsStarted: number;
  applicationsCompleted: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  trafficSource: 'organic' | 'direct' | 'social' | 'email' | 'paid';
  pages: string[];
  events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }>;
}

// Generate unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Detect device type
const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = window.navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
      userAgent
    )
  )
    return 'mobile';
  return 'desktop';
};

// Detect traffic source
const getTrafficSource = ():
  | 'organic'
  | 'direct'
  | 'social'
  | 'email'
  | 'paid' => {
  if (typeof window === 'undefined') return 'direct';

  const referrer = document.referrer;
  const urlParams = new URLSearchParams(window.location.search);

  // Check for UTM parameters (paid/email campaigns)
  if (urlParams.get('utm_source')) {
    const source = urlParams.get('utm_source')?.toLowerCase();
    if (source?.includes('email')) return 'email';
    if (
      source?.includes('google') ||
      source?.includes('facebook') ||
      source?.includes('linkedin')
    )
      return 'paid';
    return 'paid';
  }

  // Check referrer
  if (!referrer) return 'direct';

  const referrerDomain = new URL(referrer).hostname.toLowerCase();

  // Social media sources
  const socialDomains = [
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'youtube.com',
    'tiktok.com',
  ];
  if (socialDomains.some(domain => referrerDomain.includes(domain)))
    return 'social';

  // Search engines (organic)
  const searchDomains = [
    'google.com',
    'bing.com',
    'yahoo.com',
    'duckduckgo.com',
  ];
  if (searchDomains.some(domain => referrerDomain.includes(domain)))
    return 'organic';

  return 'direct';
};

export function useSessionTracker(userId?: string) {
  const { trackUserSession, isInitialized } = useJobBoardAnalytics();
  const sessionDataRef = useRef<SessionData | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session
  const initializeSession = useCallback(() => {
    if (sessionDataRef.current) return;

    const sessionId = generateSessionId();
    const now = Date.now();

    sessionDataRef.current = {
      sessionId,
      userId,
      startTime: now,
      lastActivity: now,
      pageViews: 1,
      jobsViewed: 0,
      searchesPerformed: 0,
      applicationsStarted: 0,
      applicationsCompleted: 0,
      deviceType: getDeviceType(),
      trafficSource: getTrafficSource(),
      pages: [window.location.pathname],
      events: [
        {
          type: 'session_start',
          timestamp: now,
        },
      ],
    };

    // Store session ID in sessionStorage for persistence across page reloads
    sessionStorage.setItem('job_board_session_id', sessionId);
  }, [userId]);

  // Update session activity
  const updateActivity = useCallback(() => {
    if (!sessionDataRef.current) return;

    sessionDataRef.current.lastActivity = Date.now();

    // Reset inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new inactivity timer (30 minutes)
    inactivityTimerRef.current = setTimeout(
      () => {
        endSession('inactivity');
      },
      30 * 60 * 1000
    );
  }, []);

  // Track page view
  const trackPageView = useCallback(
    (path: string) => {
      if (!sessionDataRef.current) return;

      sessionDataRef.current.pageViews++;
      if (!sessionDataRef.current.pages.includes(path)) {
        sessionDataRef.current.pages.push(path);
      }

      sessionDataRef.current.events.push({
        type: 'page_view',
        timestamp: Date.now(),
        data: { path },
      });

      updateActivity();
    },
    [updateActivity]
  );

  // Track job view
  const trackJobView = useCallback(
    (jobId: string) => {
      if (!sessionDataRef.current) return;

      sessionDataRef.current.jobsViewed++;
      sessionDataRef.current.events.push({
        type: 'job_view',
        timestamp: Date.now(),
        data: { jobId },
      });

      updateActivity();
    },
    [updateActivity]
  );

  // Track job search
  const trackJobSearch = useCallback(
    (searchQuery: string) => {
      if (!sessionDataRef.current) return;

      sessionDataRef.current.searchesPerformed++;
      sessionDataRef.current.events.push({
        type: 'job_search',
        timestamp: Date.now(),
        data: { searchQuery },
      });

      updateActivity();
    },
    [updateActivity]
  );

  // Track application start
  const trackApplicationStart = useCallback(
    (jobId: string) => {
      if (!sessionDataRef.current) return;

      sessionDataRef.current.applicationsStarted++;
      sessionDataRef.current.events.push({
        type: 'application_start',
        timestamp: Date.now(),
        data: { jobId },
      });

      updateActivity();
    },
    [updateActivity]
  );

  // Track application completion
  const trackApplicationComplete = useCallback(
    (jobId: string) => {
      if (!sessionDataRef.current) return;

      sessionDataRef.current.applicationsCompleted++;
      sessionDataRef.current.events.push({
        type: 'application_complete',
        timestamp: Date.now(),
        data: { jobId },
      });

      updateActivity();
    },
    [updateActivity]
  );

  // End session and send analytics
  const endSession = useCallback(
    (reason: 'navigation' | 'inactivity' | 'manual' | 'beforeunload') => {
      if (!sessionDataRef.current || !isInitialized) return;

      const sessionData = sessionDataRef.current;
      const sessionDuration = Math.floor(
        (Date.now() - sessionData.startTime) / 1000
      );

      // Determine if this was a bounce (single page, short duration)
      const bounceRate = sessionData.pageViews === 1 && sessionDuration < 30;

      const engagementEvent: UserEngagementEvent = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        sessionDuration,
        pageViews: sessionData.pageViews,
        jobsViewed: sessionData.jobsViewed,
        searchesPerformed: sessionData.searchesPerformed,
        applicationsStarted: sessionData.applicationsStarted,
        applicationsCompleted: sessionData.applicationsCompleted,
        bounceRate,
        deviceType: sessionData.deviceType,
        trafficSource: sessionData.trafficSource,
      };

      // Send session data to analytics
      trackUserSession(engagementEvent);

      // Clean up
      sessionDataRef.current = null;
      sessionStorage.removeItem('job_board_session_id');

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    },
    [isInitialized, trackUserSession]
  );

  // Set up session tracking
  useEffect(() => {
    if (!isInitialized) return;

    // Check for existing session
    const existingSessionId = sessionStorage.getItem('job_board_session_id');
    if (!existingSessionId) {
      initializeSession();
    } else {
      // Restore session if it exists and is recent (within 30 minutes)
      const sessionAge = Date.now() - parseInt(existingSessionId.split('_')[1]);
      if (sessionAge < 30 * 60 * 1000) {
        // Continue existing session
        trackPageView(window.location.pathname);
      } else {
        // Start new session
        initializeSession();
      }
    }

    // Set up activity listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up heartbeat to periodically save session state
    heartbeatTimerRef.current = setInterval(() => {
      if (sessionDataRef.current) {
        // Update session in sessionStorage
        sessionStorage.setItem(
          'job_board_session_data',
          JSON.stringify({
            ...sessionDataRef.current,
            lastActivity: Date.now(),
          })
        );
      }
    }, 60000); // Every minute

    // Handle page unload
    const handleBeforeUnload = () => {
      endSession('beforeunload');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });

      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [
    isInitialized,
    initializeSession,
    updateActivity,
    trackPageView,
    endSession,
  ]);

  // Track route changes
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [trackPageView]);

  return {
    // Session tracking functions
    trackJobView,
    trackJobSearch,
    trackApplicationStart,
    trackApplicationComplete,
    endSession: () => endSession('manual'),

    // Session state
    sessionId: sessionDataRef.current?.sessionId,
    isActive: !!sessionDataRef.current,
  };
}
