// Mock data factories for testing

export interface MockJob {
  id: number;
  title: string;
  company: string;
  type: string;
  location: string;
  postedAt: string;
  description: string;
  url: string;
  salaryMin?: number;
  salaryMax?: number;
  categories: string[];
  remote?: boolean;
  featured?: boolean;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'EMPLOYER';
  profilePictureUrl?: string;
  resumeUrl?: string;
  companyName?: string;
  companyWebsite?: string;
}

export interface MockJobAlert {
  id: string;
  userId: string;
  title: string;
  keywords: string[];
  location?: string;
  jobType?: string;
  salaryMin?: number;
  frequency: 'DAILY' | 'WEEKLY';
  isActive: boolean;
  createdAt: string;
}

// Job mock factory
export const createMockJob = (overrides: Partial<MockJob> = {}): MockJob => ({
  id: 1,
  title: 'Software Engineer',
  company: 'Tech Corp',
  type: 'Full-time',
  location: 'San Francisco, CA',
  postedAt: '2024-01-15',
  description:
    'We are looking for a talented Software Engineer to join our team.',
  url: 'https://example.com/apply/1',
  salaryMin: 80000,
  salaryMax: 120000,
  categories: ['Technology', 'Engineering'],
  remote: false,
  featured: false,
  ...overrides,
});

// User mock factory
export const createMockUser = (
  overrides: Partial<MockUser> = {}
): MockUser => ({
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'USER',
  ...overrides,
});

// Job alert mock factory
export const createMockJobAlert = (
  overrides: Partial<MockJobAlert> = {}
): MockJobAlert => ({
  id: '1',
  userId: '1',
  title: 'Software Engineer Alert',
  keywords: ['software', 'engineer'],
  location: 'San Francisco, CA',
  jobType: 'Full-time',
  salaryMin: 80000,
  frequency: 'WEEKLY',
  isActive: true,
  createdAt: '2024-01-15T00:00:00Z',
  ...overrides,
});

// Create multiple mock jobs
export const createMockJobs = (
  count: number,
  overrides: Partial<MockJob> = {}
): MockJob[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockJob({
      id: index + 1,
      title: `Job ${index + 1}`,
      company: `Company ${index + 1}`,
      ...overrides,
    })
  );
};

// Create multiple mock users
export const createMockUsers = (
  count: number,
  overrides: Partial<MockUser> = {}
): MockUser[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `${index + 1}`,
      email: `user${index + 1}@example.com`,
      name: `User ${index + 1}`,
      ...overrides,
    })
  );
};

// API response mocks
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  ...(success ? {} : { error: 'Something went wrong' }),
});

export const mockPaginatedResponse = <T>(
  data: T[],
  page = 1,
  limit = 10,
  total?: number
) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total: total ?? data.length,
    totalPages: Math.ceil((total ?? data.length) / limit),
    hasNext: page * limit < (total ?? data.length),
    hasPrev: page > 1,
  },
});

// Form data mocks
export const mockFormData = {
  jobSearch: {
    query: 'software engineer',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    salaryMin: 80000,
    salaryMax: 120000,
  },
  userRegistration: {
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    name: 'New User',
    role: 'USER' as const,
  },
  jobAlert: {
    title: 'My Job Alert',
    keywords: ['react', 'typescript'],
    location: 'Remote',
    jobType: 'Full-time',
    frequency: 'WEEKLY' as const,
  },
};
