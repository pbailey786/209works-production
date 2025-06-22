'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EmployersPage() {
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
              <Link href="/employers" className="font-medium text-primary">
                Employers
              </Link>
              <Link
                href="/sign-in"
                className="text-gray-700 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="from-primary/5 to-primary/10 bg-gradient-to-br py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Hire Local Talent in the {domainConfig.areaCode}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700 md:text-2xl">
              Connect with qualified candidates in {domainConfig.region}. Post
              jobs, find talent, and build your team locally.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/employers/post-job"
                className="hover:bg-primary/90 rounded-md bg-primary px-8 py-4 text-lg text-white transition-colors"
              >
                Post a Job
              </Link>
              <Link
                href="/employers/pricing"
                className="hover:bg-primary/5 rounded-md border border-primary px-8 py-4 text-lg text-primary transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Why Employers Choose {domainConfig.displayName}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              We make it easy to find and hire the best local talent in{' '}
              {domainConfig.region}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Local Focus
              </h3>
              <p className="text-gray-600">
                Every candidate is from the {domainConfig.areaCode} area. No
                remote workers, no out-of-state applicants. Just local talent
                ready to work in {domainConfig.region}.
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600">
                Our JobsGPT technology helps match your job postings with the
                most qualified candidates, saving you time and improving hire
                quality.
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Affordable Pricing
              </h3>
              <p className="text-gray-600">
                Simple, transparent pricing with no hidden fees. Pay only for
                what you need with our flexible credit system.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that works for your hiring needs
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Starter
              </h3>
              <div className="mb-4 text-3xl font-bold text-primary">$50</div>
              <p className="mb-6 text-gray-600">Perfect for small businesses</p>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  2 job postings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  30-day listings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Basic analytics
                </li>
              </ul>
              <Link
                href="/employers/checkout?plan=starter"
                className="hover:bg-primary/90 block w-full rounded-md bg-primary px-6 py-3 text-center text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="relative rounded-lg border border-primary bg-white p-8 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                <span className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
                  Most Popular
                </span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Standard
              </h3>
              <div className="mb-4 text-3xl font-bold text-primary">$99</div>
              <p className="mb-6 text-gray-600">Great for growing companies</p>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  5 job postings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  30-day listings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Featured listings
                </li>
              </ul>
              <Link
                href="/employers/checkout?plan=standard"
                className="hover:bg-primary/90 block w-full rounded-md bg-primary px-6 py-3 text-center text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Premium
              </h3>
              <div className="mb-4 text-3xl font-bold text-primary">$200</div>
              <p className="mb-6 text-gray-600">For high-volume hiring</p>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  10 job postings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  30-day listings
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Premium analytics
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  AI optimization
                </li>
              </ul>
              <Link
                href="/employers/checkout?plan=premium"
                className="hover:bg-primary/90 block w-full rounded-md bg-primary px-6 py-3 text-center text-white transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Find Your Next Great Hire?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
              Join hundreds of employers who are already using{' '}
              {domainConfig.displayName} to find qualified local talent in{' '}
              {domainConfig.region}.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/employers/post-job"
                className="rounded-md bg-white px-8 py-4 text-lg text-primary transition-colors hover:bg-gray-100"
              >
                Post Your First Job
              </Link>
              <Link
                href="/employers/dashboard"
                className="rounded-md border border-white px-8 py-4 text-lg text-white transition-colors hover:bg-white/10"
              >
                Employer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
