/**
 * Regional Routing Utilities
 * Handles domain-based routing for regional .works domains
 */

import { NextRequest } from 'next/server';

export interface RegionalDomain {
  domain: string;
  region: string;
  name: string;
  isPrimary?: boolean;
}

export const REGIONAL_DOMAINS: RegionalDomain[] = [
  {
    domain: '209.works',
    region: '209',
    name: 'Central Valley',
    isPrimary: false
  },
  {
    domain: '916.works',
    region: '916',
    name: 'Sacramento Metro',
    isPrimary: false
  },
  {
    domain: '510.works',
    region: '510',
    name: 'East Bay',
    isPrimary: false
  },
  {
    domain: 'norcal.works',
    region: 'norcal',
    name: 'Northern California',
    isPrimary: false
  },
  {
    domain: '209jobs.com',
    region: 'all',
    name: 'All Regions',
    isPrimary: true
  }
];

/**
 * Get regional configuration from hostname
 */
export function getRegionFromHostname(hostname: string): RegionalDomain | null {
  // Remove www. prefix if present
  const cleanHostname = hostname.replace(/^www\./, '');
  
  return REGIONAL_DOMAINS.find(domain => 
    domain.domain === cleanHostname || 
    domain.domain === hostname
  ) || null;
}

/**
 * Check if a hostname is a regional domain
 */
export function isRegionalDomain(hostname: string): boolean {
  return getRegionFromHostname(hostname) !== null;
}

/**
 * Get the appropriate redirect URL for regional routing
 */
export function getRegionalRedirectUrl(request: NextRequest): string | null {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams.toString();
  
  const regionalConfig = getRegionFromHostname(hostname);
  
  if (!regionalConfig || regionalConfig.isPrimary) {
    return null; // No redirect needed for primary domain
  }

  // If already on a regional page, no redirect needed
  if (pathname.startsWith('/regional/')) {
    return null;
  }

  // Redirect to regional landing page
  const baseUrl = `${request.nextUrl.protocol}//${hostname}`;
  const queryString = searchParams ? `?${searchParams}` : '';
  
  // For root path, redirect to regional landing page
  if (pathname === '/') {
    return `${baseUrl}/regional/${regionalConfig.region}${queryString}`;
  }
  
  // For job searches, add regional filter
  if (pathname === '/jobs') {
    const params = new URLSearchParams(searchParams);
    if (!params.has('region')) {
      params.set('region', regionalConfig.region);
      return `${baseUrl}/jobs?${params.toString()}`;
    }
  }
  
  return null;
}

/**
 * Get canonical URL for SEO
 */
export function getCanonicalUrl(request: NextRequest): string {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const regionalConfig = getRegionFromHostname(hostname);
  
  if (regionalConfig && !regionalConfig.isPrimary) {
    // For regional domains, use the regional domain as canonical
    return `${request.nextUrl.protocol}//${hostname}${pathname}`;
  }
  
  // For primary domain, use primary domain as canonical
  const primaryDomain = REGIONAL_DOMAINS.find(d => d.isPrimary)?.domain || '209jobs.com';
  return `${request.nextUrl.protocol}//${primaryDomain}${pathname}`;
}

/**
 * Get regional metadata for SEO
 */
export function getRegionalMetadata(region: string) {
  const configs = {
    '209': {
      title: 'Central Valley Jobs | 209.works',
      description: 'Find jobs in California\'s Central Valley - Stockton, Modesto, Tracy, and surrounding areas.',
      keywords: ['Central Valley jobs', 'Stockton jobs', 'Modesto jobs', 'Tracy jobs'],
      ogImage: '/og-images/209-og.svg'
    },
    '916': {
      title: 'Sacramento Metro Jobs | 916.works',
      description: 'Discover career opportunities in Sacramento Metro - Sacramento, Elk Grove, Roseville, Folsom.',
      keywords: ['Sacramento jobs', 'Elk Grove jobs', 'Roseville jobs', 'government jobs'],
      ogImage: '/og-images/916-og.svg'
    },
    '510': {
      title: 'East Bay Jobs | 510.works',
      description: 'Explore job opportunities in the East Bay - Oakland, Berkeley, Fremont, Hayward.',
      keywords: ['East Bay jobs', 'Oakland jobs', 'Berkeley jobs', 'Bay Area jobs'],
      ogImage: '/og-images/510-og.svg'
    },
    'norcal': {
      title: 'Northern California Jobs | norcal.works',
      description: 'Your gateway to Northern California\'s diverse job market across all regions.',
      keywords: ['Northern California jobs', 'NorCal jobs', 'Bay Area jobs', 'California careers'],
      ogImage: '/og-images/norcal-og.svg'
    }
  };
  
  return configs[region as keyof typeof configs] || null;
}

/**
 * Generate structured data for regional pages
 */
export function generateRegionalStructuredData(region: string, hostname: string) {
  const metadata = getRegionalMetadata(region);
  if (!metadata) return null;
  
  const regionalConfig = REGIONAL_DOMAINS.find(d => d.region === region);
  if (!regionalConfig) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: metadata.title,
    description: metadata.description,
    url: `https://${hostname}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://${hostname}/jobs?q={search_term_string}&region=${region}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: '209jobs',
      url: 'https://209jobs.com'
    },
    about: {
      '@type': 'Place',
      name: regionalConfig.name,
      description: metadata.description
    }
  };
}

/**
 * Check if request should be handled by regional middleware
 */
export function shouldHandleRegionalRouting(request: NextRequest): boolean {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return false;
  }
  
  return isRegionalDomain(hostname);
} 