# Technical Implementation Plan: .works Ecosystem Migration

**Version:** 1.0  
**Date:** January 2025  
**Migration:** 209jobs.com → .works Ecosystem

## Executive Summary

This document outlines the technical implementation strategy for migrating from 209jobs.com to a multi-domain .works ecosystem. The plan ensures minimal disruption to existing users while establishing a robust foundation for regional expansion and enhanced SEO performance.

## Architecture Overview

### Current State

- **Primary Domain:** 209jobs.com
- **Infrastructure:** Single Next.js application on Vercel
- **Database:** PostgreSQL with Prisma ORM
- **CDN:** Vercel Edge Network
- **Email:** Resend service

### Target State

- **Primary Domains:** 209.works, 916.works, 510.works, 559.works, norcal.works
- **Infrastructure:** Multi-domain Next.js application with regional routing
- **Database:** Shared PostgreSQL with regional data partitioning
- **CDN:** Multi-region edge deployment
- **Email:** Regional email configurations

## Domain Strategy

### Domain Registration and Setup

#### Primary Domains

```
209.works - Central Valley (Primary)
916.works - Sacramento Region
510.works - East Bay
559.works - Fresno Region
norcal.works - Regional Hub
```

#### DNS Configuration

```
Primary A Records:
209.works → Vercel Edge Network
916.works → Vercel Edge Network
510.works → Vercel Edge Network
559.works → Vercel Edge Network
norcal.works → Vercel Edge Network

CNAME Records:
www.209.works → 209.works
www.916.works → 916.works
www.510.works → 510.works
www.559.works → 559.works
www.norcal.works → norcal.works

Legacy Redirects:
209jobs.com → 209.works (301 Permanent)
www.209jobs.com → 209.works (301 Permanent)
```

### SSL/TLS Configuration

- **Certificate Provider:** Let's Encrypt via Vercel
- **Security Headers:** HSTS, CSP, X-Frame-Options
- **Encryption:** TLS 1.3 minimum
- **OCSP Stapling:** Enabled

## Application Architecture

### Multi-Domain Routing Strategy

#### Option 1: Single Application with Domain Detection (Recommended)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const region = getRegionFromHostname(hostname);

  // Set region context for the application
  const response = NextResponse.next();
  response.headers.set('x-region', region);

  return response;
}

function getRegionFromHostname(hostname: string): string {
  if (hostname.includes('209.works')) return '209';
  if (hostname.includes('916.works')) return '916';
  if (hostname.includes('510.works')) return '510';
  if (hostname.includes('559.works')) return '559';
  if (hostname.includes('norcal.works')) return 'norcal';
  return '209'; // Default fallback
}
```

#### Regional Context Provider

```typescript
// lib/regional-context.tsx
import { createContext, useContext } from 'react';

interface RegionalContext {
  region: string;
  config: RegionalConfig;
  branding: RegionalBranding;
}

const RegionalContext = createContext<RegionalContext | null>(null);

export function RegionalProvider({ children, region }: { children: React.ReactNode, region: string }) {
  const config = getRegionalConfig(region);
  const branding = getRegionalBranding(region);

  return (
    <RegionalContext.Provider value={{ region, config, branding }}>
      {children}
    </RegionalContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionalContext);
  if (!context) throw new Error('useRegion must be used within RegionalProvider');
  return context;
}
```

### Database Schema Updates

#### Regional Data Partitioning

```sql
-- Add region column to existing tables
ALTER TABLE jobs ADD COLUMN region VARCHAR(10) DEFAULT '209';
ALTER TABLE users ADD COLUMN preferred_regions TEXT[] DEFAULT ARRAY['209'];
ALTER TABLE companies ADD COLUMN regions TEXT[] DEFAULT ARRAY['209'];

-- Create regional indexes
CREATE INDEX idx_jobs_region ON jobs(region);
CREATE INDEX idx_jobs_region_location ON jobs(region, location);
CREATE INDEX idx_users_regions ON users USING GIN(preferred_regions);

-- Regional configuration table
CREATE TABLE regional_configs (
  region VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tagline VARCHAR(200),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  target_cities TEXT[],
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert regional configurations
INSERT INTO regional_configs (region, name, tagline, primary_color, secondary_color, target_cities) VALUES
('209', 'Central Valley', 'Where Central Valley Works', '#2563EB', '#F59E0B', ARRAY['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi']),
('916', 'Sacramento Region', 'Capital Region Careers', '#1E40AF', '#D97706', ARRAY['Sacramento', 'Roseville', 'Folsom', 'Davis', 'Elk Grove']),
('510', 'East Bay', 'East Bay Excellence', '#0EA5E9', '#EA580C', ARRAY['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'San Leandro']),
('559', 'Fresno Region', 'Fresno Forward', '#3B82F6', '#F97316', ARRAY['Fresno', 'Clovis', 'Madera', 'Visalia', 'Hanford']),
('norcal', 'Northern California', 'Northern California''s Work Hub', '#1D4ED8', '#CA8A04', ARRAY['Northern California']);
```

#### Data Migration Strategy

```typescript
// scripts/migrate-regional-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateJobsToRegions() {
  // Assign regions based on location data
  const locationToRegionMap = {
    Stockton: '209',
    Modesto: '209',
    Tracy: '209',
    Manteca: '209',
    Lodi: '209',
    Sacramento: '916',
    Roseville: '916',
    Folsom: '916',
    Davis: '916',
    'Elk Grove': '916',
    Oakland: '510',
    Berkeley: '510',
    Fremont: '510',
    Hayward: '510',
    'San Leandro': '510',
    Fresno: '559',
    Clovis: '559',
    Madera: '559',
    Visalia: '559',
    Hanford: '559',
  };

  for (const [city, region] of Object.entries(locationToRegionMap)) {
    await prisma.job.updateMany({
      where: {
        location: {
          contains: city,
          mode: 'insensitive',
        },
      },
      data: {
        region: region,
      },
    });
  }
}
```

## SEO Migration Strategy

### URL Structure and Redirects

#### Current URL Structure

```
209jobs.com/jobs
209jobs.com/jobs/[id]
209jobs.com/employers
209jobs.com/pricing
```

#### New URL Structure

```
209.works/jobs
209.works/jobs/[id]
209.works/employers
209.works/pricing

916.works/jobs
916.works/jobs/[id]
916.works/employers
916.works/pricing

[etc. for other regions]
```

#### Redirect Implementation

```typescript
// next.config.ts
const nextConfig = {
  async redirects() {
    return [
      // Legacy domain redirects
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '209jobs.com',
          },
        ],
        destination: 'https://209.works/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.209jobs.com',
          },
        ],
        destination: 'https://209.works/:path*',
        permanent: true,
      },
      // Regional job redirects for better UX
      {
        source: '/jobs/:id',
        has: [
          {
            type: 'header',
            key: 'x-region',
            value: '916',
          },
        ],
        destination: 'https://916.works/jobs/:id',
        permanent: false,
      },
      // Add similar redirects for other regions
    ];
  },
};
```

### Regional SEO Optimization

#### Meta Tags and Schema

```typescript
// components/RegionalSEO.tsx
import Head from 'next/head';
import { useRegion } from '@/lib/regional-context';

export function RegionalSEO({
  title,
  description,
  canonical,
  jobData
}: RegionalSEOProps) {
  const { region, config, branding } = useRegion();

  const regionalTitle = `${title} | ${config.name}`;
  const regionalDescription = description || config.metaDescription;
  const regionalCanonical = canonical || `https://${region}.works`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": config.name,
    "alternateName": `${region}.works`,
    "url": regionalCanonical,
    "description": regionalDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://${region}.works/jobs?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "areaServed": {
      "@type": "Place",
      "name": config.name,
      "containedInPlace": {
        "@type": "Place",
        "name": "California, United States"
      }
    }
  };

  return (
    <Head>
      <title>{regionalTitle}</title>
      <meta name="description" content={regionalDescription} />
      <link rel="canonical" href={regionalCanonical} />

      {/* Regional-specific meta tags */}
      <meta name="geo.region" content="US-CA" />
      <meta name="geo.placename" content={config.name} />

      {/* Open Graph */}
      <meta property="og:title" content={regionalTitle} />
      <meta property="og:description" content={regionalDescription} />
      <meta property="og:url" content={regionalCanonical} />
      <meta property="og:site_name" content={config.name} />

      {/* Twitter */}
      <meta name="twitter:title" content={regionalTitle} />
      <meta name="twitter:description" content={regionalDescription} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  );
}
```

#### Regional Sitemap Generation

```typescript
// scripts/generate-regional-sitemaps.ts
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateRegionalSitemaps() {
  const regions = ['209', '916', '510', '559', 'norcal'];

  for (const region of regions) {
    const jobs = await prisma.job.findMany({
      where: { region },
      select: { id: true, updatedAt: true },
    });

    const sitemap = generateSitemapXML(region, jobs);
    writeFileSync(`public/sitemap-${region}.xml`, sitemap);
  }
}

function generateSitemapXML(region: string, jobs: any[]) {
  const baseUrl = `https://${region}.works`;

  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/jobs`,
    `${baseUrl}/employers`,
    `${baseUrl}/pricing`,
    ...jobs.map(job => `${baseUrl}/jobs/${job.id}`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('')}
</urlset>`;
}
```

## Performance Optimization

### Edge Computing Strategy

#### Regional Edge Functions

```typescript
// edge/regional-routing.ts
import { NextRequest, NextResponse } from 'next/server';

export default function handler(req: NextRequest) {
  const geo = req.geo;
  const userRegion = determineUserRegion(geo);
  const hostname = req.headers.get('host');

  // Redirect users to their regional domain if not already there
  if (!hostname?.includes(`${userRegion}.works`)) {
    return NextResponse.redirect(
      `https://${userRegion}.works${req.nextUrl.pathname}`
    );
  }

  return NextResponse.next();
}

function determineUserRegion(geo: any): string {
  const city = geo?.city?.toLowerCase();
  const region = geo?.region?.toLowerCase();

  // Sacramento area
  if (
    city?.includes('sacramento') ||
    city?.includes('roseville') ||
    city?.includes('folsom')
  ) {
    return '916';
  }

  // East Bay
  if (
    city?.includes('oakland') ||
    city?.includes('berkeley') ||
    city?.includes('fremont')
  ) {
    return '510';
  }

  // Fresno area
  if (
    city?.includes('fresno') ||
    city?.includes('clovis') ||
    city?.includes('madera')
  ) {
    return '559';
  }

  // Default to Central Valley
  return '209';
}
```

#### Caching Strategy

```typescript
// lib/cache/regional-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class RegionalCache {
  private getKey(region: string, type: string, id?: string): string {
    return `${region}:${type}${id ? `:${id}` : ''}`;
  }

  async getJobs(region: string, filters?: any): Promise<any[]> {
    const key = this.getKey(region, 'jobs', JSON.stringify(filters));
    const cached = await redis.get(key);

    if (cached) return cached as any[];

    // Fetch from database and cache
    const jobs = await this.fetchJobsFromDB(region, filters);
    await redis.setex(key, 300, jobs); // 5 minute cache

    return jobs;
  }

  async invalidateRegion(region: string): Promise<void> {
    const pattern = `${region}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### Database Optimization

#### Regional Query Optimization

```typescript
// lib/database/regional-queries.ts
import { PrismaClient } from '@prisma/client';

export class RegionalQueries {
  constructor(private prisma: PrismaClient) {}

  async getRegionalJobs(region: string, options: JobSearchOptions) {
    return this.prisma.job.findMany({
      where: {
        region,
        ...this.buildJobFilters(options),
      },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
            verified: true,
          },
        },
      },
      orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
    });
  }

  async getRegionalStats(region: string) {
    const [totalJobs, activeEmployers, recentJobs] = await Promise.all([
      this.prisma.job.count({ where: { region } }),
      this.prisma.job.groupBy({
        by: ['companyId'],
        where: { region },
        _count: true,
      }),
      this.prisma.job.count({
        where: {
          region,
          postedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalJobs,
      activeEmployers: activeEmployers.length,
      recentJobs,
    };
  }
}
```

## Security Considerations

### Domain Security

```typescript
// middleware/security.ts
import { NextRequest, NextResponse } from 'next/server';

export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // HSTS for all .works domains
  if (request.nextUrl.hostname.endsWith('.works')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // CSP for regional domains
  const csp = buildCSP(request.nextUrl.hostname);
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

function buildCSP(hostname: string): string {
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.vercel.com",
  ];

  return baseCSP.join('; ');
}
```

### Cross-Domain Authentication

```typescript
// lib/auth/regional-auth.ts
import { NextAuthOptions } from 'next-auth';

export function getRegionalAuthConfig(region: string): NextAuthOptions {
  return {
    ...baseAuthConfig,
    cookies: {
      sessionToken: {
        name: `${region}.works-session-token`,
        options: {
          domain: `.${region}.works`,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
    callbacks: {
      ...baseAuthConfig.callbacks,
      session: async ({ session, token }) => {
        // Add regional context to session
        return {
          ...session,
          region,
          user: {
            ...session.user,
            preferredRegions: token.preferredRegions || [region],
          },
        };
      },
    },
  };
}
```

## Monitoring and Analytics

### Regional Analytics Setup

```typescript
// lib/analytics/regional-tracking.ts
export class RegionalAnalytics {
  private region: string;

  constructor(region: string) {
    this.region = region;
  }

  trackJobView(jobId: string, userId?: string) {
    // Track job views by region
    this.track('job_view', {
      job_id: jobId,
      region: this.region,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  trackJobApplication(jobId: string, userId: string) {
    // Track applications by region
    this.track('job_application', {
      job_id: jobId,
      region: this.region,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  trackRegionalSearch(query: string, filters: any) {
    // Track search patterns by region
    this.track('regional_search', {
      query,
      filters,
      region: this.region,
      timestamp: new Date().toISOString(),
    });
  }

  private track(event: string, data: any) {
    // Send to analytics service (e.g., PostHog, Mixpanel)
    if (typeof window !== 'undefined') {
      window.gtag?.('event', event, {
        custom_parameter_region: this.region,
        ...data,
      });
    }
  }
}
```

### Health Monitoring

```typescript
// api/health/regional.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { RegionalQueries } from '@/lib/database/regional-queries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const region = req.query.region as string;

  try {
    const queries = new RegionalQueries(prisma);
    const stats = await queries.getRegionalStats(region);

    const health = {
      region,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        totalJobs: stats.totalJobs,
        activeEmployers: stats.activeEmployers,
        recentJobs: stats.recentJobs,
        responseTime: Date.now() - startTime,
      },
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      region,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)

- [ ] Register all .works domains
- [ ] Set up DNS and SSL certificates
- [ ] Implement basic domain routing
- [ ] Create regional configuration system
- [ ] Set up 301 redirects from 209jobs.com

### Phase 2: Core Migration (Weeks 3-4)

- [ ] Implement regional context system
- [ ] Update database schema with regional data
- [ ] Migrate existing job data to regional structure
- [ ] Implement regional SEO components
- [ ] Deploy 209.works with full functionality

### Phase 3: Multi-Domain Expansion (Weeks 5-6)

- [ ] Launch 916.works and 510.works
- [ ] Implement regional caching strategy
- [ ] Set up regional analytics tracking
- [ ] Create regional sitemaps
- [ ] Implement cross-domain authentication

### Phase 4: Content Hub and Optimization (Weeks 7-8)

- [ ] Launch norcal.works content hub
- [ ] Launch 559.works
- [ ] Implement advanced regional features
- [ ] Optimize performance and caching
- [ ] Complete SEO migration and monitoring

### Phase 5: Testing and Launch (Weeks 9-10)

- [ ] Comprehensive testing across all domains
- [ ] Performance optimization
- [ ] Security audit and penetration testing
- [ ] User acceptance testing
- [ ] Full production launch

## Risk Mitigation

### Technical Risks

- **SEO Impact:** Gradual migration with proper redirects and monitoring
- **Performance Issues:** Comprehensive caching and edge optimization
- **Security Vulnerabilities:** Regular security audits and updates
- **Data Loss:** Comprehensive backup and rollback procedures

### Operational Risks

- **User Confusion:** Clear communication and gradual transition
- **Service Disruption:** Blue-green deployment strategy
- **Regional Failures:** Isolated regional deployments with fallbacks
- **Monitoring Gaps:** Comprehensive health checks and alerting

## Success Metrics

### Technical Metrics

- **Page Load Time:** < 2 seconds for all regions
- **Uptime:** 99.9% availability across all domains
- **SEO Performance:** Maintain or improve search rankings
- **Cache Hit Rate:** > 80% for regional content

### Business Metrics

- **User Retention:** Maintain 95% user retention during migration
- **Regional Engagement:** Increase regional job applications by 25%
- **Search Performance:** Improve regional search rankings by 30%
- **Cross-Domain Usage:** 15% of users explore multiple regions

## Conclusion

This technical implementation plan provides a comprehensive roadmap for migrating from 209jobs.com to the .works ecosystem. The phased approach minimizes risk while establishing a robust foundation for regional expansion and enhanced user experience.

The multi-domain architecture enables regional customization while maintaining operational efficiency through shared infrastructure and data systems. This foundation positions the platform for sustainable growth and market leadership across Northern California.
