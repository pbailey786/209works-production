# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

209jobs is a production-ready, AI-powered hyperlocal job board platform specialized for California's Central Valley (209 area code region). It's a sophisticated Next.js 15 application with advanced AI features, vector embeddings, and comprehensive business management tools.

## Development Commands

### Core Development

```bash
npm run dev                    # Start development server with Turbopack
npm run build                  # Build for production with Prisma generation
npm run type-check             # TypeScript type checking
npm run lint                   # ESLint code linting
npm run format                 # Prettier code formatting
npm start                      # Start production server
```

### Testing

```bash
npm run test:e2e              # Run Playwright end-to-end tests
npm run test:e2e:ui           # Run tests with Playwright UI
npm run test:e2e:headed       # Run tests in headed mode
npm run test:e2e:debug        # Debug tests with Playwright
```

### Security

```bash
npm run security:scan         # Run dependency security scan
npm run security:generate-key # Generate encryption key
npm run security:check-config # Validate security configuration
```

### Database & Prisma

```bash
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema changes to database
npx prisma migrate dev        # Create and apply migration
npx prisma studio             # Open Prisma Studio
```

### Deployment

```bash
npm run deploy:dev            # Deploy to development
npm run deploy:staging        # Deploy to staging
npm run deploy:prod           # Deploy to production
npm run deploy:status         # Check deployment status
```

### Cron Jobs & Background Tasks

```bash
npm run cron:start            # Start cron scheduler
npm run cron:stop             # Stop cron scheduler
npm run cron:status           # Check cron status
npm run queue:status          # Check email queue status
```

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Clerk authentication
- **Database**: PostgreSQL with pgvector extension for vector search
- **ORM**: Prisma with comprehensive schema (40+ models)
- **AI/ML**: OpenAI GPT-4, text-embedding-3-small, vector similarity search
- **Caching**: Redis (Upstash) for sessions and performance
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscriptions and credits
- **Deployment**: Netlify with GitHub Actions CI/CD

### Key Features

- **AI-Powered Job Search**: Conversational interface with JobsGPT
- **Vector Semantic Search**: Advanced job matching using embeddings
- **Hyperlocal Intelligence**: Deep knowledge of Central Valley region
- **Multi-Area Support**: 209, 916, 510, NorCal regions
- **Role-Based Access**: Job seekers, employers, admins
- **Comprehensive Admin Dashboard**: Content moderation, analytics, user management

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages and API routes
│   ├── api/                  # API endpoints (60+ routes)
│   ├── admin/                # Admin dashboard pages
│   ├── employers/            # Employer portal pages
│   ├── sign-in/             # Clerk sign-in page
│   ├── sign-up/             # Clerk sign-up page
│   └── jobs/                 # Job-related pages
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── admin/                # Admin-specific components
│   └── job-search/           # Job search components
├── lib/                      # Utility libraries
│   ├── ai/                   # AI and NLP utilities
│   ├── database/             # Database utilities and types
│   ├── middleware/           # API middleware
│   ├── feature-flags.ts      # Feature flag system
│   └── services/             # Business logic services
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript type definitions
```

## Development Phases & Stabilization Strategy

### Completed Phases

**Phase 1: Stabilize Core** ✅ COMPLETE
- Created feature flag system (`/src/lib/feature-flags.ts`)
- Simplified homepage to prevent build timeouts
- Fixed development server startup issues

**Phase 2: Feature Islands** ✅ COMPLETE
- Re-enabled admin dashboard (`NEXT_PUBLIC_ENABLE_ADMIN=true`)
- Re-enabled basic features gradually

**Phase 3: Polish & Deploy** ✅ COMPLETE
- Enabled AI features (`NEXT_PUBLIC_ENABLE_AI=true`)
- Enabled analytics (`NEXT_PUBLIC_ENABLE_ANALYTICS=true`)
- Enabled employer dashboard (`NEXT_PUBLIC_ENABLE_EMPLOYER_DASH=true`)
- Enabled payment system (`NEXT_PUBLIC_ENABLE_PAYMENTS=true`)

**Phase 4A: Authentication** ✅ COMPLETE
- Integrated Clerk authentication (`NEXT_PUBLIC_ENABLE_CLERK_AUTH=true`)
- Removed old NextAuth system
- Fixed all build errors and SSR issues

### Next Phases to Implement

**Phase 5A: User Experience (Week 1)**
1. **ONBOARDING** - Enable `NEXT_PUBLIC_ENABLE_ONBOARDING=true`
   - User role selection after signup
   - Guided setup for new users
   - **Test:** Sign up → check onboarding flow works

2. **USER PROFILES** - Enable `NEXT_PUBLIC_ENABLE_PROFILES=true`
   - Job seeker profiles and resumes
   - Saved jobs functionality  
   - **Test:** Create profile → save jobs → check dashboard

**Phase 5B: Social & Marketing (Week 2)**
3. **SOCIAL FEATURES** - Enable `NEXT_PUBLIC_ENABLE_SOCIAL=true`
   - Instagram integration
   - Email campaigns
   - Social media job sharing
   - **Test:** Check social buttons → verify integrations

**Phase 5C: Multi-Region (Week 3)**
4. **REGIONAL FEATURES** - Enable `NEXT_PUBLIC_ENABLE_REGIONS=true`
   - 916.works, 510.works, norcal.works support
   - Regional job filtering
   - **Test:** Visit different domains → check functionality

### Testing Strategy for Each Feature

**After Enabling Each Feature:**
1. **Enable the feature** (change env var to `true` in `.env.local`)
2. **Restart dev server** (`npm run dev`)
3. **Test core workflows:**
   - ✅ Homepage loads without errors
   - ✅ Auth flow works (sign up/sign in)
   - ✅ Job search returns results
   - ✅ Admin dashboard accessible
   - ✅ New feature functions properly
4. **Deploy to Netlify** and test live
5. **If anything breaks:** disable the feature, fix it, then re-enable

**Important:** Add one feature at a time, test thoroughly, then move to the next. This prevents compounding issues.

## Important Implementation Details

### Feature Flag System

The application uses a comprehensive feature flag system located in `/src/lib/feature-flags.ts`. All features are controlled by environment variables:

```typescript
export const FEATURES = {
  // Core features (always enabled)
  BASIC_JOB_SEARCH: true,
  BASIC_JOB_POSTING: true,
  USER_AUTH: true,
  
  // Advanced features (controlled by environment)
  CLERK_AUTH: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
  ONBOARDING: process.env.NEXT_PUBLIC_ENABLE_ONBOARDING === 'true',
  // ... etc
} as const;
```

### Authentication System

- **Current**: Clerk authentication with feature flag protection
- **URLs**: `/sign-in` and `/sign-up` (with hyphens)
- **Environment Variables**:
  ```
  NEXT_PUBLIC_ENABLE_CLERK_AUTH=true
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
  ```

### Database Schema

The Prisma schema includes 40+ models covering:
- User management (job seekers, employers, admins)
- Job system with vector embeddings
- AI features (chat history, analytics)
- Business logic (credits, subscriptions)
- Content management and advertisements
- Comprehensive audit logging

### Multi-Domain Support

The platform supports multiple California regions:
- 209.works (Central Valley - primary)
- 916.works (Sacramento area)
- 510.works (East Bay)
- norcal.works (Northern California)

## Development Guidelines

### Testing Approach

- End-to-end testing with Playwright
- Authentication flow testing
- Job search functionality testing
- Cross-browser compatibility testing

### Code Quality Standards

- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Comprehensive error boundaries
- Type-safe API routes with Zod validation

### Environment Setup

Critical environment variables (see `.env.local`):

- `DATABASE_URL`: PostgreSQL with pgvector
- `NEXT_PUBLIC_ENABLE_CLERK_AUTH`: Enable Clerk authentication
- `OPENAI_API_KEY`: For AI features
- `UPSTASH_REDIS_REST_URL`: Redis caching
- `STRIPE_SECRET_KEY`: Payment processing

### Performance Considerations

- Redis caching for frequent queries
- Database indexes for optimal performance
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Pagination for large result sets

## Common Tasks

### Adding New Features

1. Add feature flag to `/src/lib/feature-flags.ts`
2. Add environment variable to `.env.local`
3. Wrap new feature code with feature flag checks
4. Test with feature disabled and enabled
5. Update this documentation

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update TypeScript types if needed
4. Test with development data

### Authentication Issues

- Check that `NEXT_PUBLIC_ENABLE_CLERK_AUTH=true` is set
- Verify Clerk API keys in environment variables
- Ensure Clerk pages are at `/sign-in` and `/sign-up` (with hyphens)
- Check that Header component has proper feature flag protection

### Build Errors

- Check for server-side code trying to access browser APIs
- Ensure all Clerk hooks are wrapped with feature flag protection
- Verify no `.backup` files are being compiled
- Run `npm run type-check` to catch TypeScript issues

## Important Files to Understand

### Core Configuration

- `next.config.ts`: Security headers, domain redirects, webpack config
- `prisma/schema.prisma`: Complete database schema
- `src/lib/feature-flags.ts`: Feature flag system
- `src/components/SessionProviderWrapper.tsx`: Clerk provider setup
- `src/components/Header.tsx`: Authentication UI logic

### Key Business Logic

- `src/lib/services/`: External service integrations
- `src/lib/search/`: Job search algorithms and vector similarity
- `src/actions/`: Server actions for data mutations

## Production Deployment Notes

- Uses Netlify for hosting with environment variable management
- Database migrations are automatically run during build
- Security headers are configured for production
- HTTPS enforcement and domain redirects are handled in Next.js config
- Comprehensive monitoring and error tracking is implemented

This is a sophisticated, production-ready application with enterprise-level architecture and comprehensive feature coverage.