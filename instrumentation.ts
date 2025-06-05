// Instrumentation file to disable OpenTelemetry auto-instrumentation
// This prevents build errors related to @opentelemetry/instrumentation

export async function register() {
  // Explicitly disable OpenTelemetry to prevent dependency issues
  // Set environment variables to disable auto-instrumentation
  process.env.OTEL_SDK_DISABLED = 'true';
  process.env.OTEL_TRACES_EXPORTER = 'none';
  process.env.OTEL_METRICS_EXPORTER = 'none';
  process.env.OTEL_LOGS_EXPORTER = 'none';

  console.log('OpenTelemetry instrumentation explicitly disabled');
}
