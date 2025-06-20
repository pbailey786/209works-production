import { NextRequest, NextResponse } from 'next/server';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * GET /api/docs
 * Generate OpenAPI specification for 209 Works API
 */
export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const baseUrl = `https://${hostname}`;

    const openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: `${domainConfig.displayName} API`,
        description: `Comprehensive API for ${domainConfig.displayName} - Local job platform for ${domainConfig.region}`,
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'api@209.works',
          url: `${baseUrl}/support`,
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
        termsOfService: `${baseUrl}/terms`,
      },
      servers: [
        {
          url: baseUrl,
          description: `${domainConfig.displayName} Production API`,
        },
      ],
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication. Get yours from the developer dashboard.',
          },
        },
        schemas: {
          Job: {
            type: 'object',
            required: ['id', 'title', 'company', 'location', 'status'],
            properties: {
              id: {
                type: 'string',
                description: 'Unique job identifier',
                example: 'job_123456789',
              },
              title: {
                type: 'string',
                description: 'Job title',
                example: 'Software Engineer',
              },
              company: {
                type: 'string',
                description: 'Company name',
                example: 'Tech Startup Inc.',
              },
              location: {
                type: 'string',
                description: 'Job location (local only)',
                example: 'Modesto, CA',
              },
              jobType: {
                type: 'string',
                enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
                description: 'Type of employment',
              },
              experienceLevel: {
                type: 'string',
                enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'],
                description: 'Required experience level',
              },
              salaryMin: {
                type: 'number',
                description: 'Minimum salary',
                example: 80000,
              },
              salaryMax: {
                type: 'number',
                description: 'Maximum salary',
                example: 120000,
              },
              description: {
                type: 'string',
                description: 'Job description',
              },
              requirements: {
                type: 'array',
                items: { type: 'string' },
                description: 'Job requirements',
              },
              skills: {
                type: 'array',
                items: { type: 'string' },
                description: 'Required skills',
              },
              categories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Job categories',
              },
              remote: {
                type: 'boolean',
                description: 'Remote work allowed (always false for 209 Works)',
                example: false,
              },
              featured: {
                type: 'boolean',
                description: 'Featured job listing',
              },
              status: {
                type: 'string',
                enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CLOSED'],
                description: 'Job status',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Job creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                description: 'Job expiration timestamp',
              },
            },
          },
          Application: {
            type: 'object',
            required: ['id', 'jobId', 'applicantId', 'status'],
            properties: {
              id: {
                type: 'string',
                description: 'Unique application identifier',
                example: 'app_123456789',
              },
              jobId: {
                type: 'string',
                description: 'Associated job ID',
                example: 'job_123456789',
              },
              applicantId: {
                type: 'string',
                description: 'Applicant user ID',
                example: 'user_123456789',
              },
              status: {
                type: 'string',
                enum: ['PENDING', 'REVIEWING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'],
                description: 'Application status',
              },
              coverLetter: {
                type: 'string',
                description: 'Cover letter text',
              },
              resumeUrl: {
                type: 'string',
                description: 'Resume file URL',
              },
              appliedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Application submission timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
          User: {
            type: 'object',
            required: ['id', 'email', 'userType'],
            properties: {
              id: {
                type: 'string',
                description: 'Unique user identifier',
                example: 'user_123456789',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email address',
              },
              firstName: {
                type: 'string',
                description: 'First name',
              },
              lastName: {
                type: 'string',
                description: 'Last name',
              },
              userType: {
                type: 'string',
                enum: ['job_seeker', 'employer', 'admin'],
                description: 'User type',
              },
              location: {
                type: 'string',
                description: 'User location',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Account creation timestamp',
              },
            },
          },
          Error: {
            type: 'object',
            required: ['error', 'message'],
            properties: {
              error: {
                type: 'string',
                description: 'Error type',
                example: 'validation_error',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
                example: 'The provided data is invalid',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Error timestamp',
              },
            },
          },
          PaginatedResponse: {
            type: 'object',
            required: ['data', 'pagination'],
            properties: {
              data: {
                type: 'array',
                items: {},
                description: 'Array of results',
              },
              pagination: {
                type: 'object',
                required: ['page', 'limit', 'total', 'totalPages'],
                properties: {
                  page: {
                    type: 'number',
                    description: 'Current page number',
                    example: 1,
                  },
                  limit: {
                    type: 'number',
                    description: 'Items per page',
                    example: 20,
                  },
                  total: {
                    type: 'number',
                    description: 'Total number of items',
                    example: 150,
                  },
                  totalPages: {
                    type: 'number',
                    description: 'Total number of pages',
                    example: 8,
                  },
                },
              },
            },
          },
        },
        responses: {
          UnauthorizedError: {
            description: 'API key is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'unauthorized',
                  message: 'Invalid API key',
                  timestamp: '2024-01-01T00:00:00Z',
                },
              },
            },
          },
          ForbiddenError: {
            description: 'Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'forbidden',
                  message: 'Insufficient permissions for this operation',
                  timestamp: '2024-01-01T00:00:00Z',
                },
              },
            },
          },
          NotFoundError: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'not_found',
                  message: 'The requested resource was not found',
                  timestamp: '2024-01-01T00:00:00Z',
                },
              },
            },
          },
          ValidationError: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'validation_error',
                  message: 'The provided data is invalid',
                  details: {
                    field: 'email',
                    message: 'Invalid email format',
                  },
                  timestamp: '2024-01-01T00:00:00Z',
                },
              },
            },
          },
          RateLimitError: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'rate_limit_exceeded',
                  message: 'Too many requests. Please try again later.',
                  timestamp: '2024-01-01T00:00:00Z',
                },
              },
            },
            headers: {
              'X-RateLimit-Limit': {
                description: 'Request limit per time window',
                schema: { type: 'integer' },
              },
              'X-RateLimit-Remaining': {
                description: 'Remaining requests in current window',
                schema: { type: 'integer' },
              },
              'X-RateLimit-Reset': {
                description: 'Time when rate limit resets',
                schema: { type: 'integer' },
              },
            },
          },
        },
      },
      paths: {
        '/api/jobs': {
          get: {
            summary: 'List jobs',
            description: 'Retrieve a paginated list of job postings',
            tags: ['Jobs'],
            parameters: [
              {
                name: 'page',
                in: 'query',
                description: 'Page number',
                schema: { type: 'integer', minimum: 1, default: 1 },
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
              },
              {
                name: 'location',
                in: 'query',
                description: 'Filter by location',
                schema: { type: 'string' },
              },
              {
                name: 'jobType',
                in: 'query',
                description: 'Filter by job type',
                schema: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'] },
              },
              {
                name: 'experienceLevel',
                in: 'query',
                description: 'Filter by experience level',
                schema: { type: 'string', enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'] },
              },
              {
                name: 'salaryMin',
                in: 'query',
                description: 'Minimum salary filter',
                schema: { type: 'number' },
              },
              {
                name: 'salaryMax',
                in: 'query',
                description: 'Maximum salary filter',
                schema: { type: 'number' },
              },
              {
                name: 'featured',
                in: 'query',
                description: 'Filter featured jobs only',
                schema: { type: 'boolean' },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      allOf: [
                        { $ref: '#/components/schemas/PaginatedResponse' },
                        {
                          properties: {
                            data: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Job' },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '429': { $ref: '#/components/responses/RateLimitError' },
            },
          },
          post: {
            summary: 'Create job',
            description: 'Create a new job posting',
            tags: ['Jobs'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['title', 'company', 'location', 'description'],
                    properties: {
                      title: { type: 'string', example: 'Software Engineer' },
                      company: { type: 'string', example: 'Tech Startup Inc.' },
                      location: { type: 'string', example: 'Modesto, CA' },
                      description: { type: 'string' },
                      jobType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'] },
                      experienceLevel: { type: 'string', enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'] },
                      salaryMin: { type: 'number' },
                      salaryMax: { type: 'number' },
                      requirements: { type: 'array', items: { type: 'string' } },
                      skills: { type: 'array', items: { type: 'string' } },
                      categories: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Job created successfully',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/ValidationError' },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '403': { $ref: '#/components/responses/ForbiddenError' },
              '429': { $ref: '#/components/responses/RateLimitError' },
            },
          },
        },
        '/api/jobs/{jobId}': {
          get: {
            summary: 'Get job',
            description: 'Retrieve a specific job posting',
            tags: ['Jobs'],
            parameters: [
              {
                name: 'jobId',
                in: 'path',
                required: true,
                description: 'Job ID',
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '404': { $ref: '#/components/responses/NotFoundError' },
              '429': { $ref: '#/components/responses/RateLimitError' },
            },
          },
        },
        '/api/search/semantic': {
          post: {
            summary: 'Semantic job search',
            description: 'AI-powered semantic job search using natural language',
            tags: ['Search'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['query'],
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Natural language search query',
                        example: 'I want a remote software engineering job with Python and React',
                      },
                      filters: {
                        type: 'object',
                        properties: {
                          jobType: { type: 'string' },
                          experienceLevel: { type: 'string' },
                          salaryMin: { type: 'number' },
                          salaryMax: { type: 'number' },
                          location: { type: 'string' },
                          skills: { type: 'array', items: { type: 'string' } },
                        },
                      },
                      limit: { type: 'number', minimum: 1, maximum: 50, default: 20 },
                      threshold: { type: 'number', minimum: 0.1, maximum: 1, default: 0.7 },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Semantic search results',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'object',
                          properties: {
                            results: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  job: { $ref: '#/components/schemas/Job' },
                                  semanticScore: { type: 'number', description: 'AI similarity score (0-1)' },
                                  relevanceScore: { type: 'number', description: 'Traditional relevance score (0-1)' },
                                  matchedConcepts: { type: 'array', items: { type: 'string' } },
                                  explanation: { type: 'string', description: 'AI explanation of the match' },
                                },
                              },
                            },
                            totalResults: { type: 'number' },
                            searchParams: { type: 'object' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '400': { $ref: '#/components/responses/ValidationError' },
              '401': { $ref: '#/components/responses/UnauthorizedError' },
              '429': { $ref: '#/components/responses/RateLimitError' },
            },
          },
        },
      },
      tags: [
        {
          name: 'Jobs',
          description: 'Job posting management',
        },
        {
          name: 'Applications',
          description: 'Job application management',
        },
        {
          name: 'Search',
          description: 'Job search and discovery',
        },
        {
          name: 'Users',
          description: 'User management',
        },
        {
          name: 'Analytics',
          description: 'Platform analytics and insights',
        },
        {
          name: 'Webhooks',
          description: 'Real-time event notifications',
        },
      ],
    };

    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
