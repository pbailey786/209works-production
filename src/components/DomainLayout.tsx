'use client';

import React from 'react';
import { useDomain } from '@/lib/domain/context';
import Image from 'next/image';
import Link from 'next/link';

interface DomainLayoutProps {
  children: React.ReactNode;
}

export function DomainLayout({ children }: DomainLayoutProps) {
  const { config, isLoading } = useDomain();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="min-h-screen"
      style={
        {
          '--primary-color': config.branding.primaryColor,
          '--accent-color': config.branding.accentColor,
        } as React.CSSProperties
      }
    >
      <header className="border-b bg-white shadow-sm" role="banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={config.branding.logoPath}
                  alt={`${config.displayName} Logo`}
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                  onError={e => {
                    // Fallback to default logo if domain-specific logo doesn't exist
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <span
                  className="text-xl font-bold"
                  style={{ color: config.branding.primaryColor }}
                >
                  {config.displayName}
                </span>
              </Link>
            </div>

            <nav
              className="hidden space-x-8 md:flex"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link
                href="/jobs"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                style={
                  {
                    '--hover-color': config.branding.primaryColor,
                  } as React.CSSProperties
                }
              >
                Find Jobs
              </Link>
              <Link
                href="/employers"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                For Employers
              </Link>
              <Link
                href="/about"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main role="main">{children}</main>

      <footer className="border-t bg-gray-50" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center space-x-2">
                <Image
                  src={config.branding.logoPath}
                  alt={`${config.displayName} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={e => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <span
                  className="text-lg font-bold"
                  style={{ color: config.branding.primaryColor }}
                >
                  {config.displayName}
                </span>
              </div>
              <p className="mb-4 text-gray-600">
                {config.description} - Connecting local talent with
                opportunities in {config.region}.
              </p>
              <div className="flex space-x-4">
                <nav className="flex space-x-4" aria-label="Social media links">
                  {config.social.facebook && (
                    <a
                      href={config.social.facebook}
                      className="text-gray-400 hover:text-gray-500"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow ${config.displayName} on Facebook`}
                    >
                      Facebook
                    </a>
                  )}
                  {config.social.instagram && (
                    <a
                      href={config.social.instagram}
                      className="text-gray-400 hover:text-gray-500"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow ${config.displayName} on Instagram`}
                    >
                      Instagram
                    </a>
                  )}
                  {config.social.twitter && (
                    <a
                      href={`https://twitter.com/${config.social.twitter.replace('@', '')}`}
                      className="text-gray-400 hover:text-gray-500"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow ${config.displayName} on Twitter`}
                    >
                      Twitter
                    </a>
                  )}
                </nav>
              </div>
            </div>

            <nav aria-label="Job seeker links">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Job Seekers
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/jobs"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Create Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Job Alerts
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Employer links">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Employers
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/employers/create-job-post"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/employers/pricing"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/employers/contact"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Contact Sales
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="text-sm text-gray-400">
                © 2024 {config.displayName}. All rights reserved.
              </p>
              <nav
                className="mt-4 flex space-x-6 md:mt-0"
                aria-label="Legal links"
              >
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 hover:text-gray-500"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 hover:text-gray-500"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 hover:text-gray-500"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Domain-aware hero section component
export function DomainHero() {
  const { config } = useDomain();

  return (
    <div
      className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 text-white"
      style={{
        background: `linear-gradient(to right, ${config.branding.primaryColor}, ${config.branding.accentColor})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          Find Your Next Job in {config.region}
        </h1>
        <p className="mb-8 text-xl opacity-90 md:text-2xl">
          Discover opportunities in {config.cities.slice(0, 3).join(', ')} and
          beyond
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/jobs"
            className="rounded-lg bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Browse Jobs
          </Link>
          <Link
            href="/employers/create-job-post"
            className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-gray-900"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </div>
  );
}
