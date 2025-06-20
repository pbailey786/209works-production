/**
 * Google Analytics 4 Configuration for 209 Works
 * Comprehensive user behavior and conversion tracking
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 Configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

// Initialize Google Analytics
export function initGA() {
  if (!GA_TRACKING_ID || process.env.NODE_ENV !== 'production') {
    console.log('GA4 not initialized - missing tracking ID or not in production');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
  });

  console.log('GA4 initialized with tracking ID:', GA_TRACKING_ID);
}

// Page view tracking
export function trackPageView(url: string, title?: string) {
  if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
    page_title: title || document.title,
    page_location: window.location.origin + url,
  });
}

// Event tracking utilities
export const Analytics = {
  // Track user registration
  trackSignUp(method: 'email' | 'google' | 'linkedin', userType: 'jobseeker' | 'employer') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'sign_up', {
      method,
      user_type: userType,
      event_category: 'authentication',
    });
  },

  // Track user login
  trackLogin(method: 'email' | 'google' | 'linkedin', userType: 'jobseeker' | 'employer') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'login', {
      method,
      user_type: userType,
      event_category: 'authentication',
    });
  },

  // Track job search
  trackJobSearch(query: string, searchType: 'traditional' | 'semantic', resultsCount: number) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'search', {
      search_term: query.substring(0, 100), // Truncate for privacy
      search_type: searchType,
      results_count: resultsCount,
      event_category: 'job_search',
    });
  },

  // Track JobsGPT usage
  trackJobsGPT(action: 'query' | 'response' | 'follow_up', context?: {
    queryLength?: number;
    responseTime?: number;
    tokensUsed?: number;
  }) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'jobsgpt_interaction', {
      action,
      query_length: context?.queryLength,
      response_time: context?.responseTime,
      tokens_used: context?.tokensUsed,
      event_category: 'ai_interaction',
    });
  },

  // Track job application
  trackJobApplication(jobId: string, applicationMethod: 'internal' | 'external') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'apply_for_job', {
      job_id: jobId,
      application_method: applicationMethod,
      event_category: 'job_application',
      value: 1, // Each application has value
    });
  },

  // Track job posting (employer)
  trackJobPosting(jobId: string, tier: 'starter' | 'standard' | 'pro', credits: number) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'post_job', {
      job_id: jobId,
      tier,
      credits_used: credits,
      event_category: 'employer_action',
      value: credits * 50, // Approximate value per credit
    });
  },

  // Track payment/purchase
  trackPurchase(transactionId: string, value: number, currency: 'USD', items: {
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }[]) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items,
      event_category: 'ecommerce',
    });
  },

  // Track resume upload
  trackResumeUpload(success: boolean, fileSize?: number, fileType?: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'resume_upload', {
      success,
      file_size: fileSize,
      file_type: fileType,
      event_category: 'user_content',
    });
  },

  // Track saved job
  trackSaveJob(jobId: string, action: 'save' | 'unsave') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'save_job', {
      job_id: jobId,
      action,
      event_category: 'user_engagement',
    });
  },

  // Track email subscription
  trackEmailSubscription(type: 'job_alerts' | 'newsletter' | 'employer_updates') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'email_subscription', {
      subscription_type: type,
      event_category: 'engagement',
    });
  },

  // Track social sharing
  trackSocialShare(platform: 'facebook' | 'twitter' | 'linkedin', contentType: 'job' | 'company', contentId: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'share', {
      method: platform,
      content_type: contentType,
      content_id: contentId,
      event_category: 'social_engagement',
    });
  },

  // Track form submissions
  trackFormSubmission(formName: string, success: boolean, errorType?: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'form_submission', {
      form_name: formName,
      success,
      error_type: errorType,
      event_category: 'form_interaction',
    });
  },

  // Track performance metrics
  trackPerformance(metric: 'page_load' | 'api_response' | 'search_response', value: number, page?: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'performance_metric', {
      metric_name: metric,
      metric_value: value,
      page,
      event_category: 'performance',
    });
  },

  // Track user engagement
  trackEngagement(action: 'scroll_depth' | 'time_on_page' | 'click_depth', value: number, page?: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'user_engagement', {
      engagement_action: action,
      engagement_value: value,
      page,
      event_category: 'engagement',
    });
  },

  // Track errors (non-sensitive)
  trackError(errorType: 'javascript' | 'api' | 'payment' | 'auth', errorCategory: string, fatal: boolean = false) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'exception', {
      description: `${errorType}_${errorCategory}`,
      fatal,
      event_category: 'error',
    });
  },

  // Track regional usage
  trackRegionalUsage(region: string, action: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'regional_usage', {
      region,
      action,
      event_category: 'regional_analytics',
    });
  },

  // Custom event tracking
  trackCustomEvent(eventName: string, parameters: Record<string, any>) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, {
      ...parameters,
      event_category: parameters.event_category || 'custom',
    });
  },
};

// Enhanced ecommerce tracking
export const EcommerceTracking = {
  // Track item views
  trackItemView(jobId: string, jobTitle: string, company: string, salary?: number) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'view_item', {
      currency: 'USD',
      value: salary || 0,
      items: [{
        item_id: jobId,
        item_name: jobTitle,
        item_category: 'job_listing',
        item_brand: company,
        price: salary || 0,
        quantity: 1,
      }],
    });
  },

  // Track add to cart (save job)
  trackAddToCart(jobId: string, jobTitle: string, company: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: 1,
      items: [{
        item_id: jobId,
        item_name: jobTitle,
        item_category: 'job_listing',
        item_brand: company,
        quantity: 1,
      }],
    });
  },

  // Track begin checkout (start application)
  trackBeginCheckout(jobId: string, jobTitle: string, company: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: 1,
      items: [{
        item_id: jobId,
        item_name: jobTitle,
        item_category: 'job_application',
        item_brand: company,
        quantity: 1,
      }],
    });
  },
};

// User properties for segmentation
export const UserProperties = {
  setUserType(userType: 'jobseeker' | 'employer' | 'admin') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('config', GA_TRACKING_ID, {
      user_properties: {
        user_type: userType,
      },
    });
  },

  setUserRegion(region: string) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('config', GA_TRACKING_ID, {
      user_properties: {
        user_region: region,
      },
    });
  },

  setUserTier(tier: 'free' | 'starter' | 'standard' | 'pro') {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('config', GA_TRACKING_ID, {
      user_properties: {
        user_tier: tier,
      },
    });
  },
};

// Consent management
export const ConsentManagement = {
  // Update consent settings
  updateConsent(consentSettings: {
    analytics_storage: 'granted' | 'denied';
    ad_storage: 'granted' | 'denied';
    functionality_storage: 'granted' | 'denied';
    personalization_storage: 'granted' | 'denied';
  }) {
    if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

    window.gtag('consent', 'update', consentSettings);
  },

  // Grant all consent
  grantAllConsent() {
    this.updateConsent({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
    });
  },

  // Deny all consent
  denyAllConsent() {
    this.updateConsent({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
    });
  },
};

// Initialize analytics on app load
export function initializeAnalytics() {
  if (typeof window !== 'undefined') {
    initGA();
  }
}
