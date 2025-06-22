import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://cdfb2a63a6547a7552e5797143fa903a@o4509520506978304.ingest.us.sentry.io/4509520549773312',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  beforeSend(event: any, hint: any) {
    if (event.exception?.values?.[0]?.value?.includes('ECONNREFUSED')) {
      return null;
    }
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    if (event.exception?.values?.[0]?.value?.includes('Rate limit exceeded')) {
      return null;
    }
    return event;
  },
  beforeSendTransaction(event: any) {
    if (event.transaction?.includes('/api/health')) {
      return null;
    }
    if (event.transaction?.includes('/_next/')) {
      return null;
    }
    return event;
  },
  integrations: [Sentry.httpIntegration(), Sentry.consoleIntegration()],
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
  initialScope: {
    tags: {
      component: 'server',
      deployment: process.env.VERCEL_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
    },
  },
});
