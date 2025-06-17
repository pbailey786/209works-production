# Authentication System Documentation

## Overview

The 209jobs authentication system is built using NextAuth.js with multiple authentication providers and comprehensive security features. This document covers the complete authentication implementation, security measures, and future considerations.

## Architecture

### Core Components

1. **NextAuth.js Configuration** (`src/app/api/auth/authOptions.ts`)
2. **Authentication Providers**:
   - Credentials (email/password)
   - Google OAuth
   - Email Magic Links
3. **Database Integration** (Prisma with PostgreSQL)
4. **Security Middleware** (Rate limiting, CORS, validation)
5. **Two-Factor Authentication** (TOTP for admin accounts)

### Authentication Flow

```mermaid
graph TD
    A[User Login Request] --> B{Authentication Method}
    B -->|Credentials| C[Email/Password Validation]
    B -->|Google OAuth| D[Google OAuth Flow]
    B -->|Magic Link| E[Email Magic Link]

    C --> F{User Exists & Valid?}
    F -->|Yes| G{Email Verified?}
    F -->|No| H[Authentication Failed]

    G -->|Yes| I{Admin User?}
    G -->|No| J[Email Verification Required]

    I -->|Yes| K{2FA Enabled?}
    I -->|No| L[Login Success]

    K -->|Yes| M[2FA Code Required]
    K -->|No| L

    M --> N{Valid 2FA Code?}
    N -->|Yes| L
    N -->|No| O[2FA Failed]

    D --> P[Google Account Verification]
    P --> Q[Account Creation/Login]

    E --> R[Magic Link Email Sent]
    R --> S[User Clicks Link]
    S --> T[Email Verification & Login]
```

## Security Features

### 1. Password Security

- **Hashing**: bcrypt with salt rounds of 12
- **Strength Requirements**: Minimum 8 characters
- **Reset Tokens**: Cryptographically secure random tokens
- **Token Expiration**: 1 hour for password reset tokens

### 2. Session Management

- **Strategy**: JWT tokens
- **Expiration**: 30 days with 1-day update interval
- **Secure Storage**: HTTP-only cookies in production
- **Session Invalidation**: Automatic on logout

### 3. Two-Factor Authentication (2FA)

- **Scope**: Admin accounts only
- **Method**: TOTP (Time-based One-Time Password)
- **Library**: Speakeasy
- **Setup**: QR code generation for authenticator apps
- **Backup**: Manual disable with current 2FA code

### 4. Rate Limiting

- **Registration**: Heavy rate limiting
- **Login**: Standard rate limiting
- **Password Reset**: Rate limited per email
- **2FA**: Rate limited per user

### 5. Email Verification

- **Required**: For all new accounts
- **Token Expiration**: 24 hours
- **Secure Tokens**: Cryptographically random
- **HTML Templates**: Professional email design

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`

Register a new user account.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "jobseeker", // or "employer"
  "companyName": "Company Name", // required for employers
  "companyWebsite": "https://company.com", // required for employers
  "resumeUrl": "https://resume.pdf", // optional for jobseekers
  "skills": ["JavaScript", "React"] // optional for jobseekers
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "User registered. Please verify your email."
  }
}
```

#### POST `/api/auth/password-reset`

Request password reset.

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

#### PATCH `/api/auth/password-reset`

Reset password with token.

**Request Body**:

```json
{
  "token": "reset-token",
  "password": "newpassword123"
}
```

#### GET `/api/auth/verify?token=verification-token`

Verify email address.

### 2FA Routes

#### POST `/api/auth/2fa/setup`

Setup 2FA for admin accounts.

**Headers**: `Authorization: Bearer <jwt-token>`

**Response**:

```json
{
  "qrCode": "data:image/png;base64,...",
  "otpauthUrl": "otpauth://totp/...",
  "message": "2FA setup initiated..."
}
```

#### POST `/api/auth/2fa/verify`

Verify and enable 2FA.

**Headers**: `Authorization: Bearer <jwt-token>`

**Request Body**:

```json
{
  "code": "123456"
}
```

#### POST `/api/auth/2fa/disable`

Disable 2FA (requires current 2FA code).

**Headers**: `Authorization: Bearer <jwt-token>`

**Request Body**:

```json
{
  "code": "123456"
}
```

## Database Schema

### User Model

```prisma
model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  name                 String?
  passwordHash         String
  isEmailVerified      Boolean  @default(false)
  role                 UserRole @default(jobseeker)

  // Email verification
  magicLinkToken       String?
  magicLinkExpires     DateTime?

  // Password reset
  passwordResetToken   String?
  passwordResetExpires DateTime?

  // Two-factor authentication
  twoFactorSecret      String?
  twoFactorEnabled     Boolean @default(false)

  // ... other fields
}

enum UserRole {
  admin
  employer
  jobseeker
}
```

## Security Considerations

### Current Implementation

1. **Environment Variables**: All sensitive data stored in environment variables
2. **Input Validation**: Zod schemas for all API inputs
3. **SQL Injection Protection**: Prisma ORM with parameterized queries
4. **XSS Protection**: Content Security Policy headers
5. **CSRF Protection**: Built into NextAuth.js
6. **Rate Limiting**: Upstash Redis-based rate limiting
7. **Secure Headers**: Comprehensive security headers in middleware

### Known Issues & Fixes Applied

1. **✅ Fixed**: Hardcoded email credentials replaced with environment variables
2. **✅ Fixed**: Improved error handling in 2FA routes
3. **✅ Fixed**: Added input validation for 2FA codes
4. **✅ Fixed**: Increased bcrypt salt rounds from 10 to 12
5. **✅ Fixed**: Added comprehensive email templates

### Future Security Enhancements

1. **Account Lockout**: Implement account lockout after failed login attempts
2. **Device Tracking**: Track and notify users of new device logins
3. **Session Monitoring**: Real-time session monitoring and anomaly detection
4. **Backup Codes**: Generate backup codes for 2FA recovery
5. **Audit Logging**: Comprehensive audit trail for all authentication events
6. **Password Policies**: Enforce stronger password requirements
7. **Breach Detection**: Monitor for compromised passwords

## Error Handling

### Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}, // Additional error details
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "unique-request-id"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `CONFLICT`: Resource already exists (e.g., email taken)

## Testing

### Test Coverage Areas

1. **Unit Tests**:

   - Password hashing/verification
   - Token generation/validation
   - Input validation schemas
   - 2FA TOTP generation/verification

2. **Integration Tests**:

   - Registration flow
   - Login flow
   - Password reset flow
   - Email verification flow
   - 2FA setup/verification flow

3. **Security Tests**:
   - SQL injection attempts
   - XSS attempts
   - CSRF attacks
   - Rate limiting effectiveness
   - Session security

### Test Environment Setup

```bash
# Test database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/209jobs_test"

# Test email (Ethereal)
EMAIL_SERVER_HOST="smtp.ethereal.email"
EMAIL_SERVER_USER="test@ethereal.email"
EMAIL_SERVER_PASS="test-password"

# Test secrets
NEXTAUTH_SECRET="test-secret-for-testing-only"
ENCRYPTION_KEY="test-encryption-key-32-characters"
```

## Monitoring & Logging

### Authentication Events Logged

1. **Successful Logins**: User ID, timestamp, IP address, user agent
2. **Failed Logins**: Email, timestamp, IP address, failure reason
3. **Registration**: User ID, timestamp, IP address
4. **Password Resets**: User ID, timestamp, IP address
5. **2FA Events**: Setup, verification, disable events
6. **Email Verification**: Token generation and verification

### Metrics to Monitor

1. **Login Success Rate**: Track authentication success/failure ratios
2. **2FA Adoption**: Monitor 2FA setup rates among admin users
3. **Email Verification**: Track verification completion rates
4. **Password Reset Usage**: Monitor password reset frequency
5. **Rate Limiting**: Track rate limit hits and patterns

## Deployment Checklist

### Environment Variables

- [ ] `NEXTAUTH_SECRET` - Strong random secret (32+ characters)
- [ ] `DATABASE_URL` - Production database connection
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Production OAuth app
- [ ] Email configuration - Production email service
- [ ] `NEXTAUTH_URL` - Production domain with HTTPS
- [ ] `ENCRYPTION_KEY` - Strong encryption key (32 characters)
- [ ] Redis configuration - Production Redis instance

### Security Configuration

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured in middleware
- [ ] Rate limiting enabled with appropriate limits
- [ ] CORS configured for production domains
- [ ] Database connection secured with SSL
- [ ] Email service configured with proper authentication

### Monitoring Setup

- [ ] Authentication event logging enabled
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Performance monitoring enabled
- [ ] Rate limiting metrics tracked
- [ ] Security alerts configured

## Troubleshooting

### Common Issues

#### Email Not Sending

1. Check email service credentials
2. Verify SMTP settings and ports
3. Check firewall/network restrictions
4. Verify email service quotas and limits
5. Test with Ethereal Email for development

#### OAuth Issues

1. Verify OAuth redirect URIs match exactly
2. Check client ID and secret
3. Ensure OAuth consent screen is configured
4. Verify domain ownership for production

#### 2FA Problems

1. Check system time synchronization
2. Verify TOTP secret generation
3. Test with multiple authenticator apps
4. Check for clock drift tolerance

#### Session Issues

1. Verify `NEXTAUTH_SECRET` is set and consistent
2. Check domain configuration for cookies
3. Verify HTTPS in production
4. Clear browser cookies and test

### Debug Mode

Enable detailed logging:

```bash
DEBUG="next-auth:*"
LOG_LEVEL="debug"
PRISMA_QUERY_LOGGING="true"
```

## Future Roadmap

### Phase 1: Enhanced Security

- [ ] Account lockout mechanism
- [ ] Device fingerprinting
- [ ] Suspicious activity detection
- [ ] Enhanced audit logging

### Phase 2: User Experience

- [ ] Social login providers (GitHub, LinkedIn)
- [ ] Passwordless authentication
- [ ] Biometric authentication support
- [ ] Single Sign-On (SSO) integration

### Phase 3: Enterprise Features

- [ ] Multi-tenant authentication
- [ ] Advanced role-based permissions
- [ ] API key management
- [ ] Compliance reporting (SOC2, GDPR)

### Phase 4: Advanced Features

- [ ] Risk-based authentication
- [ ] Machine learning fraud detection
- [ ] Zero-trust security model
- [ ] Advanced session management

## Compliance & Standards

### Security Standards

- **OWASP Top 10**: Protection against common vulnerabilities
- **NIST Cybersecurity Framework**: Aligned security practices
- **ISO 27001**: Information security management principles

### Privacy Compliance

- **GDPR**: User data protection and privacy rights
- **CCPA**: California consumer privacy compliance
- **Data Minimization**: Collect only necessary user data

### Industry Standards

- **OAuth 2.0**: Standard authorization framework
- **OpenID Connect**: Identity layer on OAuth 2.0
- **JWT**: JSON Web Token standard
- **TOTP**: Time-based One-Time Password standard
