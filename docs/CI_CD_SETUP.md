# CI/CD Setup Guide for 209jobs

This document provides step-by-step instructions for setting up the complete CI/CD pipeline for the 209jobs application.

## Table of Contents

1. [Overview](#overview)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Vercel Project Setup](#vercel-project-setup)
4. [Environment Configuration](#environment-configuration)
5. [GitHub Secrets Configuration](#github-secrets-configuration)
6. [Database Setup](#database-setup)
7. [Monitoring Setup](#monitoring-setup)
8. [Testing the Pipeline](#testing-the-pipeline)
9. [Troubleshooting](#troubleshooting)

## Overview

Our CI/CD pipeline includes:

- **Continuous Integration**: Automated testing, linting, and security scanning
- **Continuous Deployment**: Automated deployment to development, staging, and production
- **Database Migrations**: Automated schema changes with rollback capabilities
- **Health Checks**: Post-deployment verification
- **Monitoring**: Error tracking with Sentry and performance monitoring
- **Notifications**: Slack notifications for deployment status

### Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Development │   Staging   │ Production  │
│   (develop) │  (staging)  │    (main)   │
└─────────────┴─────────────┴─────────────┘
    ↓               ↓               ↓
Vercel Deployment   Vercel         Vercel
    ↓               ↓               ↓
Database Migrations Health Checks  Monitoring
```

## GitHub Repository Setup

### 1. Repository Structure

Ensure your repository has the following structure:

```
.github/
├── workflows/
│   ├── ci-cd.yml
│   ├── branch-protection.yml
│   └── database-migration.yml
├── ISSUE_TEMPLATE/
└── PULL_REQUEST_TEMPLATE/
```

### 2. Branch Protection Rules

Set up branch protection rules in GitHub:

1. Go to **Settings** → **Branches**
2. Add rules for `main`, `staging`, and `develop` branches:

#### Main Branch (Production)
- ✅ Require a pull request before merging
- ✅ Require approvals: 2
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Required status checks:
  - `lint-and-format`
  - `test`
  - `e2e-test`
  - `build`
  - `security-scan`
- ✅ Require conversation resolution before merging
- ✅ Restrict pushes that create files larger than 100MB

#### Staging Branch
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
- ✅ Required status checks:
  - `lint-and-format`
  - `test`
  - `build`

#### Develop Branch
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Required status checks:
  - `lint-and-format`
  - `test`

### 3. GitHub Environments

Create environments in GitHub:

1. Go to **Settings** → **Environments**
2. Create the following environments:

#### preview
- **Deployment branches**: Selected branches → `*` (all branches for PR previews)

#### development
- **Deployment branches**: Selected branches → `develop`

#### staging
- **Deployment branches**: Selected branches → `staging`

#### production
- **Deployment branches**: Selected branches → `main`
- **Required reviewers**: Add team members
- **Wait timer**: 5 minutes (optional delay before deployment)

#### database-development, database-staging, database-production
- Same branch restrictions as above
- Used specifically for database migration approvals

#### database-production-rollback
- **Deployment branches**: Manual deployments only
- **Required reviewers**: Add senior team members
- **Wait timer**: 10 minutes

## Vercel Project Setup

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

### 2. Configure Project Settings

#### General Settings
- **Project Name**: `209jobs`
- **Root Directory**: `./` (leave empty)

#### Git Integration
- **Production Branch**: `main`
- **Automatic Deployments**: Enabled for all branches

#### Domains
Add the following domains:

**Production**:
- `209jobs.com` (primary)
- `www.209jobs.com` (redirect to primary)

**Staging**:
- `staging-209jobs.vercel.app`

**Development**:
- `dev-209jobs.vercel.app`

### 3. Get Vercel Project IDs

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Get project information
vercel project ls
```

Note down:
- **Project ID**: Found in `.vercel/project.json`
- **Organization ID**: Found in `.vercel/project.json`

## Environment Configuration

### 1. Create Environment Variables

Set up environment variables in Vercel for each environment:

#### All Environments (Common Variables)
```bash
NODE_ENV=production
NEXTAUTH_SECRET=your-super-secret-nextauth-key
NEXT_TELEMETRY_DISABLED=1
```

#### Environment-Specific Variables

**Development**:
```bash
NEXT_PUBLIC_APP_URL=https://dev-209jobs.vercel.app
NEXTAUTH_URL=https://dev-209jobs.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/209jobs_dev
SKIP_RATE_LIMIT=true
LOG_LEVEL=debug
```

**Staging**:
```bash
NEXT_PUBLIC_APP_URL=https://staging-209jobs.vercel.app
NEXTAUTH_URL=https://staging-209jobs.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/209jobs_staging
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true
```

**Production**:
```bash
NEXT_PUBLIC_APP_URL=https://209jobs.com
NEXTAUTH_URL=https://209jobs.com
DATABASE_URL=postgresql://user:pass@host:5432/209jobs_prod
ALLOWED_ORIGINS=https://209jobs.com,https://www.209jobs.com
ENABLE_SECURITY_HEADERS=true
LOG_LEVEL=warn
```

### 2. Configure External Services

#### Database (PostgreSQL)
Set up separate databases for each environment:

**Recommended Providers**:
- [Supabase](https://supabase.com) (Free tier available)
- [Neon](https://neon.tech) (Serverless PostgreSQL)
- [Railway](https://railway.app) (Simple deployment)

#### Redis (Caching)
Set up Redis for each environment:

**Recommended Provider**:
- [Upstash](https://upstash.com) (Serverless Redis)

```bash
# Add to environment variables
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

#### Authentication
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASS=your-app-password
EMAIL_FROM=209jobs <noreply@209jobs.com>
```

#### External APIs
```bash
# OpenAI for AI features
OPENAI_API_KEY=sk-your-openai-api-key

# Job Board APIs
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-api-key
```

#### Security
```bash
# Generate secure keys
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_SALT=your-encryption-salt
SEARCH_HASH_SALT=your-search-salt
```

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following **Repository secrets**:

### Vercel Configuration
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### Database URLs
```bash
DATABASE_URL_DEV=postgresql://user:pass@host:5432/209jobs_dev
DATABASE_URL_STAGING=postgresql://user:pass@host:5432/209jobs_staging
DATABASE_URL_PRODUCTION=postgresql://user:pass@host:5432/209jobs_prod
```

### Monitoring & Notifications
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SLACK_WEBHOOK=https://hooks.slack.com/services/your/slack/webhook
```

### How to Get Secrets

#### Vercel Token
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with appropriate scopes
3. Copy the token value

#### Slack Webhook
1. Go to your Slack workspace
2. Create a new app or use existing one
3. Enable Incoming Webhooks
4. Create a webhook for your deployment channel
5. Copy the webhook URL

#### Sentry DSN
1. Create a Sentry project at [sentry.io](https://sentry.io)
2. Go to **Settings** → **Projects** → **Your Project** → **Client Keys (DSN)**
3. Copy the DSN value

## Database Setup

### 1. Set Up Databases

Create separate databases for each environment:

```sql
-- Development
CREATE DATABASE "209jobs_dev";

-- Staging  
CREATE DATABASE "209jobs_staging";

-- Production
CREATE DATABASE "209jobs_prod";
```

### 2. Configure Prisma

Ensure your `prisma/schema.prisma` is configured properly:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Set Up Migration Workflow

The database migration workflow is automated via GitHub Actions. It will:

1. Validate schema changes
2. Run dry-run migrations on test database
3. Apply migrations to appropriate environment
4. Perform health checks

## Monitoring Setup

### 1. Sentry Error Tracking

1. Create a Sentry project
2. Install Sentry in your project:
   ```bash
   npm install @sentry/nextjs
   ```
3. Configure Sentry (already included in the setup)
4. Add Sentry DSN to environment variables

### 2. Health Check Monitoring

The application includes a comprehensive health check endpoint at `/api/health` that monitors:

- Database connectivity
- Redis connectivity
- External API availability
- Memory usage
- Application version and uptime

### 3. Performance Monitoring

Enable Vercel Analytics:
1. Go to your Vercel project dashboard
2. Navigate to **Analytics** tab
3. Enable analytics for your project

## Testing the Pipeline

### 1. Test Development Deployment

1. Create a feature branch:
   ```bash
   git checkout -b feature/test-deployment
   ```

2. Make a small change and commit:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "feat: test deployment pipeline"
   ```

3. Push to GitHub:
   ```bash
   git push origin feature/test-deployment
   ```

4. Create a Pull Request to `develop` branch

5. Verify that CI checks pass:
   - Lint and format check
   - Unit tests
   - E2E tests
   - Build verification

6. Merge the PR and verify development deployment

### 2. Test Staging Deployment

1. Create PR from `develop` to `staging`
2. Verify CI checks pass
3. Merge and verify staging deployment
4. Test staging environment functionality

### 3. Test Production Deployment

1. Create PR from `staging` to `main`
2. Verify CI checks pass
3. Ensure required approvals are obtained
4. Merge and verify production deployment
5. Verify health checks and monitoring

### 4. Test Database Migration

1. Create a simple migration:
   ```bash
   npx prisma migrate dev --name test_migration
   ```

2. Commit and push the migration
3. Verify migration workflow executes
4. Check that migration is applied to appropriate environments

## Troubleshooting

### Common Issues

#### Build Failures
- Check build logs in GitHub Actions
- Verify all environment variables are set
- Ensure TypeScript compilation passes locally

#### Deployment Failures
- Check Vercel deployment logs
- Verify Vercel project configuration
- Ensure GitHub secrets are correctly set

#### Database Migration Failures
- Check database connectivity
- Verify migration syntax
- Review database schema compatibility

#### Health Check Failures
- Check application logs
- Verify external service connectivity
- Review environment variable configuration

### Debug Commands

```bash
# Test local build
npm run build

# Test health endpoint locally
curl http://localhost:3000/api/health

# Check Vercel deployment status
vercel list

# View deployment logs
vercel logs [deployment-url]

# Check GitHub Actions logs
# Go to repository → Actions tab → Select workflow run
```

### Support Channels

- **GitHub Issues**: For bug reports and feature requests
- **Slack Channel**: `#209jobs-deployments` for deployment discussions
- **Email**: devops@209jobs.com for urgent deployment issues

## Best Practices

1. **Never push directly to protected branches**
2. **Always test changes in development/staging first**
3. **Use conventional commit messages**
4. **Keep environment variables secure**
5. **Monitor deployment notifications**
6. **Perform regular security updates**
7. **Document any configuration changes**
8. **Test rollback procedures periodically**

## Maintenance

### Regular Tasks

- **Weekly**: Review deployment metrics and performance
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and rotate secrets and API keys
- **Yearly**: Review and update CI/CD pipeline configuration

### Monitoring

- Set up alerts for deployment failures
- Monitor application performance metrics
- Track error rates and response times
- Review security scan results

This completes the comprehensive CI/CD setup for the 209jobs application. The pipeline provides automated testing, deployment, and monitoring across all environments with proper safeguards and rollback capabilities. 