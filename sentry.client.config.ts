import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://cdfb2a63a6547a7552e5797143fa903a@o4509520506978304.ingest.us.sentry.io/4509520549773312',
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  // Environment
  environment: process.env.NODE_ENV,
  // Debugging
  debug: process.env.NODE_ENV === "development",
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Filtering
  ignoreErrors: [
    "top.GLOBALS",
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Non-Error promise rejection captured",
    "NEXT_NOT_FOUND",
  ],
  beforeSend(event: any, hint: any) {
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes("ResizeObserver")) {
        return null;
      }
      if (error?.stack?.includes("extension://")) {
        return null;
      }
    }
    return event;
  },
}); 