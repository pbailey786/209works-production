import Script from 'next/script';

interface AnalyticsProps {
  googleAnalyticsId?: string;
}

export default function Analytics({
  googleAnalyticsId = 'G-XXXXXXXXXX',
}: AnalyticsProps) {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Google Analytics */}
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
          });
        `}
      </Script>

      {/* Custom tracking events */}
      <Script id="custom-analytics" strategy="afterInteractive">
        {`
          // Track job search events
          window.trackJobSearch = function(query, location) {
            gtag('event', 'job_search', {
              event_category: 'engagement',
              event_label: query + (location ? ' in ' + location : ''),
              value: 1
            });
          };

          // Track job view events
          window.trackJobView = function(jobId, jobTitle) {
            gtag('event', 'job_view', {
              event_category: 'engagement',
              event_label: jobTitle,
              value: 1,
              custom_parameters: {
                job_id: jobId
              }
            });
          };

          // Track email subscription
          window.trackEmailSubscription = function() {
            gtag('event', 'email_subscription', {
              event_category: 'conversion',
              event_label: 'newsletter_signup',
              value: 1
            });
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
