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
- **"Should I Apply?" AI Matching**: Personalized job fit analysis with local insights
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

### Pre-Launch Development Plan

## 🎯 **CURRENT STATUS** ✅
**Foundations Complete:**
- Phase 1-4A: Core platform, auth, basic features ✅
- Phase 5A: Basic job seeker experience ✅  
- Phase 5A+: Profile gamification & AI skills ✅ CURRENT

---

## 🚀 **PRE-LAUNCH MVP (Build Everything Before Going Live)**
*Goal: Complete, polished platform ready for launch*

### **Phase 5B: Employer MVP (3 weeks)**
*Build the money-making side*
- **Job Posting System** - Full CRUD for job posts
- **Basic Applicant Management** - View/filter/contact applicants  
- **Payment Integration** - Stripe for job post credits (ready but not live)
- **Employer Onboarding** - Company setup & verification
- **Company Profiles** - Basic branded employer pages
- **Test:** Complete employer workflow without payment processing

### **Phase 5C: Admin Control MVP (2 weeks)**  
*Build platform control systems*
- **Content Moderation** - Job post approval/rejection system
- **User Management** - Admin can manage all users
- **Platform Analytics** - Basic usage metrics and reporting
- **System Monitoring** - Error tracking and performance monitoring
- **Test:** Admin can control entire platform effectively

### **Phase 5D: .works Story System (3 weeks)**
*Build the unique differentiation feature*
- **Story Builder** - AI-assisted career narratives for job seekers
- **Employer Story View** - Enhanced applicant cards with stories
- **Public Story Pages** - Shareable career stories
- **Story Analytics** - Track engagement and effectiveness
- **Test:** Stories create compelling candidate profiles

### **Phase 5E: Polish & Integration (2 weeks)**
*Make everything work together seamlessly*
- **Cross-Feature Integration** - All systems work together
- **Email System** - All notifications working properly
- **Mobile Optimization** - Platform works great on all devices
- **Performance Optimization** - Fast loading and smooth UX
- **Security Audit** - All features properly secured
- **Test:** End-to-end platform testing with all features

---

## 🎉 **LAUNCH PREPARATION (1 week)**

### **Pre-Launch Checklist:**
- [ ] All core features working and tested
- [ ] Payment system ready (Stripe configured)
- [ ] Admin tools functional
- [ ] Content moderation system active
- [ ] Email notifications operational
- [ ] Mobile responsive design
- [ ] Security measures in place
- [ ] Analytics tracking implemented
- [ ] Error monitoring active
- [ ] Performance optimized

### **Launch Day Features:**
✅ **Job Seekers Can:**
- Create compelling profiles with gamification
- Get AI-powered skill suggestions
- Use "Should I Apply?" AI job matching analysis
- Build .works career stories
- Search and apply for jobs
- Track applications and saved jobs

✅ **Employers Can:**
- Post jobs with payment
- View enhanced candidate profiles with stories
- Manage applicants with full ATS
- Access company dashboard and analytics

✅ **Platform Has:**
- Full admin control and moderation
- Payment processing and subscription management
- Analytics and reporting
- Email notification system
- Mobile-first responsive design

---

## 📈 **POST-LAUNCH PHASES (After Going Live)**

### **Phase 6: Revenue Optimization (Month 1)**
- Monitor real user behavior and optimize conversion
- Add premium features based on user feedback
- Implement subscription tiers and advanced features
- **Goal:** $5K+ monthly recurring revenue

### **Phase 7: Scale & Growth (Month 2-3)**  
- Multi-region expansion (916, 510, norcal)
- Advanced AI matching and recommendations
- Social features and viral growth mechanics
- **Goal:** $15K+ monthly, regional market leadership

### **Phase 8: Advanced Features (Month 4+)**
- Video interviews and skills testing
- Advanced analytics and business intelligence
- Enterprise features for large employers
- **Goal:** $25K+ monthly, platform differentiation

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

## Development Timeline Summary

**PRE-LAUNCH TOTAL: ~11 weeks to complete platform**

### **Current:** Phase 5A+ (Profile Enhancement) - Almost Done ✅
- Profile gamification ✅
- AI skill suggestions ✅
- "Should I Apply?" AI job matching ✅
- .works resume builder on dashboard ✅
- Testing and refinement

### **Next 11 Weeks:**
- **Weeks 1-3:** Phase 5B (Employer MVP) 
- **Weeks 4-5:** Phase 5C (Admin Control)
- **Weeks 6-8:** Phase 5D (.works Stories) 
- **Weeks 9-10:** Phase 5E (Polish & Integration)
- **Week 11:** Launch Preparation

### **Launch Day Goal:**
Complete job board platform with:
- ✅ **MVP:** Job seekers find jobs, employers post jobs
- ✅ **Quality Control:** Admin moderation and management
- ✅ **Unique Features:** .works stories for differentiation  
- ✅ **Cash Flow:** Payment system ready for immediate revenue

**This approach = Launch with confidence, not scrambling to add features after launch!**

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
- **OAuth Flow**: Both sign-in and sign-up redirect to `/auth-redirect` which handles onboarding logic
- **Environment Variables**:
  ```
  NEXT_PUBLIC_ENABLE_CLERK_AUTH=true
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/auth-redirect
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/auth-redirect
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

## Search Analytics System (Phase 6)

### Overview

The platform includes a comprehensive search analytics system for tracking user behavior, search patterns, and JobsGPT effectiveness. This system is **production-ready** but disabled by default to avoid unnecessary data collection during development.

### Components Already Built

**Frontend Analytics Dashboard:**
- Location: `/src/app/admin/analytics/search/page.tsx`
- Beautiful admin interface showing search metrics, trends, and patterns
- Real-time visualization of popular search terms and JobsGPT queries

**Backend Analytics API:**
- Location: `/src/app/api/admin/analytics-stats/route.ts`
- Collects comprehensive search and chat analytics from database
- Supports date filtering and trend analysis

**Database Integration:**
- Uses existing `ChatAnalytics` table in Prisma schema
- Tracks: `userId`, `question`, `responseTime`, `jobsFound`, `sessionId`, `createdAt`

### Analytics Data Collected

**Search Metrics:**
- Total searches and unique searchers
- Search success rates (searches that led to job views)
- Average searches per user
- Conversion rates (searches → applications)

**JobsGPT Analytics:**
- Chat sessions and average session length
- Popular query categories (Career Guidance, Salary Inquiry, etc.)
- Response times and effectiveness
- User engagement patterns

**Search Patterns:**
- Top search terms with trend analysis
- Search distribution by job category
- Peak search times (hourly patterns)
- Failed searches ("no results" queries) with suggestions

**Business Intelligence:**
- Regional search differences
- Industry popularity trends
- Content gap analysis (what users want vs. what's available)
- User behavior patterns for optimization

### Implementation Guide (For Pre-Launch)

**Step 1: Enable Analytics Feature**
```bash
# Add to .env.local
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Step 2: Add Analytics Tracking to Search APIs**
```typescript
// In /src/app/api/chat-job-search/route.ts (already structured for this)
await prisma.chatAnalytics.create({
  data: {
    userId: authenticatedUserId,
    question: userMessage,
    responseTime: Date.now() - startTime,
    jobsFound: jobs.length,
    sessionId: sessionId || `session_${Date.now()}`,
    createdAt: new Date(),
  }
});
```

**Step 3: Add Search Event Tracking**
```typescript
// In search components
const trackSearch = async (query: string, results: number) => {
  if (FEATURES.ANALYTICS_DASHBOARD) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'job_search',
        query,
        resultsCount: results,
        timestamp: new Date(),
      })
    });
  }
};
```

**Step 4: Test Analytics Dashboard**
1. Visit `/admin/analytics/search` (requires admin role)
2. Verify data collection from search interactions
3. Check trend analysis and popular query tracking
4. Validate export functionality for business reporting

### Why Enable Before Launch

**Content Strategy:**
- Identify what jobs users want but can't find
- Optimize job categories and descriptions
- Plan content creation based on demand

**AI Improvement:**
- Track JobsGPT effectiveness and user satisfaction
- Identify common question patterns for training
- Optimize conversational flows

**Business Intelligence:**
- Peak hiring times and seasonal trends
- Regional job market insights
- User behavior optimization opportunities

**SEO & Marketing:**
- Popular keywords for content targeting
- User intent analysis for better matching
- Conversion funnel optimization

### Privacy & Compliance

- Analytics track search patterns, not personal data
- User identifiers are hashed for privacy
- GDPR-compliant data collection practices
- Clear opt-out mechanisms for users

### Access & Security

- Analytics dashboard requires admin role
- API endpoints are protected with authentication
- Data export features for business reporting
- Real-time monitoring capabilities

**Note:** The analytics system is fully built and tested, just waiting for feature flag activation before your major launch to provide valuable insights for business growth and user experience optimization.

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