import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// This function can be called by Netlify's scheduled functions
// Add this to your netlify.toml:
//
// [[plugins]]
//   package = "@netlify/plugin-scheduled-functions"
//
// [functions.process-job-queue]
//   schedule = "*/5 * * * *" # Every 5 minutes

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Verify this is a legitimate scheduled function call
  if (
    event.httpMethod !== 'POST' &&
    event.headers['netlify-function-cron'] !== 'true'
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Unauthorized - not a scheduled function',
      }),
    };
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.URL ||
      'https://209works.com';
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'CRON_SECRET not configured' }),
      };
    }

    // Call the internal API endpoint
    const response = await fetch(`${baseUrl}/api/cron/process-job-queue`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'User-Agent': 'Netlify-Function-Cron/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cron job failed: ${response.status} ${errorText}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Cron job failed',
          status: response.status,
          details: errorText,
        }),
      };
    }

    const result = await response.json();

    console.log('✅ Cron job completed successfully:', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        result,
      }),
    };
  } catch (error) {
    console.error('❌ Cron job function failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export { handler };
