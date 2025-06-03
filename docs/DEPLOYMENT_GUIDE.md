# 209jobs Deployment Guide

This guide covers the complete deployment process for the 209jobs application, including CI/CD setup, environment configuration, and production deployment procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Vercel Deployment](#vercel-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Security Configuration](#security-configuration)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** installed locally
- **Git** repository set up with GitHub
- **Vercel** account for hosting
- **PostgreSQL** database (Supabase/Neon/Railway recommended)
- **Redis** instance (Upstash recommended for Vercel)
- **Domain name** (optional, for custom domains)

## Environment Setup

### 1. Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd 209jobs

# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env.local

# Configure database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### 2. Branch Strategy

We use the following branch strategy:

- `main` → Production deployment
- `staging` → Staging environment
- `develop` → Development environment
- `feature/*` → Feature branches (create PRs to develop)

## CI/CD Pipeline

### GitHub Actions Workflows

Our CI/CD pipeline includes several workflows:

#### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

- **Triggers**: Push to main/staging/develop, PRs
- **Jobs**:
  - Lint and format checking
  - Unit and E2E testing
  - Security scanning
  - Build verification
  - Deployment to appropriate environment
  - Health checks

#### 2. Branch Protection (`.github/workflows/branch-protection.yml`)

- Enforces PR requirements
- Checks commit message format
- Validates PR descriptions

#### 3. Database Migration (`.github/workflows/database-migration.yml`)

- Validates schema changes
- Performs dry-run migrations
- Deploys migrations to appropriate environments
- Includes rollback procedures

### Required GitHub Secrets

Set these secrets in your GitHub repository:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Database URLs
DATABASE_URL_DEV=postgresql://...
DATABASE_URL_STAGING=postgresql://...
DATABASE_URL_PRODUCTION=postgresql://...

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## Vercel Deployment

### 1. Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 2. Environment Configuration

Configure environments in Vercel dashboard:

#### Development Environment

- **Branch**: `develop`
- **Domain**: `dev-209jobs.vercel.app`
- **Environment**: Development variables

#### Staging Environment

- **Branch**: `staging`
- **Domain**: `staging-209jobs.vercel.app`
- **Environment**: Staging variables

#### Production Environment

- **Branch**: `main`
- **Domain**: `209jobs.com`
- **Environment**: Production variables

### 3. Custom Domains

1. Add domain in Vercel dashboard
2. Configure DNS records:

   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## Database Setup

### 1. PostgreSQL Setup

We recommend using a managed PostgreSQL service:

#### Supabase (Recommended)

```bash
# Create project at https://supabase.com
# Get connection string from project settings
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

#### Neon (Alternative)

```bash
# Create project at https://neon.tech
# Get connection string from dashboard
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]
```

### 2. Migration Process

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### 3. Environment-Specific Databases

- **Development**: Local PostgreSQL or cloud development database
- **Staging**: Separate staging database with production-like data
- **Production**: Production database with backups and monitoring

## Environment Variables

### Required Variables

Create environment variables for each deployment environment:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://209jobs.com
NEXTAUTH_URL=https://209jobs.com
NEXTAUTH_SECRET=your-super-secret-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASS=your-app-password
EMAIL_FROM=209jobs <noreply@209jobs.com>

# External APIs
OPENAI_API_KEY=sk-your-openai-key
ADZUNA_APP_ID=your-adzuna-id
ADZUNA_APP_KEY=your-adzuna-key

# Security
ENCRYPTION_KEY=your-32-char-encryption-key
ENCRYPTION_SALT=your-encryption-salt
SEARCH_HASH_SALT=your-search-salt

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Environment-Specific Configuration

#### Development

```bash
NODE_ENV=development
SKIP_RATE_LIMIT=true
DEBUG_MODE=true
ENABLE_API_DOCS=true
```

#### Staging

```bash
NODE_ENV=staging
ENABLE_PERFORMANCE_LOGGING=true
LOG_LEVEL=debug
```

#### Production

```bash
NODE_ENV=production
ENABLE_SECURITY_HEADERS=true
ALLOWED_ORIGINS=https://209jobs.com,https://www.209jobs.com
LOG_LEVEL=info
```

## Monitoring & Alerting

### 1. Health Checks

The application includes a comprehensive health check endpoint:

```bash
# Check application health
curl https://209jobs.com/api/health

# Quick uptime check
curl -I https://209jobs.com/api/health
```

### 2. Error Tracking (Sentry)

Configure Sentry for error tracking:

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure environment variables
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### 3. Performance Monitoring

Monitor application performance:

- **Vercel Analytics**: Built-in performance monitoring
- **Custom metrics**: Application-specific performance tracking
- **Database monitoring**: Query performance and connection health

### 4. Alerting

Set up alerts for:

- Application errors (via Sentry)
- Deployment failures (via Slack)
- Health check failures
- Database connectivity issues
- High response times

## Security Configuration

### 1. Headers

Security headers are configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 2. Rate Limiting

Configure rate limiting via environment variables:

```bash
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
SKIP_RATE_LIMIT=false  # Enable rate limiting in production
```

### 3. CORS Configuration

Set allowed origins:

```bash
ALLOWED_ORIGINS=https://209jobs.com,https://www.209jobs.com
API_ALLOWED_ORIGINS=https://209jobs.com
```

## Rollback Procedures

### 1. Application Rollback

#### Via Vercel Dashboard

1. Go to Vercel project dashboard
2. Navigate to "Deployments" tab
3. Find previous stable deployment
4. Click "Promote to Production"

#### Via CLI

```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### 2. Database Rollback

#### Manual Rollback

```bash
# Connect to database
psql $DATABASE_URL

# Restore from backup
pg_restore -d $DATABASE_URL backup_file.sql
```

#### Migration Rollback

```bash
# Rollback to specific migration
npx prisma migrate reset

# Apply migrations up to specific point
npx prisma migrate deploy --to [migration-id]
```

### 3. Emergency Procedures

1. **Immediate Response**

   - Rollback to last known good deployment
   - Check error logs and monitoring dashboards
   - Notify stakeholders via Slack/email

2. **Investigation**

   - Review deployment logs
   - Check database migration status
   - Verify external service dependencies

3. **Resolution**
   - Fix identified issues
   - Test in staging environment
   - Deploy fix to production
   - Post-mortem analysis

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs in Vercel dashboard
# Common causes:
# - TypeScript errors
# - Missing environment variables
# - Dependency conflicts

# Local debugging
npm run build
npm run lint
npm run test
```

#### 2. Database Connection Issues

```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check migration status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

#### 3. Environment Variable Issues

```bash
# Verify required variables are set
node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"

# Check Vercel environment variables
vercel env ls
```

#### 4. Performance Issues

```bash
# Check health endpoint
curl https://209jobs.com/api/health

# Monitor response times
curl -w "%{time_total}\n" -s -o /dev/null https://209jobs.com

# Check Redis connectivity
curl https://209jobs.com/api/health | jq '.checks.redis'
```

### Debug Commands

```bash
# Check application health
curl -s https://209jobs.com/api/health | jq '.'

# Verify database schema
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"

# Test Redis connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check migration status
npx prisma migrate status

# View deployment logs
vercel logs [deployment-url]
```

### Support Contacts

- **Development Team**: dev@209jobs.com
- **DevOps Issues**: devops@209jobs.com
- **Emergency Contact**: emergency@209jobs.com

## Conclusion

This deployment guide provides a comprehensive overview of deploying the 209jobs application. For additional support or questions, please refer to the team contacts above or create an issue in the project repository.

Remember to:

- Always test changes in staging before production
- Keep environment variables secure and up to date
- Monitor application performance and errors
- Follow the rollback procedures if issues arise
- Document any changes or custom configurations
