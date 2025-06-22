import { z } from 'zod';
import { JobType, UserRole } from '@prisma/client';
import { validationPatterns } from './form-utils';

// Common validation patterns
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = validationPatterns.email;
export const urlSchema = z.union([
  validationPatterns.url,
  z.literal(''), // Allow empty string for optional URLs
]).optional();
export const phoneSchema = validationPatterns.phone.optional();

// Job-related schemas
export const jobTypeSchema = z.nativeEnum(JobType, {
  errorMap: () => ({ message: 'Invalid job type' }),
});

export const createJobSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description too long'),
    company: z
      .string()
      .min(1, 'Company is required')
      .max(100, 'Company name too long'),
    location: z
      .string()
      .min(1, 'Location is required')
      .max(100, 'Location too long'),
    type: jobTypeSchema,
    salaryMin: z
      .union([
        z.number().int().min(0, 'Salary must be positive'),
        z
          .string()
          .transform(val => (val === '' ? undefined : parseInt(val, 10)))
          .optional(),
      ])
      .optional(),
    salaryMax: z
      .union([
        z.number().int().min(0, 'Salary must be positive'),
        z
          .string()
          .transform(val => (val === '' ? undefined : parseInt(val, 10)))
          .optional(),
      ])
      .optional(),
    categories: z
      .array(z.string().max(50, 'Category name too long'))
      .max(10, 'Too many categories')
      .optional(),
    requirements: z.string().max(2000, 'Requirements too long').optional(),
    benefits: z.string().max(1000, 'Benefits too long').optional(),
    isRemote: z.boolean().optional(),
    contactEmail: z
      .string()
      .email('Please enter a valid email address')
      .optional(),
    source: z.string().max(100, 'Source too long').optional(),
    url: urlSchema,
    postedAt: z.string().datetime('Invalid date format').optional(),
  })
  .refine(
    data => {
      const minSalary =
        typeof data.salaryMin === 'number'
          ? data.salaryMin
          : typeof data.salaryMin === 'string' && data.salaryMin
            ? parseInt(data.salaryMin)
            : 0;
      const maxSalary =
        typeof data.salaryMax === 'number'
          ? data.salaryMax
          : typeof data.salaryMax === 'string' && data.salaryMax
            ? parseInt(data.salaryMax)
            : 0;

      if (minSalary && maxSalary && minSalary > maxSalary) {
        return false;
      }
      return true;
    },
    {
      message: 'Minimum salary cannot be greater than maximum salary',
      path: ['salaryMin'],
    }
  );

export const updateJobSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title too long')
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description too long')
      .optional(),
    company: z
      .string()
      .min(1, 'Company is required')
      .max(100, 'Company name too long')
      .optional(),
    location: z
      .string()
      .min(1, 'Location is required')
      .max(100, 'Location too long')
      .optional(),
    type: jobTypeSchema.optional(),
    salaryMin: z.number().int().min(0, 'Salary must be positive').optional(),
    salaryMax: z.number().int().min(0, 'Salary must be positive').optional(),
    categories: z
      .array(z.string().max(50, 'Category name too long'))
      .max(10, 'Too many categories')
      .optional(),
    source: z.string().max(100, 'Source too long').optional(),
    url: urlSchema,
    postedAt: z.string().datetime('Invalid date format').optional(),
  })
  .refine(
    data => {
      if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
        return false;
      }
      return true;
    },
    {
      message: 'Minimum salary cannot be greater than maximum salary',
      path: ['salaryMin'],
    }
  );

export const jobSearchSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page too high')
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit too high')
    .optional(),
  type: jobTypeSchema.optional(),
  location: z.string().max(100, 'Location too long').optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  sortBy: z
    .enum(['postedAt', 'createdAt', 'salaryMin', 'salaryMax'], {
      errorMap: () => ({ message: 'Invalid sort field' }),
    })
    .optional(),
  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Invalid sort order' }),
    })
    .optional(),
});

// User-related schemas
export const userRoleSchema = z.nativeEnum(UserRole, {
  errorMap: () => ({ message: 'Invalid user role' }),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  resumeUrl: urlSchema,
  profilePictureUrl: urlSchema,
  location: z.string().max(100, 'Location too long').optional(),
  phoneNumber: phoneSchema,
  linkedinUrl: validationPatterns.linkedinUrl,
  currentJobTitle: z.string().max(100, 'Job title too long').optional(),
  preferredJobTypes: z
    .array(jobTypeSchema)
    .max(5, 'Too many preferred job types')
    .optional(),
  skills: z
    .array(
      z.string().min(1, 'Skill cannot be empty').max(50, 'Skill name too long')
    )
    .max(20, 'Too many skills')
    .optional(),
  workAuthorization: z
    .string()
    .max(100, 'Work authorization too long')
    .optional(),
  educationExperience: z
    .string()
    .max(2000, 'Education experience too long')
    .optional(),
  isProfilePublic: z.boolean().optional(),
  companyWebsite: urlSchema,
});

export const userApplicationsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page too high')
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit too high')
    .optional(),
  status: z.string().max(20, 'Status too long').optional(),
});

// Job application schemas
export const createJobApplicationSchema = z.object({
  coverLetter: z.string().max(2000, 'Cover letter too long').optional(),
  resumeUrl: urlSchema,
});

// Registration schemas
export const registerSchema = z
  .object({
    email: emailSchema,
    password: validationPatterns.strongPassword,
    role: userRoleSchema.optional(),
    companyName: z
      .string()
      .min(1, 'Company name is required')
      .max(100, 'Company name too long')
      .optional(),
    companyWebsite: urlSchema,
    resumeUrl: urlSchema,
    skills: z
      .array(
        z
          .string()
          .min(1, 'Skill cannot be empty')
          .max(50, 'Skill name too long')
      )
      .max(20, 'Too many skills')
      .optional(),
  })
  .refine(
    data => {
      if (data.role === UserRole.employer) {
        return data.companyName && data.companyWebsite;
      }
      return true;
    },
    {
      message: 'Company name and website are required for employers',
      path: ['companyName'],
    }
  );

// Semantic search schema
export const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit too high')
    .optional(),
});

// Alert schemas (for future implementation)
export const createAlertSchema = z.object({
  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(100, 'Job title too long'),
  location: z.string().max(100, 'Location too long').optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Invalid frequency' }),
  }),
});

export const updateAlertSchema = createAlertSchema.partial();
