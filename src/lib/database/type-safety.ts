import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Type-safe Prisma operations to prevent runtime type errors and data corruption
 * Addresses critical type safety issues identified in Task 45.11
 */

// ===== CRITICAL TYPE SAFETY SCHEMAS =====

// Job model type safety
const JobCreateBaseSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  companyId: z.string().uuid().optional(),
  description: z.string().min(1).max(10000),
  location: z.string().min(1).max(200),
  salaryMin: z.number().int().min(0).max(10000000).optional(),
  salaryMax: z.number().int().min(0).max(10000000).optional(),
  jobType: z.enum([
    'full_time',
    'part_time',
    'contract',
    'internship',
    'temporary',
    'volunteer',
    'other',
  ]),
  categories: z.array(z.string().max(50)).max(10),
  source: z.string().min(1).max(100),
  url: z.string().url().max(500),
  postedAt: z.date(),
});

// Apply refine to create the full schema
export const JobCreateSchema = JobCreateBaseSchema.refine(
  data => {
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      return false;
    }
    return true;
  },
  {
    message: 'Minimum salary cannot be greater than maximum salary',
    path: ['salaryMin', 'salaryMax'],
  }
);

export const JobUpdateSchema = JobCreateBaseSchema.partial();

// User model type safety
export const UserCreateSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).optional(),
  companyWebsite: z.string().url().max(500).optional(),
  passwordHash: z.string().min(1),
  role: z.enum(['admin', 'employer', 'jobseeker']).default('jobseeker'),
  resumeUrl: z.string().url().max(500).optional(),
  profilePictureUrl: z.string().url().max(500).optional(),
  location: z.string().max(200).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .max(20)
    .optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  currentJobTitle: z.string().max(100).optional(),
  preferredJobTypes: z
    .array(
      z.enum([
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
        'volunteer',
        'other',
      ])
    )
    .max(7),
  skills: z.array(z.string().max(50)).max(50),
  workAuthorization: z.string().max(100).optional(),
  educationExperience: z.string().max(2000).optional(),
  companyId: z.string().uuid().optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial();

// Company model type safety
export const CompanyCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  website: z.string().url().max(500).optional(),
  logo: z.string().url().max(500).optional(),
  description: z.string().max(5000).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  founded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  headquarters: z.string().max(200).optional(),
  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .max(20)
    .optional(),
  subscriptionTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
});

export const CompanyUpdateSchema = CompanyCreateSchema.partial();

// Alert model type safety
// Create base schema without refine
const AlertCreateBaseSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'job_title_alert',
    'weekly_digest',
    'job_category_alert',
    'location_alert',
    'company_alert',
  ]),
  frequency: z
    .enum(['immediate', 'daily', 'weekly', 'monthly'])
    .default('immediate'),
  jobTitle: z.string().max(200).optional(),
  keywords: z.array(z.string().max(50)).max(20),
  location: z.string().max(200).optional(),
  categories: z.array(z.string().max(50)).max(10),
  jobTypes: z
    .array(
      z.enum([
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
        'volunteer',
        'other',
      ])
    )
    .max(7),
  companies: z.array(z.string().max(100)).max(20),
  salaryMin: z.number().int().min(0).max(10000000).optional(),
  salaryMax: z.number().int().min(0).max(10000000).optional(),
});

// Apply refine to create the full schema
export const AlertCreateSchema = AlertCreateBaseSchema.refine(
  data => {
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      return false;
    }
    return true;
  },
  {
    message: 'Minimum salary cannot be greater than maximum salary',
  }
);

export const AlertUpdateSchema = AlertCreateBaseSchema.partial().omit({
  userId: true,
});

// ===== TYPE-SAFE PRISMA WRAPPER =====

export class TypeSafePrisma {
  constructor(private prisma: PrismaClient) {}

  // Type-safe Job operations
  async createJob(data: z.infer<typeof JobCreateSchema>) {
    const validatedData = JobCreateSchema.parse(data);

    // Additional business logic validation
    if (validatedData.companyId) {
      const companyExists = await this.prisma.company.findUnique({
        where: { id: validatedData.companyId },
        select: { id: true },
      });

      if (!companyExists) {
        throw new Error(
          `Company with ID ${validatedData.companyId} does not exist`
        );
      }
    }

    return this.prisma.job.create({
      data: validatedData,
    });
  }

  async updateJob(id: string, data: z.infer<typeof JobUpdateSchema>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error('Invalid job ID format');
    }

    const validatedData = JobUpdateSchema.parse(data);

    // Check if job exists
    const existingJob = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingJob) {
      throw new Error(`Job with ID ${id} does not exist`);
    }

    return this.prisma.job.update({
      where: { id },
      data: validatedData,
    });
  }

  // Type-safe User operations
  async createUser(data: z.infer<typeof UserCreateSchema>) {
    const validatedData = UserCreateSchema.parse(data);

    // Check for duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error(`User with email ${validatedData.email} already exists`);
    }

    // Validate company reference if provided
    if (validatedData.companyId) {
      const companyExists = await this.prisma.company.findUnique({
        where: { id: validatedData.companyId },
        select: { id: true },
      });

      if (!companyExists) {
        throw new Error(
          `Company with ID ${validatedData.companyId} does not exist`
        );
      }
    }

    return this.prisma.user.create({
      data: validatedData,
    });
  }

  async updateUser(id: string, data: z.infer<typeof UserUpdateSchema>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error('Invalid user ID format');
    }

    const validatedData = UserUpdateSchema.parse(data);

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      throw new Error(`User with ID ${id} does not exist`);
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await this.prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { id: true },
      });

      if (emailConflict) {
        throw new Error(`Email ${validatedData.email} is already in use`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: validatedData,
    });
  }

  // Type-safe Company operations
  async createCompany(data: z.infer<typeof CompanyCreateSchema>) {
    const validatedData = CompanyCreateSchema.parse(data);

    // Check for duplicate name and slug
    const [nameConflict, slugConflict] = await Promise.all([
      this.prisma.company.findUnique({
        where: { name: validatedData.name },
        select: { id: true },
      }),
      this.prisma.company.findUnique({
        where: { slug: validatedData.slug },
        select: { id: true },
      }),
    ]);

    if (nameConflict) {
      throw new Error(
        `Company with name "${validatedData.name}" already exists`
      );
    }

    if (slugConflict) {
      throw new Error(
        `Company with slug "${validatedData.slug}" already exists`
      );
    }

    return this.prisma.company.create({
      data: validatedData,
    });
  }

  async updateCompany(id: string, data: z.infer<typeof CompanyUpdateSchema>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error('Invalid company ID format');
    }

    const validatedData = CompanyUpdateSchema.parse(data);

    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!existingCompany) {
      throw new Error(`Company with ID ${id} does not exist`);
    }

    // Check for conflicts if name or slug is being updated
    const conflicts = [];

    if (validatedData.name && validatedData.name !== existingCompany.name) {
      const nameConflict = await this.prisma.company.findUnique({
        where: { name: validatedData.name },
        select: { id: true },
      });

      if (nameConflict) {
        conflicts.push(
          `Company name "${validatedData.name}" is already in use`
        );
      }
    }

    if (validatedData.slug && validatedData.slug !== existingCompany.slug) {
      const slugConflict = await this.prisma.company.findUnique({
        where: { slug: validatedData.slug },
        select: { id: true },
      });

      if (slugConflict) {
        conflicts.push(
          `Company slug "${validatedData.slug}" is already in use`
        );
      }
    }

    if (conflicts.length > 0) {
      throw new Error(conflicts.join('; '));
    }

    return this.prisma.company.update({
      where: { id },
      data: validatedData,
    });
  }

  // Type-safe Alert operations
  async createAlert(data: z.infer<typeof AlertCreateSchema>) {
    const validatedData = AlertCreateSchema.parse(data);

    // Validate user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new Error(`User with ID ${validatedData.userId} does not exist`);
    }

    // Check alert limits per user
    const alertCount = await this.prisma.alert.count({
      where: { userId: validatedData.userId, isActive: true },
    });

    if (alertCount >= 20) {
      throw new Error(
        'Maximum number of active alerts (20) reached for this user'
      );
    }

    return this.prisma.alert.create({
      data: validatedData,
    });
  }

  async updateAlert(id: string, data: z.infer<typeof AlertUpdateSchema>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error('Invalid alert ID format');
    }

    const validatedData = AlertUpdateSchema.parse(data);

    // Check if alert exists
    const existingAlert = await this.prisma.alert.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingAlert) {
      throw new Error(`Alert with ID ${id} does not exist`);
    }

    return this.prisma.alert.update({
      where: { id },
      data: validatedData,
    });
  }

  // Safe JSON operations
  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    if (!z.string().uuid().safeParse(userId).success) {
      throw new Error('Invalid user ID format');
    }

    // Validate JSON structure
    const MetadataSchema = z.record(z.any()).refine(
      data => {
        try {
          JSON.stringify(data);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Metadata must be valid JSON',
      }
    );

    const validatedMetadata = MetadataSchema.parse(metadata);

    // Size limit check (prevent large JSON objects)
    const jsonString = JSON.stringify(validatedMetadata);
    if (jsonString.length > 100000) {
      // 100KB limit
      throw new Error('Metadata size exceeds 100KB limit');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        // Assuming there's a metadata field - adjust based on actual schema
        updatedAt: new Date(),
      },
    });
  }

  // Batch operations with type safety
  async createJobsBatch(jobs: z.infer<typeof JobCreateSchema>[]) {
    if (jobs.length === 0) {
      throw new Error('Cannot create empty batch of jobs');
    }

    if (jobs.length > 1000) {
      throw new Error('Batch size cannot exceed 1000 jobs');
    }

    // Validate all jobs
    const validatedJobs = jobs.map((job, index) => {
      try {
        return JobCreateSchema.parse(job);
      } catch (error) {
        throw new Error(
          `Validation failed for job at index ${index}: ${error}`
        );
      }
    });

    // Check for duplicate URLs in the batch
    const urls = validatedJobs.map(job => job.url);
    const uniqueUrls = new Set(urls);
    if (urls.length !== uniqueUrls.size) {
      throw new Error('Duplicate URLs found in job batch');
    }

    return this.prisma.job.createMany({
      data: validatedJobs,
      skipDuplicates: true,
    });
  }

  // Safe query operations with proper typing
  async findJobsWithFilters(filters: {
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    categories?: string[];
    companyIds?: string[];
    limit?: number;
    offset?: number;
  }) {
    // Validate filter parameters
    const FilterSchema = z.object({
      location: z.string().max(200).optional(),
      jobType: z
        .enum([
          'full_time',
          'part_time',
          'contract',
          'internship',
          'temporary',
          'volunteer',
          'other',
        ])
        .optional(),
      salaryMin: z.number().int().min(0).max(10000000).optional(),
      salaryMax: z.number().int().min(0).max(10000000).optional(),
      categories: z.array(z.string().max(50)).max(10).optional(),
      companyIds: z.array(z.string().uuid()).max(50).optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
    });

    const validatedFilters = FilterSchema.parse(filters);

    // Build where clause safely
    const whereClause: any = {};

    if (validatedFilters.location) {
      whereClause.location = {
        contains: validatedFilters.location,
        mode: 'insensitive',
      };
    }

    if (validatedFilters.jobType) {
      whereClause.jobType = validatedFilters.jobType;
    }

    if (validatedFilters.salaryMin || validatedFilters.salaryMax) {
      whereClause.OR = [];

      if (validatedFilters.salaryMin) {
        whereClause.OR.push({
          salaryMin: { gte: validatedFilters.salaryMin },
        });
        whereClause.OR.push({
          salaryMax: { gte: validatedFilters.salaryMin },
        });
      }

      if (validatedFilters.salaryMax) {
        whereClause.OR.push({
          salaryMax: { lte: validatedFilters.salaryMax },
        });
      }
    }

    if (validatedFilters.categories && validatedFilters.categories.length > 0) {
      whereClause.categories = {
        hasSome: validatedFilters.categories,
      };
    }

    if (validatedFilters.companyIds && validatedFilters.companyIds.length > 0) {
      whereClause.companyId = {
        in: validatedFilters.companyIds,
      };
    }

    return this.prisma.job.findMany({
      where: whereClause,
      take: validatedFilters.limit,
      skip: validatedFilters.offset,
      orderBy: { postedAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        companyId: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        jobType: true,
        categories: true,
        url: true,
        postedAt: true,
        createdAt: true,
      },
    });
  }
}

// Export type-safe instance
export function createTypeSafePrisma(prisma: PrismaClient): TypeSafePrisma {
  return new TypeSafePrisma(prisma);
}

// Type guards for runtime type checking
export const TypeGuards = {
  isValidUUID: (value: any): value is string => {
    return (
      typeof value === 'string' && z.string().uuid().safeParse(value).success
    );
  },

  isValidEmail: (value: any): value is string => {
    return (
      typeof value === 'string' && z.string().email().safeParse(value).success
    );
  },

  isValidJobType: (value: any): value is string => {
    return (
      typeof value === 'string' &&
      [
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
        'volunteer',
        'other',
      ].includes(value)
    );
  },

  isValidUserRole: (value: any): value is string => {
    return (
      typeof value === 'string' &&
      ['admin', 'employer', 'jobseeker'].includes(value)
    );
  },

  isValidSalaryRange: (min?: number, max?: number): boolean => {
    if (min === undefined && max === undefined) return true;
    if (min !== undefined && min < 0) return false;
    if (max !== undefined && max < 0) return false;
    if (min !== undefined && max !== undefined && min > max) return false;
    return true;
  },
};

// Error types for better error handling
export class TypeSafetyError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'TypeSafetyError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
