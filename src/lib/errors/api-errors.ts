import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Standard error response interface
export interface ApiErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

// Error codes enum for consistent error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// Custom error classes
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, ErrorCode.AUTHENTICATION_ERROR);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, ErrorCode.AUTHORIZATION_ERROR);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, ErrorCode.CONFLICT);
  }
}

export class RateLimitError extends ApiError {
  public readonly rateLimitResult?: any;
  
  constructor(message: string = 'Rate limit exceeded', rateLimitResult?: any) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
    this.rateLimitResult = rateLimitResult;
  }
}

// Error response formatter
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  const timestamp = new Date().toISOString();

  // Handle known API errors
  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      error: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      requestId,
    };
    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiErrorResponse = {
      error: 'ValidationError',
      message: 'Invalid input data',
      code: ErrorCode.VALIDATION_ERROR,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
      timestamp,
      requestId,
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error';
    let statusCode = 500;
    let code = ErrorCode.DATABASE_ERROR;

    switch (error.code) {
      case 'P2002':
        message = 'Resource already exists';
        statusCode = 409;
        code = ErrorCode.CONFLICT;
        break;
      case 'P2025':
        message = 'Resource not found';
        statusCode = 404;
        code = ErrorCode.NOT_FOUND;
        break;
      case 'P2003':
        message = 'Invalid reference';
        statusCode = 400;
        code = ErrorCode.VALIDATION_ERROR;
        break;
    }

    const response: ApiErrorResponse = {
      error: 'DatabaseError',
      message,
      code,
      details: process.env.NODE_ENV === 'development' ? error.meta : undefined,
      timestamp,
      requestId,
    };
    return NextResponse.json(response, { status: statusCode });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response: ApiErrorResponse = {
      error: 'ValidationError',
      message: 'Invalid database operation',
      code: ErrorCode.VALIDATION_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp,
      requestId,
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Handle generic errors
  if (error instanceof Error) {
    const response: ApiErrorResponse = {
      error: 'InternalServerError',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp,
      requestId,
    };
    return NextResponse.json(response, { status: 500 });
  }

  // Handle unknown errors
  const response: ApiErrorResponse = {
    error: 'UnknownError',
    message: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    timestamp,
    requestId,
  };
  return NextResponse.json(response, { status: 500 });
}

// Validation helper that throws ApiError on validation failure
export function validateRequestData<T>(
  schema: any,
  data: unknown,
  errorMessage = 'Invalid request data'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(errorMessage, error.errors);
    }
    throw error;
  }
}

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode = 200
): NextResponse<{ success: true; data: T; message?: string }> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
} 