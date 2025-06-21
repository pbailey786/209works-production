/**
 * Custom Jest Matchers
 * Custom matchers for 209 Works testing
 */

import { expect } from '@jest/globals';

// Extend Jest matchers interface
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidJobData(): R;
      toBeValidEmail(): R;
      toHaveValidPhoneNumber(): R;
      toBeWithinDateRange(start: Date, end: Date): R;
      toHaveValidSalaryRange(): R;
    }
  }
}

// Custom matcher for job data validation
expect.extend({
  toHaveValidJobData(received: any) {
    const pass = 
      received &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.company === 'string' &&
      typeof received.description === 'string' &&
      typeof received.location === 'string' &&
      received.title.length > 0 &&
      received.company.length > 0 &&
      received.description.length > 0 &&
      received.location.length > 0;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid job data`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid job data`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toHaveValidPhoneNumber(received: string) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const pass = typeof received === 'string' && phoneRegex.test(received) && received.length >= 10;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false,
      };
    }
  },

  toBeWithinDateRange(received: Date, start: Date, end: Date) {
    const pass = received >= start && received <= end;

    if (pass) {
      return {
        message: () => `expected ${received} not to be within date range ${start} - ${end}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within date range ${start} - ${end}`,
        pass: false,
      };
    }
  },

  toHaveValidSalaryRange(received: any) {
    const pass = 
      received &&
      typeof received.salaryMin === 'number' &&
      typeof received.salaryMax === 'number' &&
      received.salaryMin > 0 &&
      received.salaryMax > 0 &&
      received.salaryMax >= received.salaryMin;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid salary range`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid salary range`,
        pass: false,
      };
    }
  },
});
