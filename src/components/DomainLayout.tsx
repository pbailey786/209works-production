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
      style={{
        '--primary-color': config.branding.primaryColor,
        '--accent-color': config.branding.accentColor,
      } as React.CSSProperties}
    >
      <header className="bg-white shadow-sm border-b" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={config.branding.logoPath}
                  alt={`${config.displayName} Logo`}
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                  onError={(e) => {
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
            
            <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Main navigation">
              <Link 
                href="/jobs" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                style={{ 
                  '--hover-color': config.branding.primaryColor 
                } as React.CSSProperties}
              >
                Find Jobs
              </Link>
              <Link 
                href="/employers" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                For Employers
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main role="main">{children}</main>

      <footer className="bg-gray-50 border-t" role="contentinfo">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src={config.branding.logoPath}
                  alt={`${config.displayName} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={(e) => {
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
              <p className="text-gray-600 mb-4">
                {config.description} - Connecting local talent with opportunities in {config.region}.
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
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Job Seekers
              </h3>
              <ul className="space-y-2">
                <li><Link href="/jobs" className="text-gray-600 hover:text-gray-900">Browse Jobs</Link></li>
                <li><Link href="/profile" className="text-gray-600 hover:text-gray-900">Create Profile</Link></li>
                <li><Link href="/alerts" className="text-gray-600 hover:text-gray-900">Job Alerts</Link></li>
              </ul>
            </nav>
            
            <nav aria-label="Employer links">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Employers
              </h3>
              <ul className="space-y-2">
                <li><Link href="/employers/create-job-post" className="text-gray-600 hover:text-gray-900">Post a Job</Link></li>
                <li><Link href="/employers/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/employers/contact" className="text-gray-600 hover:text-gray-900">Contact Sales</Link></li>
              </ul>
            </nav>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 {config.displayName}. All rights reserved.
              </p>
              <nav className="flex space-x-6 mt-4 md:mt-0" aria-label="Legal links">
                <Link href="/privacy" className="text-gray-400 hover:text-gray-500 text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-gray-500 text-sm">
                  Terms of Service
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-gray-500 text-sm">
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
      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16"
      style={{
        background: `linear-gradient(to right, ${config.branding.primaryColor}, ${config.branding.accentColor})`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Find Your Next Job in {config.region}
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Discover opportunities in {config.cities.slice(0, 3).join(', ')} and beyond
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/jobs"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Browse Jobs
          </Link>
          <Link
            href="/employers/create-job-post"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </div>
  );
} 