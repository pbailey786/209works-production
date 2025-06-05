// Instrumentation file to disable OpenTelemetry auto-instrumentation
// This prevents build errors related to @opentelemetry/instrumentation

export async function register() {
  // Disable OpenTelemetry instrumentation during build and runtime
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true') {
    console.log('OpenTelemetry instrumentation disabled for production build');
    return;
  }
  
  // For development, we can optionally enable minimal instrumentation
  // but for now, we'll keep it disabled to prevent dependency issues
  console.log('OpenTelemetry instrumentation disabled');
}
