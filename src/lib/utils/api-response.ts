import { NextResponse } from 'next/server';

export interface ApiError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'auth' | 'not_found';
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: ApiError[];
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper class for creating standardized API responses
 */
export class ResponseHelper {
  static success<T>(
    data: T,
    message?: string,
    status = 200,
    meta?: ApiSuccessResponse['meta']
  ): NextResponse {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      ...(meta && { meta }),
    };

    return NextResponse.json(response, { status });
  }

  static error(
    message: string,
    details?: ApiError[],
    status = 400,
    code?: string
  ): NextResponse {
    const response: ApiErrorResponse = {
      success: false,
      error: message,
      ...(details && { details }),
      ...(code && { code }),
    };

    return NextResponse.json(response, { status });
  }

  static validationError(errors: ApiError[]): NextResponse {
    return this.error('Validation failed', errors, 400, 'VALIDATION_ERROR');
  }

  static notFound(message = 'Resource not found'): NextResponse {
    return this.error(message, undefined, 404, 'NOT_FOUND');
  }

  static unauthorized(message = 'Unauthorized'): NextResponse {
    return this.error(message, undefined, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): NextResponse {
    return this.error(message, undefined, 403, 'FORBIDDEN');
  }

  static serverError(message = 'Internal server error'): NextResponse {
    return this.error(message, undefined, 500, 'INTERNAL_ERROR');
  }

  static created<T>(
    data: T,
    message = 'Resource created successfully'
  ): NextResponse {
    return this.success(data, message, 201);
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): NextResponse {
    const hasMore = page * limit < total;

    return this.success(data, message, 200, {
      total,
      page,
      limit,
      hasMore,
    });
  }
}

// Export default for backward compatibility
export default ResponseHelper;

// Utility functions for common response patterns
export const createApiError = (
  field: string,
  message: string,
  type: ApiError['type'] = 'validation'
): ApiError => ({
  field,
  message,
  type,
});

export const createValidationErrors = (
  errors: Record<string, string>
): ApiError[] => {
  return Object.entries(errors).map(([field, message]) =>
    createApiError(field, message, 'validation')
  );
};
