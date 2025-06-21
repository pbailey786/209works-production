/**
 * Integration Test Setup
 * Setup for integration tests with database and external services
 */

import { testDb } from '../utils/test-helpers';

// Setup before all integration tests
beforeAll(async () => {
  // Initialize test database
  await testDb.reset();
  
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_209jobs';
});

// Cleanup after all integration tests
afterAll(async () => {
  // Clean up test database
  await testDb.cleanup();
});

// Reset between each test
beforeEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test configuration for integration tests
export const integrationTestConfig = {
  timeout: 60000, // Longer timeout for integration tests
  retries: 1,
  verbose: true,
};
