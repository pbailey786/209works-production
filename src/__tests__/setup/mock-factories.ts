/**
 * Mock Data Factories
 * Factory functions for generating test data
 */

import { faker } from '@faker-js/faker';

// Job mock factory
export const mockFactories = {
  job: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    description: faker.lorem.paragraphs(3),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    salaryMin: faker.number.int({ min: 30000, max: 80000 }),
    salaryMax: faker.number.int({ min: 80000, max: 150000 }),
    jobType: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract', 'Temporary']),
    experienceLevel: faker.helpers.arrayElement(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']),
    skills: faker.helpers.arrayElements(['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS'], { min: 2, max: 5 }),
    benefits: faker.helpers.arrayElements(['Health Insurance', '401k', 'Remote Work', 'Flexible Hours', 'PTO'], { min: 1, max: 4 }),
    isRemote: faker.datatype.boolean(),
    isFeatured: faker.datatype.boolean(),
    isUrgent: faker.datatype.boolean(),
    postedAt: faker.date.recent(),
    expiresAt: faker.date.future(),
    employerId: faker.string.uuid(),
    region: '209',
    status: 'active',
    ...overrides,
  }),

  user: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: faker.helpers.arrayElement(['jobseeker', 'employer', 'admin']),
    phone: faker.phone.number(),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    isVerified: faker.datatype.boolean(),
    ...overrides,
  }),

  employer: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    companyName: faker.company.name(),
    companyDescription: faker.company.catchPhrase(),
    website: faker.internet.url(),
    industry: faker.company.buzzNoun(),
    companySize: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    credits: faker.number.int({ min: 0, max: 100 }),
    isVerified: faker.datatype.boolean(),
    ...overrides,
  }),

  application: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    jobId: faker.string.uuid(),
    userId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'reviewed', 'interview', 'rejected', 'hired']),
    coverLetter: faker.lorem.paragraphs(2),
    resumeUrl: faker.internet.url(),
    appliedAt: faker.date.recent(),
    ...overrides,
  }),

  resume: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    fileName: `${faker.person.lastName()}_Resume.pdf`,
    fileUrl: faker.internet.url(),
    isDefault: faker.datatype.boolean(),
    parsedData: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      skills: faker.helpers.arrayElements(['JavaScript', 'React', 'Node.js', 'Python'], { min: 2, max: 4 }),
      experience: faker.lorem.paragraphs(2),
      education: faker.lorem.sentence(),
    },
    uploadedAt: faker.date.recent(),
    ...overrides,
  }),

  notification: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['job_alert', 'application_update', 'system', 'promotion']),
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    isRead: faker.datatype.boolean(),
    createdAt: faker.date.recent(),
    ...overrides,
  }),

  savedJob: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    jobId: faker.string.uuid(),
    savedAt: faker.date.recent(),
    ...overrides,
  }),

  jobAlert: (overrides: any = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.words(3),
    keywords: faker.helpers.arrayElements(['developer', 'engineer', 'manager'], { min: 1, max: 3 }),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    salaryMin: faker.number.int({ min: 30000, max: 80000 }),
    salaryMax: faker.number.int({ min: 80000, max: 150000 }),
    jobType: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract']),
    isActive: faker.datatype.boolean(),
    frequency: faker.helpers.arrayElement(['daily', 'weekly', 'monthly']),
    createdAt: faker.date.past(),
    ...overrides,
  }),
};

// Mock services
export const mockServices = {
  prisma: {
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  
  email: {
    send: jest.fn(),
    sendBulk: jest.fn(),
    sendTemplate: jest.fn(),
  },
  
  ai: {
    generateJobDescription: jest.fn(),
    parseResume: jest.fn(),
    getRecommendations: jest.fn(),
  },
};
