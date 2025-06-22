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
- **Backend**: Next.js API routes, NextAuth.js authentication
- **Database**: PostgreSQL with pgvector extension for vector search
- **ORM**: Prisma with comprehensive schema (40+ models)
- **AI/ML**: OpenAI GPT-4, text-embedding-3-small, vector similarity search
- **Caching**: Redis (Upstash) for sessions and performance
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscriptions and credits
- **Deployment**: Vercel with GitHub Actions CI/CD

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
│   └── jobs/                 # Job-related pages
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── admin/                # Admin-specific components
│   └── job-search/           # Job search components
├── lib/                      # Utility libraries
│   ├── ai/                   # AI and NLP utilities
│   ├── database/             # Database utilities and types
│   ├── middleware/           # API middleware
│   └── services/             # Business logic services
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript type definitions
```

## Important Implementation Details

### AI System Architecture

The application features a sophisticated AI system with:

- **JobsGPT**: Conversational job search assistant powered by GPT-4
- **Intent Classification**: 7 specialized conversation types
- **Vector Embeddings**: OpenAI text-embedding-3-small with pgvector
- **Local Knowledge Base**: 50+ Central Valley insights
- **Context Retention**: Multi-turn conversations with session memory

### Database Schema

The Prisma schema includes 40+ models covering:

- User management (job seekers, employers, admins)
- Job system with vector embeddings
- AI features (chat history, analytics)
- Business logic (credits, subscriptions)
- Content management and advertisements
- Comprehensive audit logging

### Security Implementation

- Role-based access control (RBAC) throughout
- Input validation with Zod schemas
- SQL injection protection via Prisma
- Rate limiting with Upstash Redis
- Comprehensive security headers in Next.js config
- Audit logging for all critical operations

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

Critical environment variables (see docs/ENVIRONMENT_SETUP.md):

- `DATABASE_URL`: PostgreSQL with pgvector
- `NEXTAUTH_SECRET`: Authentication secret
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

### Adding New API Endpoints

1. Create route in `src/app/api/`
2. Add input validation with Zod
3. Implement proper error handling
4. Add authentication middleware if needed
5. Update OpenAPI documentation

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update TypeScript types if needed
4. Test with development data

### AI Feature Development

- Vector embeddings are stored in the `Job` model
- Chat conversations use the `ChatSession` and `ChatMessage` models
- AI prompts are centralized in `src/lib/conversation/prompts.ts`
- Local knowledge is managed in `src/lib/conversation/local-knowledge.ts`

### Regional Feature Implementation

- Domain-specific logic is handled in `src/lib/domain/`
- Regional routing is managed in `src/lib/utils/regional-routing.ts`
- Domain context is provided by `src/lib/domain/context.tsx`

## Important Files to Understand

### Core Configuration

- `next.config.ts`: Security headers, domain redirects, performance optimization
- `prisma/schema.prisma`: Complete database schema (1300+ lines)
- `src/lib/auth.ts`: Authentication configuration
- `src/lib/database/prisma.ts`: Database client configuration

### AI Implementation

- `src/lib/conversation/manager.ts`: Main conversation handling
- `src/lib/llm/`: OpenAI integration and job matching algorithms
- `src/app/api/jobs/chatbot/route.ts`: Main chatbot API endpoint

### Key Business Logic

- `src/lib/services/`: External service integrations
- `src/lib/search/`: Job search algorithms and vector similarity
- `src/actions/`: Server actions for data mutations

## Production Deployment Notes

- Uses Vercel for hosting with environment variable management
- Database migrations are automatically run during build
- Security headers are configured for production
- HTTPS enforcement and domain redirects are handled in Next.js config
- Comprehensive monitoring and error tracking is implemented

## Documentation Resources

The `docs/` directory contains 38+ documentation files including:

- `NLP_JOBSGPT_COMPLETE.md`: Complete AI implementation guide
- `SEARCH_SYSTEM.md`: Advanced search capabilities
- `ENVIRONMENT_SETUP.md`: Development environment setup
- `API/`: Complete API documentation with OpenAPI spec
- `DEPLOYMENT_GUIDE.md`: Production deployment procedures

This is a sophisticated, production-ready application with enterprise-level architecture and comprehensive feature coverage.
