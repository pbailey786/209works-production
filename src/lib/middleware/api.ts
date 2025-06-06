import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withValidation } from './validation';
import {
  applyRateLimit,
  shouldRateLimit,
  RateLimitType,
  RateLimitResult,
} from './ratelimit';
import {
  startRequestLogging,
  endRequestLogging,
  getPerformanceMetrics,
} from './logging';
import { applyCORS, getCORSConfig, CORSConfig } from './cors';
import {
  generateRequestId,
  createErrorResponse,
  createSuccessResponse,
  AuthenticationError,
  AuthorizationError,
} from '../errors/api-errors';
import {
  errorMonitor,
  createErrorContext,
  ErrorLogger,
} from '../monitoring/error-monitor';
import { healthMetrics } from '../../app/api/health/monitoring/route';
import { requireAuth } from '../../app/api/auth/requireAuth';
import { requireRole } from '../../app/api/auth/requireRole';

// API middleware configuration interface
export interface APIMiddlewareConfig<TBody = any, TQuery = any> {
  // Validation schemas
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<TQuery>;
  paramsSchema?: z.ZodSchema<any>;

  // Authentication & authorization
  requireAuthentication?: boolean;
  requiredRoles?: string[];

  // Rate limiting
  rateLimit?: {
    enabled?: boolean;
    type?: RateLimitType;
  };

  // CORS configuration
  cors?: {
    enabled?: boolean;
    config?: Partial<CORSConfig>;
  };

  // Logging configuration
  logging?: {
    enabled?: boolean;
    includeBody?: boolean;
    includeQuery?: boolean;
  };

  // Performance monitoring
  monitoring?: {
    enabled?: boolean;
    slowRequestThreshold?: number; // milliseconds
  };

  // Response compression
  compression?: boolean;
}

// Enhanced context interface
export interface APIContext<TBody = any, TQuery = any> {
  params: any;
  body?: TBody;
  query?: TQuery;
  requestId: string;
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  performance: {
    startTime: number;
    trackDatabaseQuery: () => void;
    trackCacheHit: () => void;
    trackCacheMiss: () => void;
  };
}

// Main API middleware wrapper
export function withAPIMiddleware<TBody = any, TQuery = any>(
  handler: (
    req: NextRequest,
    context: APIContext<TBody, TQuery>
  ) => Promise<NextResponse>,
  config: APIMiddlewareConfig<TBody, TQuery> = {}
) {
  return async (req: NextRequest, routeParams: { params: any }) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    let user: any = null;
    let statusCode = 200;
    let error: any = null;
    let response: NextResponse;
    let rateLimitResult: RateLimitResult | null = null;

    try {
      // Initialize context
      const context: APIContext<TBody, TQuery> = {
        params: routeParams.params,
        requestId,
        performance: {
          startTime,
          trackDatabaseQuery: () => {
            const { trackDatabaseQuery } = require('./logging');
            trackDatabaseQuery(requestId);
          },
          trackCacheHit: () => {
            const { trackCacheHit } = require('./logging');
            trackCacheHit(requestId);
          },
          trackCacheMiss: () => {
            const { trackCacheMiss } = require('./logging');
            trackCacheMiss(requestId);
          },
        },
      };

      // 1. CORS handling for preflight requests
      if (req.method === 'OPTIONS' && config.cors?.enabled !== false) {
        const { handlePreflight } = require('./cors');
        return handlePreflight(req, config.cors?.config);
      }

      // 2. Authentication & Authorization
      if (config.requireAuthentication || config.requiredRoles) {
        try {
          if (config.requiredRoles && config.requiredRoles.length > 0) {
            const session = await requireRole(req, config.requiredRoles);
            if (session instanceof NextResponse) {
              throw new AuthorizationError('Insufficient permissions');
            }
            user = (session as any).user;
          } else if (config.requireAuthentication) {
            const session = await requireAuth(req);
            if (session instanceof NextResponse) {
              throw new AuthenticationError();
            }
            user = (session as any).user;
          }

          if (user) {
            context.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              ...user,
            };

            // Set user context for error monitoring
            errorMonitor.setUserContext({
              id: user.id,
              email: user.email,
              role: user.role,
            });
          }
        } catch (authError) {
          error = authError;
          statusCode = authError instanceof AuthenticationError ? 401 : 403;

          // Log authentication/authorization errors
          ErrorLogger.auth(
            authError as Error,
            createErrorContext(req, {
              userId: user?.id,
              requestId,
              additionalData: {
                requiredRoles: config.requiredRoles,
                requireAuthentication: config.requireAuthentication,
              },
            })
          );

          response = createErrorResponse(authError, requestId);
          return applyFinalMiddleware(req, response, config);
        }
      }

      // 3. Start request logging
      if (config.logging?.enabled !== false) {
        startRequestLogging(req, requestId, {
          userId: user?.id,
          userRole: user?.role,
          includeBody: config.logging?.includeBody,
        });
      }

      // 4. Rate limiting
      if (
        config.rateLimit?.enabled !== false &&
        shouldRateLimit(new URL(req.url).pathname)
      ) {
        try {
          rateLimitResult = await applyRateLimit(req, {
            userId: user?.id,
            userRole: user?.role,
            customType: config.rateLimit?.type,
          });
        } catch (rateLimitError) {
          error = rateLimitError;
          statusCode = 429;

          // Log rate limit violations
          ErrorLogger.security(
            `Rate limit exceeded for ${user?.id || 'anonymous'} user`,
            createErrorContext(req, {
              userId: user?.id,
              requestId,
              additionalData: {
                rateLimitType: config.rateLimit?.type,
                rateLimitResult: (rateLimitError as any).rateLimitResult,
              },
            })
          );

          response = createErrorResponse(rateLimitError, requestId);
          return applyFinalMiddleware(req, response, config, {
            requestId,
            statusCode,
            user,
            startTime,
            error: rateLimitError,
            rateLimitResult: (rateLimitError as any).rateLimitResult,
          });
        }
      }

      // 5. Request validation
      if (config.bodySchema || config.querySchema || config.paramsSchema) {
        try {
          // Validate request body
          if (
            config.bodySchema &&
            ['POST', 'PUT', 'PATCH'].includes(req.method)
          ) {
            try {
              const rawBody = await req.json();
              context.body = config.bodySchema.parse(rawBody);
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                throw new Error('Invalid JSON in request body');
              }
              throw parseError;
            }
          }

          // Validate query parameters
          if (config.querySchema) {
            const searchParams = new URL(req.url).searchParams;
            const queryObject = Object.fromEntries(searchParams.entries());
            context.query = config.querySchema.parse(queryObject);
          }

          // Validate URL parameters
          if (config.paramsSchema) {
            context.params = config.paramsSchema.parse(routeParams.params);
          }
        } catch (validationError) {
          error = validationError;
          statusCode = 400;

          // Log validation errors
          ErrorLogger.validation(
            validationError as Error,
            createErrorContext(req, {
              userId: user?.id,
              requestId,
              additionalData: {
                bodySchema: !!config.bodySchema,
                querySchema: !!config.querySchema,
                paramsSchema: !!config.paramsSchema,
              },
            })
          );

          response = createErrorResponse(validationError, requestId);
          return applyFinalMiddleware(req, response, config);
        }
      }

      // 6. Execute the main handler
      response = await handler(req, context);
      statusCode = response.status;

      // 7. Apply final middleware
      return applyFinalMiddleware(req, response, config, {
        requestId,
        statusCode,
        user,
        startTime,
        rateLimitResult,
      });
    } catch (handlerError) {
      error = handlerError;
      statusCode = (handlerError as any).statusCode || 500;

      // Log handler errors with appropriate severity
      const severity = statusCode >= 500 ? 'high' : 'medium';
      ErrorLogger.business(
        handlerError as Error,
        createErrorContext(req, {
          userId: user?.id,
          requestId,
          additionalData: {
            handlerConfig: {
              requireAuthentication: config.requireAuthentication,
              requiredRoles: config.requiredRoles,
              rateLimitEnabled: config.rateLimit?.enabled,
            },
          },
        })
      );

      response = createErrorResponse(handlerError, requestId);

      return applyFinalMiddleware(req, response, config, {
        requestId,
        statusCode,
        user,
        startTime,
        error: handlerError,
        rateLimitResult,
      });
    }
  };
}

// Apply final middleware (CORS, logging, headers)
function applyFinalMiddleware(
  req: NextRequest,
  response: NextResponse,
  config: APIMiddlewareConfig,
  options?: {
    requestId?: string;
    statusCode?: number;
    user?: any;
    startTime?: number;
    error?: any;
    rateLimitResult?: RateLimitResult | null;
  }
): NextResponse {
  const { requestId, statusCode, user, startTime, error, rateLimitResult } =
    options || {};

  // 1. Add request ID header
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }

  // 2. Add rate limit headers
  if (rateLimitResult && config.rateLimit?.enabled !== false) {
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // 3. Apply CORS headers
  if (config.cors?.enabled !== false) {
    applyCORS(req, response, config.cors?.config);
  }

  // 4. Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Add performance headers (in development)
  if (process.env.NODE_ENV === 'development' && startTime) {
    const duration = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${duration}ms`);
  }

  // 6. End request logging and record metrics
  if (config.logging?.enabled !== false && requestId && statusCode) {
    const metrics = getPerformanceMetrics(requestId);
    endRequestLogging(requestId, statusCode, {
      error,
      additionalMetrics: {
        databaseQueries: metrics?.databaseQueries,
        cacheHits: metrics?.cacheHits,
        cacheMisses: metrics?.cacheMisses,
      },
    });

    // Record request metrics for health monitoring
    if (startTime) {
      const duration = Date.now() - startTime;
      const success = statusCode < 400;
      const endpoint = new URL(req.url).pathname;

      try {
        healthMetrics.recordRequest(duration, success, endpoint);

        // Record error metrics if applicable
        if (error) {
          const category =
            statusCode >= 500
              ? 'system'
              : statusCode === 429
                ? 'rate_limit'
                : statusCode === 401 || statusCode === 403
                  ? 'authentication'
                  : statusCode >= 400
                    ? 'validation'
                    : 'unknown';

          const severity =
            statusCode >= 500
              ? 'high'
              : statusCode === 429
                ? 'medium'
                : statusCode >= 400
                  ? 'low'
                  : 'medium';

          healthMetrics.recordError(
            category,
            severity,
            error.message || 'Unknown error'
          );
        }

        // Log performance issues
        if (duration > 2000) {
          ErrorLogger.performance(
            'Slow API request',
            {
              duration,
              databaseQueries: metrics?.databaseQueries || 0,
              cacheHits: metrics?.cacheHits || 0,
              cacheMisses: metrics?.cacheMisses || 0,
            },
            createErrorContext(req, {
              userId: user?.id,
              requestId,
              additionalData: {
                performanceThreshold: 2000,
                actualDuration: duration,
                endpoint,
              },
            })
          );
        }
      } catch (metricsError) {
        console.error('Failed to record metrics:', metricsError);
      }
    }
  }

  return response;
}

// Preset configurations for common use cases
export { apiConfigs, mergeAPIConfig } from './configs';
