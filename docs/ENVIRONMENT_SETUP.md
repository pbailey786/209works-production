# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database Configuration

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/209jobs"
```

### NextAuth Configuration

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key-here"
```

**Important**: Generate a secure secret using:

```bash
openssl rand -base64 32
```

### Google OAuth Configuration

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Setup Instructions**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Email Configuration (Required)

```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASS="your-app-password"
EMAIL_FROM="209jobs <noreply@209jobs.com>"
```

**Gmail Setup**:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_SERVER_PASS`

**Alternative Email Providers**:

**SendGrid**:

```bash
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASS="your-sendgrid-api-key"
```

**Mailgun**:

```bash
EMAIL_SERVER_HOST="smtp.mailgun.org"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-mailgun-smtp-username"
EMAIL_SERVER_PASS="your-mailgun-smtp-password"
```

**Development/Testing (Ethereal Email)**:

```bash
EMAIL_SERVER_HOST="smtp.ethereal.email"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-ethereal-user"
EMAIL_SERVER_PASS="your-ethereal-pass"
```

### Redis Configuration (Optional but Recommended)

```bash
REDIS_URL="redis://localhost:6379"
# OR for Upstash Redis
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### Security Configuration

```bash
ENCRYPTION_KEY="your-32-character-encryption-key-here"
```

Generate using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Configuration

```bash
# API Configuration
API_BASE_URL="http://localhost:3000/api"

# Rate Limiting
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"

# Logging
LOG_LEVEL="info"
LOG_DATABASE_QUERIES="false"

# Environment
NODE_ENV="development"
```

## Security Best Practices

### 1. Environment Variable Security

- Never commit `.env` files to version control
- Use different secrets for development and production
- Rotate secrets regularly
- Use strong, randomly generated secrets

### 2. Database Security

- Use connection pooling
- Enable SSL in production
- Restrict database access by IP
- Use read-only users for read operations

### 3. Email Security

- Use app-specific passwords
- Enable 2FA on email accounts
- Monitor email sending quotas
- Use dedicated email service for production

### 4. OAuth Security

- Restrict OAuth redirect URIs
- Use HTTPS in production
- Monitor OAuth usage
- Revoke unused OAuth applications

## Production Deployment

### Environment Variables Checklist

- [ ] `NEXTAUTH_SECRET` - Strong random secret
- [ ] `DATABASE_URL` - Production database connection
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Production OAuth app
- [ ] Email configuration - Production email service
- [ ] `NEXTAUTH_URL` - Production domain
- [ ] `ENCRYPTION_KEY` - Strong encryption key
- [ ] Redis configuration - Production Redis instance

### Security Headers

The application automatically sets security headers in production:

- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### SSL/TLS Configuration

- Use HTTPS in production
- Configure proper SSL certificates
- Enable HSTS
- Use secure cookies

## Troubleshooting

### Common Issues

**Email not sending**:

1. Check email credentials
2. Verify SMTP settings
3. Check firewall/network restrictions
4. Verify email service quotas

**OAuth not working**:

1. Check redirect URIs
2. Verify client ID/secret
3. Check OAuth consent screen
4. Verify domain verification

**Database connection issues**:

1. Check connection string format
2. Verify database is running
3. Check network connectivity
4. Verify credentials

**Session issues**:

1. Check `NEXTAUTH_SECRET`
2. Verify domain configuration
3. Check cookie settings
4. Clear browser cookies

### Debug Mode

Enable debug logging:

```bash
DEBUG="next-auth:*"
LOG_LEVEL="debug"
```

## Testing Configuration

### Test Email Setup

For testing, use Ethereal Email:

1. Go to [Ethereal Email](https://ethereal.email/)
2. Create test account
3. Use provided SMTP credentials
4. View sent emails in Ethereal inbox

### Test Database

Use a separate test database:

```bash
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/209jobs_test"
```

### Environment-Specific Configs

Create separate `.env` files:

- `.env.local` - Local development
- `.env.test` - Testing
- `.env.staging` - Staging environment
- `.env.production` - Production (never commit)
