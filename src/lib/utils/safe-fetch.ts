/**
 * Centralized safe fetch utility for Supabase and external APIs
 * Provides consistent error handling, retries, and response validation
 */

export interface SafeFetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateResponse?: (response: Response) => boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface SafeFetchResult<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  status?: number;
  response?: Response;
}

/**
 * Safe fetch wrapper that handles common error scenarios
 */
export async function safeFetch<T = any>(
  url: string,
  options: RequestInit & SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    validateResponse = (res) => res.ok,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout controller
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

      // Combine timeout signal with user-provided signal
      const combinedSignal = options.signal 
        ? combineSignals([options.signal, timeoutController.signal])
        : timeoutController.signal;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: combinedSignal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        // Validate response
        if (!validateResponse(response)) {
          let errorMessage = `Request failed with status ${response.status}`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // Failed to parse error response, use status text
            errorMessage = response.statusText || errorMessage;
          }

          return {
            data: null,
            error: errorMessage,
            success: false,
            status: response.status,
            response,
          };
        }

        // Parse response data
        let data: T | null = null;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            return {
              data: null,
              error: 'Failed to parse JSON response',
              success: false,
              status: response.status,
              response,
            };
          }
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as unknown as T;
        }

        return {
          data,
          error: null,
          success: true,
          status: response.status,
          response,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort or certain errors
      if (
        lastError.name === 'AbortError' ||
        lastError.message.includes('fetch') === false ||
        attempt === retries
      ) {
        break;
      }

      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Request failed';
  
  return {
    data: null,
    error: errorMessage.includes('AbortError') ? 'Request timeout' : errorMessage,
    success: false,
  };
}

/**
 * Safe fetch specifically for API routes with authentication
 */
export async function safeFetchAPI<T = any>(
  url: string,
  options: RequestInit & SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    validateResponse: (response) => response.status < 500, // Accept 4xx errors as valid responses
  });
}

/**
 * Safe database query wrapper that handles Prisma errors gracefully
 */
export async function safeDBQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T | null = null
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const data = await queryFn();
    return { data, error: null, success: true };
  } catch (error) {
    console.error('Database query failed:', error);
    
    // Log the error for debugging but don't expose internal details
    let errorMessage = 'Database operation failed';
    
    if (error instanceof Error) {
      // Map common Prisma errors to user-friendly messages
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Record not found';
      } else if (error.message.includes('Unique constraint')) {
        errorMessage = 'Record already exists';
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Cannot complete operation due to related records';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Operation timed out';
      }
    }
    
    return { 
      data: fallback, 
      error: errorMessage, 
      success: false 
    };
  }
}

/**
 * Helper to combine multiple AbortSignals
 */
function combineSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  signals.forEach(signal => {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  });
  
  return controller.signal;
}

/**
 * Session validation utility
 */
export function validateSession(session: any): { 
  isValid: boolean; 
  user: { id: string; email: string; role?: string } | null;
  error?: string;
} {
  if (!session) {
    return { isValid: false, user: null, error: 'No session found' };
  }

  if (!session.user) {
    return { isValid: false, user: null, error: 'No user in session' };
  }

  if (!session.user.email) {
    return { isValid: false, user: null, error: 'No email in session' };
  }

  // Extract user info safely
  const user = {
    id: (session.user as any).id || '',
    email: session.user.email,
    role: (session.user as any).role,
  };

  if (!user.id) {
    return { isValid: false, user: null, error: 'No user ID in session' };
  }

  return { isValid: true, user };
}