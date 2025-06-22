'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostAJobCTAProps {
  variant?: 'default' | 'compact' | 'banner';
  className?: string;
}

export default function PostAJobCTA({
  variant = 'default',
  className = ''
}: PostAJobCTAProps) {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley',
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno',
      });
    }
  }, []);

  if (variant === 'compact') {
    return (
      <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Hiring in the {domainConfig.areaCode}?
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Post your job and reach local talent
          </p>
          <Link
            href="/employers"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Post a Job
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-primary py-8 text-white ${className}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h3 className="text-xl font-bold">
                Ready to hire local talent?
              </h3>
              <p className="text-primary-foreground/80">
                Post your job on {domainConfig.displayName} and connect with qualified candidates in the {domainConfig.region}
              </p>
            </div>
            <Link
              href="/employers"
              className="rounded-md bg-white px-6 py-3 text-primary hover:bg-gray-100"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-8 ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">
          Hiring in the {domainConfig.region}?
        </h3>
        <p className="mb-6 text-lg text-gray-600">
          Post your job on {domainConfig.displayName} and reach thousands of local job seekers.
          Our AI-powered platform helps you find the right candidates faster.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/employers"
            className="rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90"
          >
            Post a Job
          </Link>
          <Link
            href="/employers/pricing"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            View Pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Starting at $50 • Local candidates only • AI optimization included
        </p>
      </div>
    </div>
  );
}
