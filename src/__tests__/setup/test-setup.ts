/**
 * Test Setup Configuration
 * Additional test utilities and setup for 209 Works
 */

import { expect } from '@jest/globals';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Global test configuration
export const testConfig = {
  timeout: 30000,
  retries: 2,
  verbose: true,
};

// Test database configuration
export const testDbConfig = {
  url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_209jobs',
  reset: true,
  seed: false,
};

// Mock API responses
export const mockApiResponses = {
  jobs: {
    success: true,
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  },
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'jobseeker',
    profile: {
      firstName: 'Test',
      lastName: 'User',
    },
  },
  error: {
    success: false,
    error: 'Test error message',
    code: 'TEST_ERROR',
  },
};

// Performance testing helpers
export const performanceHelpers = {
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    return end - start;
  },
  
  expectFastRender: (renderTime: number, threshold = 100) => {
    expect(renderTime).toBeLessThan(threshold);
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  checkAccessibility: async (container: Element) => {
    const { axe } = await import('jest-axe');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  },
  
  checkKeyboardNavigation: (element: Element) => {
    // Test keyboard navigation
    element.focus();
    expect(document.activeElement).toBe(element);
  },
};

// Test cleanup utilities
export const cleanup = {
  clearAllMocks: () => {
    jest.clearAllMocks();
  },
  
  resetModules: () => {
    jest.resetModules();
  },
  
  restoreAllMocks: () => {
    jest.restoreAllMocks();
  },
};

// Export all utilities
export * from './custom-matchers';
export * from './mock-factories';
