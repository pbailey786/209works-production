import Script from 'next/script';

interface AnalyticsProps {
  googleAnalyticsId?: string;
  posthogApiKey?: string;
}

export default function Analytics({
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY,
}: AnalyticsProps) {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}', {
            page_title: document.title,
            page_location: window.location.href,
            // Enhanced ecommerce and conversion tracking
            send_page_view: true,
            custom_map: {
              'custom_parameter_1': 'user_role',
              'custom_parameter_2': 'pricing_tier'
            }
          });
        `}
      </Script>

      {/* PostHog Analytics */}
      {posthogApiKey && (
        <Script id="posthog-analytics" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);var n=t;if("undefined"!=typeof e)try{n=t[e]}catch(t){}return n}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${posthogApiKey}', {
              api_host: 'https://app.posthog.com',
              // Enable session recording and heatmaps
              session_recording: {
                maskAllInputs: true,
                maskInputOptions: {
                  password: true,
                  email: false
                }
              },
              // Capture pageviews automatically
              capture_pageview: true,
              // Capture performance metrics
              capture_performance: true,
              // Enable feature flags
              bootstrap: {
                featureFlags: {}
              }
            });
          `}
        </Script>
      )}

      {/* Enhanced Custom tracking events */}
      <Script id="custom-analytics" strategy="afterInteractive">
        {`
          // Enhanced job search tracking
          window.trackJobSearch = function(query, location, source = 'search') {
            // Google Analytics
            gtag('event', 'job_search', {
              event_category: 'engagement',
              event_label: query + (location ? ' in ' + location : ''),
              value: 1,
              custom_parameters: {
                search_source: source,
                location: location || 'any'
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('job_search', {
                query: query,
                location: location,
                source: source,
                timestamp: new Date().toISOString()
              });
            }
          };

          // JobsGPT specific tracking
          window.trackJobsGPTQuery = function(query, jobsFound, responseTime, sessionId) {
            // Google Analytics
            gtag('event', 'jobs_gpt_query', {
              event_category: 'ai_interaction',
              event_label: query.substring(0, 100), // Truncate for GA
              value: jobsFound,
              custom_parameters: {
                response_time: responseTime,
                jobs_found: jobsFound,
                session_id: sessionId
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('jobs_gpt_query', {
                query: query,
                jobs_found: jobsFound,
                response_time: responseTime,
                session_id: sessionId,
                query_length: query.length,
                timestamp: new Date().toISOString()
              });
            }
          };


          // Job application tracking
          window.trackJobApplication = function(jobId, source, aiAssisted = false) {
            // Google Analytics
            gtag('event', 'job_apply', {
              event_category: 'conversion',
              event_label: source,
              value: 1,
              custom_parameters: {
                job_id: jobId,
                source: source,
                ai_assisted: aiAssisted
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('job_apply', {
                job_id: jobId,
                source: source,
                ai_assisted: aiAssisted,
                timestamp: new Date().toISOString()
              });
            }
          };

          // Pricing page interactions
          window.trackPricingClick = function(plan, action, currentTier = null) {
            // Google Analytics
            gtag('event', 'pricing_click', {
              event_category: 'pricing',
              event_label: plan + '_' + action,
              value: 1,
              custom_parameters: {
                plan: plan,
                action: action,
                current_tier: currentTier
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('pricing_click', {
                plan: plan,
                action: action,
                current_tier: currentTier,
                timestamp: new Date().toISOString()
              });
            }
          };

          // User onboarding funnel tracking
          window.trackOnboardingStep = function(step, completed = true, userRole = null) {
            // Google Analytics
            gtag('event', 'onboarding_step', {
              event_category: 'onboarding',
              event_label: step,
              value: completed ? 1 : 0,
              custom_parameters: {
                step: step,
                completed: completed,
                user_role: userRole
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('onboarding_step', {
                step: step,
                completed: completed,
                user_role: userRole,
                timestamp: new Date().toISOString()
              });
            }
          };

          // Feature usage tracking
          window.trackFeatureUsage = function(feature, action, metadata = {}) {
            // Google Analytics
            gtag('event', 'feature_usage', {
              event_category: 'feature',
              event_label: feature + '_' + action,
              value: 1,
              custom_parameters: {
                feature: feature,
                action: action,
                ...metadata
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('feature_usage', {
                feature: feature,
                action: action,
                ...metadata,
                timestamp: new Date().toISOString()
              });
            }
          };

          // User engagement tracking
          window.trackEngagement = function(type, duration, page) {
            // Google Analytics
            gtag('event', 'engagement', {
              event_category: 'user_behavior',
              event_label: type,
              value: duration,
              custom_parameters: {
                engagement_type: type,
                duration: duration,
                page: page
              }
            });

            // PostHog
            if (window.posthog) {
              posthog.capture('user_engagement', {
                type: type,
                duration: duration,
                page: page,
                timestamp: new Date().toISOString()
              });
            }
          };

          // Track employer CTA clicks
          window.trackEmployerClick = function(action) {
            gtag('event', 'employer_action', {
              event_category: 'employer_engagement',
              event_label: action,
              value: 1
            });
          };

          // Track outbound links
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
              gtag('event', 'click', {
                event_category: 'outbound',
                event_label: link.href,
                transport_type: 'beacon'
              });
            }
          });
        `}
      </Script>

      {/* Performance monitoring */}
      <Script id="performance-analytics" strategy="afterInteractive">
        {`
          // Core Web Vitals tracking
          function getCLS(metric) {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(metric.value * 1000),
              non_interaction: true,
            });
          }

          function getFID(metric) {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }

          function getFCP(metric) {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FCP',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }

          function getLCP(metric) {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }

          function getTTFB(metric) {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'TTFB',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }

          // Load web-vitals library and measure metrics
          import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(getCLS);
            getFID(getFID);
            getFCP(getFCP);
            getLCP(getLCP);
            getTTFB(getTTFB);
          }).catch(err => {
            console.log('Web Vitals tracking not available:', err);
          });
        `}
      </Script>
    </>
  );
}
