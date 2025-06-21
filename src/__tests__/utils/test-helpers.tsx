/**
 * Comprehensive Test Utilities and Helpers
 * Provides common testing utilities, mocks, and helper functions
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DomainProvider } from '@/lib/domain/context';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import path from "path";

// Mock Prisma client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  hostname?: string;
}

export function TestWrapper({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
  hostname = '209.works'
}: TestWrapperProps) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <DomainProvider initialHostname={hostname}>
          {children}
        </DomainProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
    hostname?: string;
  }
) {
  const { queryClient, hostname, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient} hostname={hostname}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
}

// Mock factories for common data types
export const mockFactories = {
  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    clerkId: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['job_seeker', 'employer', 'admin']),
    profilePictureUrl: faker.image.avatar(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  job: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    description: faker.lorem.paragraphs(3),
    location: faker.helpers.arrayElement(['Stockton, CA', 'Modesto, CA', 'Tracy, CA', 'Manteca, CA']),
    salaryMin: faker.number.int({ min: 40000, max: 80000 }),
    salaryMax: faker.number.int({ min: 80000, max: 150000 }),
    jobType: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract', 'Temporary']),
    experienceLevel: faker.helpers.arrayElement(['Entry Level', 'Mid Level', 'Senior Level']),
    skills: faker.helpers.arrayElements([
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS',
      'Customer Service', 'Sales', 'Marketing', 'Management'
    ], { min: 2, max: 6 }),
    benefits: faker.helpers.arrayElements([
      'Health Insurance', '401k', 'Paid Time Off', 'Remote Work',
      'Dental Insurance', 'Vision Insurance', 'Life Insurance'
    ], { min: 1, max: 4 }),
    status: 'ACTIVE',
    isRemote: faker.datatype.boolean(),
    isFeatured: faker.datatype.boolean(),
    isUrgent: faker.datatype.boolean(),
    applicationDeadline: faker.date.future(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  jobApplication: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    jobId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'reviewed', 'interviewed', 'hired', 'rejected']),
    coverLetter: faker.lorem.paragraphs(2),
    resumeUrl: faker.internet.url(),
    appliedAt: faker.date.past(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  jobSeekerProfile: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    currentJobTitle: faker.person.jobTitle(),
    experience: faker.number.int({ min: 0, max: 20 }),
    skills: faker.helpers.arrayElements([
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS'
    ], { min: 3, max: 8 }),
    education: faker.helpers.arrayElement(['High School', 'Associate', 'Bachelor', 'Master', 'PhD']),
    location: faker.helpers.arrayElement(['Stockton, CA', 'Modesto, CA', 'Tracy, CA']),
    bio: faker.lorem.paragraph(),
    resumeUrl: faker.internet.url(),
    portfolioUrl: faker.internet.url(),
    linkedinUrl: faker.internet.url(),
    githubUrl: faker.internet.url(),
    desiredSalaryMin: faker.number.int({ min: 40000, max: 80000 }),
    desiredSalaryMax: faker.number.int({ min: 80000, max: 150000 }),
    isOpenToWork: faker.datatype.boolean(),
    isOpenToRemote: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  companyReview: (overrides = {}) => ({
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    userId: faker.string.uuid(),
    rating: faker.number.int({ min: 1, max: 5 }),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    pros: faker.helpers.arrayElements([
      'Great work-life balance', 'Good benefits', 'Supportive management',
      'Growth opportunities', 'Flexible schedule', 'Good pay'
    ], { min: 2, max: 4 }),
    cons: faker.helpers.arrayElements([
      'Limited growth', 'Poor management', 'Low pay',
      'Long hours', 'No benefits', 'Toxic culture'
    ], { min: 1, max: 3 }),
    workLifeBalance: faker.number.int({ min: 1, max: 5 }),
    compensation: faker.number.int({ min: 1, max: 5 }),
    culture: faker.number.int({ min: 1, max: 5 }),
    management: faker.number.int({ min: 1, max: 5 }),
    careerGrowth: faker.number.int({ min: 1, max: 5 }),
    jobTitle: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(['Engineering', 'Sales', 'Marketing', 'HR', 'Operations']),
    employmentType: faker.helpers.arrayElement(['current', 'former']),
    employmentDuration: faker.helpers.arrayElement(['< 1 year', '1-2 years', '2-5 years', '5+ years']),
    location: faker.helpers.arrayElement(['Stockton, CA', 'Modesto, CA', 'Tracy, CA']),
    wouldRecommend: faker.datatype.boolean(),
    isAnonymous: faker.datatype.boolean(),
    isVerified: faker.datatype.boolean(),
    moderationStatus: 'approved',
    helpfulVotes: faker.number.int({ min: 0, max: 50 }),
    reportCount: faker.number.int({ min: 0, max: 5 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  forumPost: (overrides = {}) => ({
    id: faker.string.uuid(),
    categoryId: faker.string.uuid(),
    authorId: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    type: faker.helpers.arrayElement(['discussion', 'question', 'job_share', 'advice', 'announcement']),
    tags: faker.helpers.arrayElements([
      'career-advice', 'job-search', 'networking', 'interview-tips',
      'salary-negotiation', 'remote-work', 'tech-jobs'
    ], { min: 1, max: 4 }),
    isPinned: faker.datatype.boolean(),
    isLocked: faker.datatype.boolean(),
    upvotes: faker.number.int({ min: 0, max: 100 }),
    downvotes: faker.number.int({ min: 0, max: 20 }),
    commentCount: faker.number.int({ min: 0, max: 50 }),
    viewCount: faker.number.int({ min: 0, max: 500 }),
    lastActivityAt: faker.date.recent(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  chatSession: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.sentence(),
    messages: Array.from({ length: faker.number.int({ min: 2, max: 10 }) }, () => ({
      id: faker.string.uuid(),
      role: faker.helpers.arrayElement(['user', 'assistant']),
      content: faker.lorem.paragraph(),
      timestamp: faker.date.recent(),
    })),
    isActive: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),
};

// API response mocks
export const mockApiResponses = {
  success: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  error: (message: string, code = 400) => ({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  }),

  paginated: (items: any[], page = 1, limit = 10) => ({
    success: true,
    data: items.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      totalCount: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: page * limit < items.length,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  }),
};

// Test database utilities
export const testDb = {
  async seed() {
    // Seed test database with mock data
    const users = Array.from({ length: 10 }, () => mockFactories.user());
    const jobs = Array.from({ length: 20 }, () => mockFactories.job());
    
    // Mock Prisma operations
    prismaMock.user.findMany.mockResolvedValue(users);
    prismaMock.job.findMany.mockResolvedValue(jobs);
  },

  async cleanup() {
    // Clean up test database
    jest.clearAllMocks();
  },

  async reset() {
    await this.cleanup();
    await this.seed();
  },
};

// Mock external services
export const mockServices = {
  openai: {
    chat: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: 'Mocked AI response',
        },
      }],
    }),
  },

  clerk: {
    users: {
      getUser: jest.fn().mockResolvedValue(mockFactories.user()),
      getUserList: jest.fn().mockResolvedValue([mockFactories.user()]),
    },
  },

  stripe: {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
  },

  resend: {
    emails: {
      send: jest.fn().mockResolvedValue({
        id: 'email_123',
        to: 'test@example.com',
      }),
    },
  },
};

// Performance testing utilities
export const performanceHelpers = {
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    return end - start;
  },

  measureAsyncOperation: async (operation: () => Promise<any>) => {
    const start = performance.now();
    await operation();
    const end = performance.now();
    return end - start;
  },

  expectPerformance: (actualTime: number, expectedMaxTime: number) => {
    expect(actualTime).toBeLessThan(expectedMaxTime);
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },

  expectKeyboardNavigation: async (element: HTMLElement) => {
    element.focus();
    expect(element).toHaveFocus();
  },

  expectScreenReaderText: (element: HTMLElement, expectedText: string) => {
    expect(element).toHaveTextContent(expectedText);
  },
};

// Custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidUrl(): R;
      toHaveValidJobData(): R;
    }
  }
}

// Setup custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
      pass,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass,
    };
  },

  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },

  toHaveValidJobData(received: any) {
    const requiredFields = ['id', 'title', 'company', 'description', 'location'];
    const missingFields = requiredFields.filter(field => !received[field]);
    const pass = missingFields.length === 0;
    
    return {
      message: () => `expected job to have all required fields${pass ? '' : `, missing: ${missingFields.path.join(', ')}`}`,
      pass,
    };
  },
});

// Export all utilities
export * from '@testing-library/react';
export { renderWithProviders as render };
export { testDb, mockServices, performanceHelpers, a11yHelpers };
