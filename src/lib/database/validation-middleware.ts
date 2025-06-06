import { Prisma } from '@prisma/client';

/**
 * Enhanced Prisma middleware for data validation and integrity checks
 * Addresses validation gaps identified in the database schema analysis
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class DatabaseValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'DatabaseValidationError';
    this.errors = errors;
  }
}

/**
 * Validation rules for different models
 */
export const validationRules = {
  Job: {
    validateSalaryRange: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Check salary range validity
      if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
        errors.push({
          field: 'salary',
          message: 'Minimum salary cannot be greater than maximum salary',
          value: { min: data.salaryMin, max: data.salaryMax },
        });
      }

      // Check for negative salaries
      if (data.salaryMin && data.salaryMin < 0) {
        errors.push({
          field: 'salaryMin',
          message: 'Salary cannot be negative',
          value: data.salaryMin,
        });
      }

      if (data.salaryMax && data.salaryMax < 0) {
        errors.push({
          field: 'salaryMax',
          message: 'Salary cannot be negative',
          value: data.salaryMax,
        });
      }

      return errors;
    },

    validateUrl: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.url) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(data.url)) {
          errors.push({
            field: 'url',
            message: 'URL must start with http:// or https://',
            value: data.url,
          });
        }
      }

      return errors;
    },

    validateDescription: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.description && data.description.length < 10) {
        errors.push({
          field: 'description',
          message: 'Job description must be at least 10 characters long',
          value: data.description?.length,
        });
      }

      return errors;
    },
  },

  User: {
    validateEmail: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(data.email)) {
          errors.push({
            field: 'email',
            message: 'Invalid email format',
            value: data.email,
          });
        }
      }

      return errors;
    },

    validateWebsite: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.companyWebsite) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(data.companyWebsite)) {
          errors.push({
            field: 'companyWebsite',
            message: 'Company website must be a valid URL',
            value: data.companyWebsite,
          });
        }
      }

      return errors;
    },
  },

  Company: {
    validateSlug: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.slug) {
        const slugPattern = /^[a-z0-9-]+$/;
        if (!slugPattern.test(data.slug)) {
          errors.push({
            field: 'slug',
            message:
              'Company slug must contain only lowercase letters, numbers, and hyphens',
            value: data.slug,
          });
        }
      }

      return errors;
    },

    validateWebsite: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.website) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(data.website)) {
          errors.push({
            field: 'website',
            message: 'Website must be a valid URL',
            value: data.website,
          });
        }
      }

      return errors;
    },
  },

  AddOn: {
    validatePrice: (data: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (data.price && data.price < 0) {
        errors.push({
          field: 'price',
          message: 'Price cannot be negative',
          value: data.price,
        });
      }

      return errors;
    },
  },
};

/**
 * Main validation function for a specific model
 */
export function validateModelData(model: string, data: any): ValidationError[] {
  const modelRules = validationRules[model as keyof typeof validationRules];
  if (!modelRules) return [];

  const allErrors: ValidationError[] = [];

  // Run all validation rules for the model
  Object.values(modelRules).forEach(validationFn => {
    const errors = validationFn(data);
    allErrors.push(...errors);
  });

  return allErrors;
}

/**
 * Prisma middleware that applies validation rules
 */
export const validationMiddleware: Prisma.Middleware = async (params, next) => {
  const { model, action, args } = params;

  // Apply validation on create and update operations
  if (model && (action === 'create' || action === 'update')) {
    const data = args.data;

    if (data) {
      const errors = validateModelData(model, data);

      if (errors.length > 0) {
        throw new DatabaseValidationError(errors);
      }
    }
  }

  return next(params);
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  // Log slow queries (>1000ms)
  if (duration > 1000) {
    console.warn(
      `🐌 Slow query detected: ${params.model}.${params.action} - ${duration}ms`,
      {
        model: params.model,
        action: params.action,
        duration,
        args: JSON.stringify(params.args, null, 2),
      }
    );
  }

  // Log very slow queries (>5000ms) as errors
  if (duration > 5000) {
    console.error(
      `🚨 Very slow query: ${params.model}.${params.action} - ${duration}ms`,
      {
        model: params.model,
        action: params.action,
        duration,
        args: params.args,
      }
    );
  }

  return result;
};

/**
 * Audit trail middleware
 */
export const auditMiddleware: Prisma.Middleware = async (params, next) => {
  const { model, action, args } = params;

  // Log data modifications for audit trail
  if (model && ['create', 'update', 'delete'].includes(action)) {
    const timestamp = new Date().toISOString();

    // In production, you might want to store this in a dedicated audit table
    console.info(`📝 Audit: ${timestamp} - ${model}.${action}`, {
      model,
      action,
      timestamp,
      // Don't log sensitive data like passwords
      args: action === 'delete' ? { where: args.where } : args,
    });
  }

  return next(params);
};

/**
 * Error handling middleware
 */
export const errorHandlingMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  try {
    return await next(params);
  } catch (error) {
    // Enhanced error logging with context
    console.error(
      `💥 Database operation failed: ${params.model}.${params.action}`,
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        model: params.model,
        action: params.action,
        args: params.args,
      }
    );

    // Re-throw the error to maintain normal error handling flow
    throw error;
  }
};

/**
 * Apply all middleware to Prisma client
 */
export function applyEnhancedMiddleware(prisma: any) {
  // Apply middleware in order of importance
  prisma.$use(errorHandlingMiddleware);
  prisma.$use(validationMiddleware);
  prisma.$use(performanceMiddleware);
  prisma.$use(auditMiddleware);

  console.log('✅ Enhanced database middleware applied');
}

/**
 * Utility function to generate encryption key for environment setup
 */
export function generateEncryptionKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Database health check function
 */
export async function checkDatabaseHealth(prisma: any): Promise<{
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}> {
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check pgvector extension
    const vectorExtension = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as has_vector
    `;

    // Get database stats
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "Job") as job_count,
        (SELECT COUNT(*) FROM "User") as user_count,
        (SELECT COUNT(*) FROM "Company") as company_count
    `;

    return {
      status: 'healthy',
      details: {
        connected: true,
        pgvector: vectorExtension[0]?.has_vector || false,
        stats: stats[0] || {},
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
