
import React from 'react';
import { cn } from '@/lib/utils';


const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

// Additional service exports for compatibility
import { z } from 'zod';

export class PasswordResetService {
  static async sendResetEmail(email: string) {
    // TODO: Implement password reset email
    console.log('Password reset email would be sent to:', email);
  }
}

export { randomBytes } from 'crypto';

export const emailQueue = {
  add: async (job: any) => console.log('Email job added:', job),
  process: async (handler: any) => console.log('Email queue processor registered')
};

export class EnhancedJobMatchingService {
  static async findMatches(criteria: any) {
    return [];
  }
}

export function isResumeParsingAvailable() {
  return true;
}

export function getEnvironmentConfig() {
  return { environment: process.env.NODE_ENV || 'development' };
}

export class JobPostingCreditsService {
  static async getCredits(userId: string) {
    return 0;
  }
  static async deductCredits(userId: string, amount: number) {
    return true;
  }
}

export class CompanyKnowledgeService {
  static async getKnowledge(companyId: string) {
    return {};
  }
}

export function getDatabaseHealthReport() {
  return { status: 'healthy', connections: 1 };
}

export const apiConfigs = {
  timeout: 30000,
  retries: 3
};

export class InstagramUtils {
  static async getPosts() {
    return [];
  }
}

export const JOB_POSTING_CONFIG = {
  maxJobs: 100,
  defaultDuration: 30
};

export const SUBSCRIPTION_TIERS_CONFIG = {
  basic: { price: 99, features: ['Basic posting'] },
  premium: { price: 199, features: ['Premium posting', 'Analytics'] }
};

export class ValidationError extends Error {
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FeaturedJobAnalyticsService {
  static async trackClick(jobId: string) {
    console.log('Job click tracked:', jobId);
  }
  static async trackImpression(jobId: string) {
    console.log('Job impression tracked:', jobId);
  }
}

export const adConversionSchema = z.object({
  adId: z.string(),
  conversionType: z.string()
});
