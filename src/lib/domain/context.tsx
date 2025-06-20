'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  DomainConfig,
  getDomainConfig,
  DEFAULT_DOMAIN,
  DOMAIN_CONFIGS,
} from './config';

interface DomainContextType {
  config: DomainConfig;
  hostname: string;
  isLoading: boolean;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

interface DomainProviderProps {
  children: React.ReactNode;
  initialHostname?: string; // For SSR
}

export function DomainProvider({
  children,
  initialHostname,
}: DomainProviderProps) {
  const [hostname, setHostname] = useState(initialHostname || '');
  const [isLoading, setIsLoading] = useState(!initialHostname);

  useEffect(() => {
    if (typeof window !== 'undefined' && !initialHostname) {
      setHostname(window.location.hostname);
      setIsLoading(false);
    }
  }, [initialHostname]);

  const config = getDomainConfig(hostname);

  return (
    <DomainContext.Provider value={{ config, hostname, isLoading }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain(): DomainContextType {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}

// Hook for getting domain-specific URLs
export function useDomainUrls() {
  const { config } = useDomain();

  return {
    baseUrl: `https://${config.domain}`,
    jobUrl: (jobId: string) => `https://${config.domain}/jobs/${jobId}`,
    searchUrl: (query?: string) =>
      `https://${config.domain}/jobs${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    employerUrl: (path: string = '') =>
      `https://${config.domain}/employers${path}`,
    apiUrl: (endpoint: string) => `https://${config.domain}/api${endpoint}`,
    unsubscribeUrl: (token: string) =>
      `https://${config.domain}/api/email-alerts/unsubscribe?token=${token}`,
    manageAlertsUrl: () => `https://${config.domain}/dashboard/alerts`,
  };
}

// Server-side helper for getting domain config
export function getServerDomainConfig(request: Request): DomainConfig {
  const url = new URL(request.url);
  return getDomainConfig(url.hostname);
}

// Helper for generating domain-specific metadata
export function getDomainMetadata(hostname: string, path: string = '') {
  const config = getDomainConfig(hostname);
  const baseUrl = `https://${config.domain}`;

  return {
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords.join(', '),
    canonical: `${baseUrl}${path}`,
    ogImage: `${baseUrl}/og-images/${config.areaCode}-og.jpg`,
    siteName: config.displayName,
    twitterHandle: config.social.twitter,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.displayName,
      alternateName: `${config.areaCode} Jobs`,
      url: baseUrl,
      description: config.seo.description,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/jobs?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      sameAs: Object.values(config.social).filter(Boolean),
      publisher: {
        '@type': 'Organization',
        name: config.displayName,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}${config.branding.logoPath}`,
        },
      },
      audience: {
        '@type': 'Audience',
        geographicArea: {
          '@type': 'Place',
          name: config.region,
          containedInPlace: {
            '@type': 'Place',
            name: 'California, United States',
          },
        },
      },
    },
  };
}
