# Authentication Testing Guide

## Overview

This guide provides comprehensive testing procedures for the 209jobs authentication system. It covers manual testing, automated testing, security testing, and performance testing.

## Manual Testing Procedures

### 1. User Registration Testing

#### Test Case 1.1: Valid Registration (Jobseeker)
**Steps:**
1. Navigate to `/signup/jobseeker`
2. Fill in valid email and password (8+ characters)
3. Submit form
4. Check email for verification link
5. Click verification link
6. Verify account is activated

**Expected Result:** User successfully registered and email verified

#### Test Case 1.2: Valid Registration (Employer)
**Steps:**
1. Navigate to `/signup/employer`
2. Fill in valid email, password, company name, and website
3. Submit form
4. Check email for verification link
5. Click verification link
6. Verify account is activated

**Expected Result:** Employer account successfully created

#### Test Case 1.3: Invalid Registration Scenarios
**Test Data:**
- Weak password (< 8 characters)
- Invalid email format
- Duplicate email address
- Missing required fields for employer

**Expected Results:** Appropriate validation errors displayed

### 2. Login Testing

#### Test Case 2.1: Valid Login (Regular User)
**Steps:**
1. Navigate to `/signin`
2. Enter valid email and password
3. Submit form
4. Verify redirect to dashboard/home

**Expected Result:** Successful login and redirect

#### Test Case 2.2: Valid Login (Admin with 2FA)
**Steps:**
1. Navigate to `/signin`
2. Enter admin email and password
3. Submit form
4. Enter 2FA code when prompted
5. Submit 2FA code

**Expected Result:** Successful login after 2FA verification

#### Test Case 2.3: Invalid Login Scenarios
**Test Data:**
- Wrong password
- Non-existent email
- Unverified email
- Invalid 2FA code (for admin)

**Expected Results:** Appropriate error messages

### 3. Password Reset Testing

#### Test Case 3.1: Valid Password Reset
**Steps:**
1. Navigate to `/password-reset-request`
2. Enter valid email address
3. Check email for reset link
4. Click reset link
5. Enter new password
6. Submit form
7. Try logging in with new password

**Expected Result:** Password successfully reset

#### Test Case 3.2: Invalid Password Reset Scenarios
**Test Data:**
- Non-existent email
- Expired reset token
- Weak new password

**Expected Results:** Appropriate error handling

### 4. Two-Factor Authentication Testing

#### Test Case 4.1: 2FA Setup (Admin Only)
**Prerequisites:** Logged in as admin user

**Steps:**
1. Navigate to 2FA setup endpoint
2. Scan QR code with authenticator app
3. Enter TOTP code from app
4. Verify 2FA is enabled

**Expected Result:** 2FA successfully enabled

#### Test Case 4.2: 2FA Login
**Prerequisites:** Admin user with 2FA enabled

**Steps:**
1. Login with email/password
2. Enter 2FA code when prompted
3. Verify successful login

**Expected Result:** Login successful after 2FA

#### Test Case 4.3: 2FA Disable
**Prerequisites:** Admin user with 2FA enabled

**Steps:**
1. Navigate to 2FA disable endpoint
2. Enter current 2FA code
3. Verify 2FA is disabled

**Expected Result:** 2FA successfully disabled

### 5. OAuth Testing

#### Test Case 5.1: Google OAuth Login
**Steps:**
1. Navigate to `/signin`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify account creation/login

**Expected Result:** Successful OAuth authentication

## Automated Testing

### Unit Tests

#### Password Hashing Tests
```javascript
// src/__tests__/auth/password.test.js
import { hash, compare } from 'bcryptjs';

describe('Password Hashing', () => {
  test('should hash password correctly', async () => {
    const password = 'testpassword123';
    const hashedPassword = await hash(password, 12);
    
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(50);
  });

  test('should verify password correctly', async () => {
    const password = 'testpassword123';
    const hashedPassword = await hash(password, 12);
    
    const isValid = await compare(password, hashedPassword);
    expect(isValid).toBe(true);
    
    const isInvalid = await compare('wrongpassword', hashedPassword);
    expect(isInvalid).toBe(false);
  });
});
```

#### Token Generation Tests
```javascript
// src/__tests__/auth/tokens.test.js
import { randomBytes } from 'crypto';

describe('Token Generation', () => {
  test('should generate secure random tokens', () => {
    const token1 = randomBytes(32).toString('hex');
    const token2 = randomBytes(32).toString('hex');
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(token1)).toBe(true);
  });
});
```

#### 2FA Tests
```javascript
// src/__tests__/auth/2fa.test.js
import speakeasy from 'speakeasy';

describe('Two-Factor Authentication', () => {
  test('should generate valid TOTP secret', () => {
    const secret = speakeasy.generateSecret({
      name: 'Test App',
      issuer: 'Test',
      length: 32
    });
    
    expect(secret.base32).toBeDefined();
    expect(secret.otpauth_url).toBeDefined();
  });

  test('should verify TOTP code correctly', () => {
    const secret = speakeasy.generateSecret({ length: 32 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });
    
    const verified = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    expect(verified).toBe(true);
  });
});
```

### Integration Tests

#### Registration API Tests
```javascript
// src/__tests__/api/auth/register.test.js
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

describe('/api/auth/register', () => {
  test('should register valid user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        role: 'jobseeker'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  test('should reject duplicate email', async () => {
    // First registration
    const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'testpassword123',
        role: 'jobseeker'
      })
    });

    await POST(request1);

    // Duplicate registration
    const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'testpassword123',
        role: 'jobseeker'
      })
    });

    const response = await POST(request2);
    expect(response.status).toBe(409);
  });
});
```

#### Login API Tests
```javascript
// src/__tests__/api/auth/login.test.js
import { signIn } from 'next-auth/react';

describe('Login Flow', () => {
  test('should login with valid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'testpassword123',
      redirect: false
    });

    expect(result?.error).toBeNull();
    expect(result?.ok).toBe(true);
  });

  test('should reject invalid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'wrongpassword',
      redirect: false
    });

    expect(result?.error).toBeDefined();
    expect(result?.ok).toBe(false);
  });
});
```

## Security Testing

### 1. SQL Injection Testing

#### Test Case: Registration SQL Injection
**Test Data:**
```json
{
  "email": "test'; DROP TABLE users; --",
  "password": "password123"
}
```

**Expected Result:** Input sanitized, no SQL injection

#### Test Case: Login SQL Injection
**Test Data:**
```json
{
  "email": "admin' OR '1'='1",
  "password": "anything"
}
```

**Expected Result:** Login fails, no unauthorized access

### 2. XSS Testing

#### Test Case: Registration XSS
**Test Data:**
```json
{
  "email": "<script>alert('xss')</script>@test.com",
  "password": "password123"
}
```

**Expected Result:** Script tags escaped/sanitized

### 3. CSRF Testing

#### Test Case: Cross-Site Request Forgery
**Steps:**
1. Create malicious form on external site
2. Attempt to submit to registration endpoint
3. Verify CSRF protection blocks request

**Expected Result:** Request blocked by CSRF protection

### 4. Rate Limiting Testing

#### Test Case: Registration Rate Limiting
**Steps:**
1. Send multiple registration requests rapidly
2. Verify rate limiting kicks in
3. Check appropriate error response

**Expected Result:** Rate limiting prevents abuse

#### Test Case: Login Brute Force Protection
**Steps:**
1. Send multiple failed login attempts
2. Verify rate limiting/account lockout
3. Check security logging

**Expected Result:** Brute force attacks prevented

### 5. Session Security Testing

#### Test Case: Session Hijacking Prevention
**Steps:**
1. Login and capture session token
2. Try using token from different IP/browser
3. Verify session security measures

**Expected Result:** Session properly secured

#### Test Case: Session Timeout
**Steps:**
1. Login and wait for session timeout
2. Try accessing protected resource
3. Verify session expired

**Expected Result:** Session properly expires

## Performance Testing

### 1. Load Testing

#### Registration Load Test
```javascript
// Load test script using Artillery or similar
const config = {
  target: 'http://localhost:3000',
  phases: [
    { duration: 60, arrivalRate: 10 }, // 10 users per second for 1 minute
    { duration: 120, arrivalRate: 20 }, // 20 users per second for 2 minutes
  ],
  scenarios: [
    {
      name: 'Register users',
      weight: 100,
      flow: [
        {
          post: {
            url: '/api/auth/register',
            json: {
              email: '{{ $randomEmail }}',
              password: 'testpassword123',
              role: 'jobseeker'
            }
          }
        }
      ]
    }
  ]
};
```

#### Login Load Test
```javascript
const loginConfig = {
  target: 'http://localhost:3000',
  phases: [
    { duration: 60, arrivalRate: 50 }, // 50 logins per second
  ],
  scenarios: [
    {
      name: 'User login',
      weight: 100,
      flow: [
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: 'test@example.com',
              password: 'testpassword123'
            }
          }
        }
      ]
    }
  ]
};
```

### 2. Database Performance

#### Test Case: Concurrent User Creation
**Metrics to Monitor:**
- Database connection pool usage
- Query execution time
- Memory usage
- CPU utilization

#### Test Case: Session Lookup Performance
**Metrics to Monitor:**
- Session retrieval time
- Database query optimization
- Cache hit rates

## Test Environment Setup

### 1. Test Database Setup

```bash
# Create test database
createdb 209jobs_test

# Set test environment variables
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/209jobs_test"
export NEXTAUTH_SECRET="test-secret-for-testing-only"
export EMAIL_SERVER_HOST="smtp.ethereal.email"
export EMAIL_SERVER_USER="test@ethereal.email"
export EMAIL_SERVER_PASS="test-password"
```

### 2. Test Data Setup

```javascript
// src/__tests__/setup/testData.js
export const testUsers = {
  jobseeker: {
    email: 'jobseeker@test.com',
    password: 'testpassword123',
    role: 'jobseeker'
  },
  employer: {
    email: 'employer@test.com',
    password: 'testpassword123',
    role: 'employer',
    companyName: 'Test Company',
    companyWebsite: 'https://testcompany.com'
  },
  admin: {
    email: 'admin@test.com',
    password: 'testpassword123',
    role: 'admin'
  }
};

export async function createTestUsers() {
  // Create test users in database
  for (const user of Object.values(testUsers)) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash: await hash(user.password, 12),
        isEmailVerified: true
      }
    });
  }
}

export async function cleanupTestData() {
  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@test.com'
      }
    }
  });
}
```

### 3. Mock Services

```javascript
// src/__tests__/mocks/emailService.js
export const mockEmailService = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  verify: jest.fn().mockResolvedValue(true)
};

// src/__tests__/mocks/redisService.js
export const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
};
```

## Test Automation

### 1. CI/CD Pipeline Tests

```yaml
# .github/workflows/auth-tests.yml
name: Authentication Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: 209jobs_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/209jobs_test
      
      - name: Run authentication tests
        run: npm run test:auth
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/209jobs_test
          NEXTAUTH_SECRET: test-secret
          EMAIL_SERVER_HOST: smtp.ethereal.email
      
      - name: Run security tests
        run: npm run test:security
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

### 2. Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:auth": "jest --testPathPattern=auth",
    "test:security": "jest --testPathPattern=security",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:load": "artillery run load-tests/auth-load-test.yml",
    "test:coverage": "jest --coverage"
  }
}
```

## Monitoring & Alerting

### 1. Test Metrics

**Key Metrics to Track:**
- Test pass/fail rates
- Test execution time
- Code coverage percentage
- Security test results
- Performance benchmarks

### 2. Automated Alerts

**Alert Conditions:**
- Test failures in CI/CD
- Security test failures
- Performance degradation
- Coverage drops below threshold

### 3. Test Reporting

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.js']
};
```

## Troubleshooting Test Issues

### Common Test Failures

1. **Database Connection Issues**
   - Check test database is running
   - Verify connection string
   - Ensure proper cleanup between tests

2. **Email Service Failures**
   - Use mock email service for tests
   - Check Ethereal Email credentials
   - Verify network connectivity

3. **Rate Limiting in Tests**
   - Use separate rate limit config for tests
   - Reset rate limits between tests
   - Use different test user accounts

4. **Session/Cookie Issues**
   - Clear cookies between tests
   - Use proper test environment setup
   - Check NextAuth configuration

### Debug Mode

```bash
# Enable debug logging for tests
DEBUG="next-auth:*" npm run test
LOG_LEVEL="debug" npm run test

# Run specific test with verbose output
npm run test -- --verbose auth/login.test.js
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Test Data Management
- Use factories for test data creation
- Clean up test data after each test
- Use separate test database
- Avoid hardcoded test data

### 3. Security Testing
- Test all authentication endpoints
- Verify input validation
- Check authorization controls
- Test rate limiting effectiveness

### 4. Performance Testing
- Establish baseline metrics
- Test under realistic load
- Monitor resource usage
- Set performance thresholds

This comprehensive testing guide ensures the authentication system is thoroughly tested for functionality, security, and performance. 