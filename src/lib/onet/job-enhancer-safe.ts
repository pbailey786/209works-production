// Safe wrapper for job enhancer that handles missing O*NET credentials gracefully

interface SafeJobEnhancer {
  enhanceJobPosting(input: { title: string; location?: string }): Promise<any | null>;
}

class MockJobEnhancer implements SafeJobEnhancer {
  async enhanceJobPosting(): Promise<null> {
    console.log('🔄 Mock O*NET enhancer: Returning null (credentials not configured)');
    return null;
  }
}

let cachedEnhancer: SafeJobEnhancer | null = null;

export function getJobEnhancerSafe(): SafeJobEnhancer {
  if (cachedEnhancer) {
    return cachedEnhancer;
  }

  // Check if O*NET credentials are available
  const hasCredentials = !!(process.env.ONET_USERNAME && process.env.ONET_PASSWORD);
  
  if (!hasCredentials) {
    console.log('⚠️ O*NET credentials not configured, using mock enhancer');
    cachedEnhancer = new MockJobEnhancer();
    return cachedEnhancer;
  }

  try {
    // Dynamically import the real enhancer only if credentials exist
    const { jobEnhancer } = require('@/lib/onet/job-enhancer');
    console.log('✅ O*NET job enhancer loaded successfully');
    cachedEnhancer = jobEnhancer;
    return cachedEnhancer;
  } catch (error) {
    console.error('❌ Failed to load O*NET job enhancer:', error instanceof Error ? error.message : 'unknown error');
    cachedEnhancer = new MockJobEnhancer();
    return cachedEnhancer;
  }
}