/**
 * Comprehensive Jest Configuration for 209 Works
 * Enhanced testing configuration with coverage, performance, and quality gates
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/setup/test-setup.ts',
  ],

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/__tests__/(.*)$': '<rootDir>/src/__tests__/$1',

    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__tests__/mocks/file-mock.js',
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/**/*.{js,jsx,ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/setup/',
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/page.tsx', // Exclude page components (tested via E2E)
    '!src/lib/database/migrations/**',
    '!src/lib/database/seeds/**',
    '!src/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical modules
    './src/lib/ai/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/lib/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/database/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './src/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json', 'clover'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test timeout
  testTimeout: 30000,

  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: '209 Works Test Report',
      },
    ],
    [
      '@jest/reporters',
      {
        silent: false,
        verbose: true,
      },
    ],
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance monitoring
  maxWorkers: '50%',

  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Verbose output for CI
  verbose: process.env.CI === 'true',

  // Silent mode for local development
  silent: process.env.NODE_ENV === 'development' && process.env.CI !== 'true',

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/__tests__/integration/',
        '<rootDir>/src/__tests__/e2e/',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/src/__tests__/setup/integration-setup.ts',
      ],
    },
  ],

  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__tests__/setup/custom-matchers.ts',
  ],
};

// Environment-specific configurations
if (process.env.NODE_ENV === 'test') {
  customJestConfig.setupFiles = ['<rootDir>/src/__tests__/setup/env-setup.ts'];
}

// CI-specific configurations
if (process.env.CI === 'true') {
  customJestConfig.maxWorkers = 2;
  customJestConfig.cache = false;
  customJestConfig.verbose = true;
  customJestConfig.collectCoverage = true;

  // Add performance monitoring in CI
  customJestConfig.reporters.push([
    'jest-performance-testing',
    {
      outputFile: '<rootDir>/test-results/performance.json',
      threshold: {
        renderTime: 100, // ms
        asyncOperationTime: 1000, // ms
      },
    },
  ]);
}

// Development-specific configurations
if (process.env.NODE_ENV === 'development') {
  customJestConfig.watchAll = false;
  customJestConfig.watch = true;
  customJestConfig.collectCoverage = false;
  customJestConfig.verbose = false;

  // Faster feedback in development
  customJestConfig.bail = 1;
  customJestConfig.maxWorkers = 1;
}

// Export the configuration
module.exports = createJestConfig(customJestConfig);

// Additional configuration for specific test types
module.exports.projects = [
  // Unit tests
  {
    ...customJestConfig,
    displayName: 'unit',
    testMatch: [
      '<rootDir>/src/components/**/*.test.{js,jsx,ts,tsx}',
      '<rootDir>/src/lib/**/*.test.{js,jsx,ts,tsx}',
      '<rootDir>/src/hooks/**/*.test.{js,jsx,ts,tsx}',
      '<rootDir>/src/utils/**/*.test.{js,jsx,ts,tsx}',
    ],
    coverageThreshold: {
      global: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },

  // Integration tests
  {
    ...customJestConfig,
    displayName: 'integration',
    testMatch: [
      '<rootDir>/src/__tests__/integration/**/*.test.{js,jsx,ts,tsx}',
    ],
    setupFilesAfterEnv: [
      '<rootDir>/jest.setup.js',
      '<rootDir>/src/__tests__/setup/integration-setup.ts',
    ],
    testTimeout: 60000,
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },

  // API tests
  {
    ...customJestConfig,
    displayName: 'api',
    testMatch: ['<rootDir>/src/__tests__/api/**/*.test.{js,jsx,ts,tsx}'],
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/api-setup.ts'],
    testTimeout: 30000,
  },

  // Performance tests
  {
    ...customJestConfig,
    displayName: 'performance',
    testMatch: [
      '<rootDir>/src/__tests__/performance/**/*.test.{js,jsx,ts,tsx}',
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/performance-setup.ts'],
    testTimeout: 120000,
    reporters: [
      'default',
      [
        'jest-performance-testing',
        {
          outputFile: '<rootDir>/test-results/performance-detailed.json',
        },
      ],
    ],
  },
];
