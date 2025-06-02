import { OpenAI } from 'openai';

// Validate API key on module load (but allow build-time flexibility)
const apiKey = process.env.OPENAI_API_KEY;

// Only validate in runtime, not during build
if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PHASE !== 'phase-production-build') {
  if (!apiKey) {
    console.warn('OPENAI_API_KEY environment variable is not set');
  } else {
    // Support both old (sk-) and new (sk-proj-) OpenAI API key formats
    if (apiKey.length < 20 || (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-'))) {
      console.warn('OPENAI_API_KEY format may be invalid');
    }
  }
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
};

// In-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Validate API key at runtime
function validateApiKey(): void {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  // Support both old (sk-) and new (sk-proj-) OpenAI API key formats
  if (apiKey.length < 20 || (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-'))) {
    throw new Error('Invalid OPENAI_API_KEY format');
  }
}

// Initialize OpenAI client with proper configuration
export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key-for-build', // Use dummy key during build
  timeout: 30000, // 30 second timeout
  maxRetries: 3,
  defaultHeaders: {
    'User-Agent': '209jobs/1.0',
  },
});

// Input validation helper
function validateInput(input: string, fieldName: string = 'input'): void {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (input.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (input.length > 8000) { // OpenAI token limit consideration
    throw new Error(`${fieldName} exceeds maximum length (8000 characters)`);
  }
  
  // Basic content filtering
  const suspiciousPatterns = [
    /\b(hack|exploit|inject|malicious)\b/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      throw new Error(`${fieldName} contains potentially malicious content`);
    }
  }
}

// Rate limiting helper
function checkRateLimit(identifier: string = 'global'): void {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  // Clean old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const current = rateLimitStore.get(identifier) || { count: 0, resetTime: now + 60000 };
  
  if (current.count >= RATE_LIMIT.maxRequestsPerMinute) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  current.count++;
  rateLimitStore.set(identifier, current);
}

// Safe error handling that doesn't expose API keys
function handleOpenAIError(error: any): never {
  console.error('OpenAI API error (details hidden for security):', {
    message: error.message,
    type: error.type,
    code: error.code,
    status: error.status,
    // Explicitly exclude any fields that might contain API keys
  });
  
  // Return generic error to prevent information leakage
  if (error.status === 429) {
    throw new Error('API rate limit exceeded. Please try again later.');
  } else if (error.status === 401) {
    throw new Error('API authentication failed. Please check configuration.');
  } else if (error.status >= 500) {
    throw new Error('OpenAI service temporarily unavailable. Please try again later.');
  } else {
    throw new Error('Failed to process request. Please try again.');
  }
}

// Get text embedding with comprehensive error handling and validation
export async function getEmbedding(
  input: string, 
  options: {
    model?: string;
    rateLimitId?: string;
    timeout?: number;
  } = {}
): Promise<number[]> {
  const { 
    model = 'text-embedding-3-small', 
    rateLimitId = 'global',
    timeout = 30000 
  } = options;
  
  try {
    // Validate API key at runtime
    validateApiKey();

    // Validate input
    validateInput(input, 'Embedding input');

    // Check rate limits
    checkRateLimit(rateLimitId);
    
    // Sanitize input (remove potential injection attempts)
    const sanitizedInput = input
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
    
    if (sanitizedInput.length === 0) {
      throw new Error('Input is empty after sanitization');
    }
    
    // Create embedding with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await openai.embeddings.create({
        model,
        input: sanitizedInput,
        encoding_format: 'float',
      }, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Validate response
      if (!response.data || response.data.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }
      
      const embedding = response.data[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding data received');
      }
      
      // Validate embedding values
      if (embedding.some(val => typeof val !== 'number' || !isFinite(val))) {
        throw new Error('Invalid embedding values received');
      }
      
      return embedding;
      
    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    // Handle OpenAI specific errors safely
    if (error.constructor.name === 'OpenAIError' || error.status) {
      handleOpenAIError(error);
    }
    
    // Re-throw validation and other errors
    throw error;
  }
}

// Generate chat completion with security measures
export async function getChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    rateLimitId?: string;
    timeout?: number;
  } = {}
): Promise<string> {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7,
    rateLimitId = 'global',
    timeout = 60000
  } = options;
  
  try {
    // Validate API key at runtime
    validateApiKey();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content');
      }
      validateInput(message.content, `Message content (${message.role})`);
    }
    
    // Check rate limits
    checkRateLimit(rateLimitId);
    
    // Sanitize messages
    const sanitizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim()
    }));
    
    // Create completion with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: sanitizedMessages as any,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Validate response
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response from OpenAI API');
      }
      
      return content;
      
    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    // Handle OpenAI specific errors safely
    if (error.constructor.name === 'OpenAIError' || error.status) {
      handleOpenAIError(error);
    }
    
    // Re-throw validation and other errors
    throw error;
  }
}

// Health check function
export async function checkOpenAIHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    
    // Simple test embedding
    await getEmbedding('health check', { 
      rateLimitId: 'health-check',
      timeout: 10000 
    });
    
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

// Export rate limit status for monitoring
export function getRateLimitStatus(): {
  activeConnections: number;
  rateLimitEntries: number;
} {
  return {
    activeConnections: rateLimitStore.size,
    rateLimitEntries: rateLimitStore.size,
  };
}