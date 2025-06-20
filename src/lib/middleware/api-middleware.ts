import { NextRequest, NextResponse } from '@/components/ui/card';
import { z } from '@/components/ui/card';
import { parseErrorToFormErrors, FormError } from '../validations/form-utils';

/**
 * API validation middleware for Next.js API routes
 */

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  validatedHeaders?: any;
}

/**
 * Validates API request data against provided schemas
 */
export function withValidation(
  handler: (req: ValidatedRequest) => Promise<Response>,
  options: ValidationOptions
) {
  return async (
    req: NextRequest,
    context?: { params?: any }
  ): Promise<Response> => {
    try {
      const validatedReq = req as ValidatedRequest;
      const errors: FormError[] = [];

      // Validate request body
      if (options.body) {
        try {
          const body = await req.json();
          validatedReq.validatedBody = options.body.parse(body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...parseErrorToFormErrors(error));
          } else {
            errors.push({
              field: 'body',
              message: 'Invalid JSON in request body',
              type: 'validation',
            });
          }
        }
      }

      // Validate query parameters
      if (options.query) {
        try {
          const searchParams = new URL(req.url).searchParams;
          const query = Object.fromEntries(searchParams.entries());
          validatedReq.validatedQuery = options.query.parse(query);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...parseErrorToFormErrors(error));
          }
        }
      }

      // Validate route parameters
      if (options.params && context?.params) {
        try {
          validatedReq.validatedParams = options.params.parse(context.params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...parseErrorToFormErrors(error));
          }
        }
      }

      // Validate headers
      if (options.headers) {
        try {
          const headers = Object.fromEntries(req.headers.entries());
          validatedReq.validatedHeaders = options.headers.parse(headers);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...parseErrorToFormErrors(error));
          }
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Call the actual handler
      return await handler(validatedReq);
    } catch (error) {
      console.error('API Middleware Error:', error);

      return NextResponse.json(
        {
          error: 'Internal server error',
          details: [
            {
              field: 'general',
              message: 'An unexpected error occurred',
              type: 'server',
            },
          ],
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Rate limiting middleware (simple implementation)
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  options: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest): Promise<Response> => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.headers.get('x-forwarded-for') || 'anonymous';

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }

    const current = requests.get(key) || {
      count: 0,
      resetTime: now + options.windowMs,
    };

    if (current.count >= options.maxRequests && current.resetTime > now) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: [
            {
              field: 'general',
              message: 'Too many requests. Please try again later.',
              type: 'server',
            },
          ],
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (current.resetTime - now) / 1000
            ).toString(),
          },
        }
      );
    }

    requests.set(key, {
      count: current.count + 1,
      resetTime: current.resetTime,
    });

    return await handler(req);
  };
}

/**
 * Authentication middleware
 */
export function withAuth(
  handler: (req: NextRequest & { user?: any }) => Promise<Response>,
  options: {
    required?: boolean;
    roles?: string[];
  } = {}
) {
  return async (req: NextRequest & { user?: any }): Promise<Response> => {
    try {
      // Get auth token from header
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token && options.required) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            details: [
              {
                field: 'auth',
                message: 'Authentication token is required',
                type: 'server',
              },
            ],
          },
          { status: 401 }
        );
      }

      if (token) {
        // Verify token and get user (implement your auth logic here)
        // This is a placeholder - replace with your actual auth verification
        try {
          // const user = await verifyToken(token);
          // req.user = user;

          // Check roles if specified
          if (options.roles && req.user) {
            const hasRole = options.roles.includes(req.user.role);
            if (!hasRole) {
              return NextResponse.json(
                {
                  error: 'Insufficient permissions',
                  details: [
                    {
                      field: 'auth',
                      message:
                        'You do not have permission to access this resource',
                      type: 'server',
                    },
                  ],
                },
                { status: 403 }
              );
            }
          }
        } catch (error) {
          return NextResponse.json(
            {
              error: 'Invalid token',
              details: [
                {
                  field: 'auth',
                  message: 'Authentication token is invalid',
                  type: 'server',
                },
              ],
            },
            { status: 401 }
          );
        }
      }

      return await handler(req);
    } catch (error) {
      console.error('Auth Middleware Error:', error);

      return NextResponse.json(
        {
          error: 'Authentication error',
          details: [
            {
              field: 'auth',
              message: 'An error occurred during authentication',
              type: 'server',
            },
          ],
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Helper to create standardized API responses
 */
export class ApiResponse {
  static success(data: any, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    );
  }

  static error(message: string, details?: FormError[], status = 400) {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details: details || [
          {
            field: 'general',
            message,
            type: 'server' as const,
          },
        ],
      },
      { status }
    );
  }

  static validationError(errors: FormError[]) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: errors,
      },
      { status: 400 }
    );
  }
}
