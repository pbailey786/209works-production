'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {domainConfig.areaCode}
                </span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {domainConfig.displayName}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Local jobs in the {domainConfig.region}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-700 hover:text-primary">
                Jobs
              </Link>
              <Link
                href="/employers"
                className="text-gray-700 hover:text-primary"
              >
                Employers
              </Link>
              <Link href="/dashboard" className="font-medium text-primary">
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-primary"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage your job search and applications in {domainConfig.region}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Link
            href="/jobs"
            className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="h-6 w-6 text-primary"
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
              <div>
                <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                <p className="text-sm text-gray-600">Find new opportunities</p>
              </div>
            </div>
          </Link>

          <Link
            href="/chat"
            className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">JobsGPT</h3>
                <p className="text-sm text-gray-600">AI job search assistant</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile/applications"
            className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Applications</h3>
                <p className="text-sm text-gray-600">Track your progress</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile/saved"
            className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Saved Jobs</h3>
                <p className="text-sm text-gray-600">Your favorites</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Applications
              </h2>
            </div>
            <div className="p-6">
              <div className="py-8 text-center">
                <svg
                  className="mx-auto mb-4 h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mb-4 text-gray-600">No applications yet</p>
                <Link
                  href="/jobs"
                  className="hover:text-primary/80 font-medium text-primary"
                >
                  Start browsing jobs →
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recommended Jobs
              </h2>
            </div>
            <div className="p-6">
              <div className="py-8 text-center">
                <svg
                  className="mx-auto mb-4 h-12 w-12 text-gray-400"
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
                <p className="mb-4 text-gray-600">
                  Complete your profile to get personalized recommendations
                </p>
                <Link
                  href="/profile/setup"
                  className="hover:text-primary/80 font-medium text-primary"
                >
                  Complete profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
