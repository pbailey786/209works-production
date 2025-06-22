'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobsPage() {
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
              <Link href="/jobs" className="font-medium text-primary">
                Jobs
              </Link>
              <Link
                href="/employers"
                className="text-gray-700 hover:text-primary"
              >
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
      <section className="from-primary/5 to-primary/10 bg-gradient-to-br py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Find Local Jobs in the {domainConfig.areaCode}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-700">
              Discover opportunities in {domainConfig.region}. Every job is
              local, every opportunity is real.
            </p>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="City or zip code"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button className="hover:bg-primary/90 rounded-md bg-primary px-8 py-3 font-medium text-white transition-colors">
                  Search Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JobsGPT Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="from-primary/10 to-secondary/10 rounded-lg bg-gradient-to-r p-8 text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Try JobsGPT - AI-Powered Job Search
              </h2>
              <p className="mb-6 text-lg text-gray-700">
                Chat with our AI assistant to find jobs that match your skills
                and preferences. It's like having a personal career advisor who
                knows every job in {domainConfig.region}.
              </p>
              <Link
                href="/chat"
                className="hover:bg-primary/90 inline-block rounded-md bg-primary px-8 py-4 text-lg text-white transition-colors"
              >
                Start Chatting with JobsGPT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Popular Job Categories in {domainConfig.region}
            </h2>
            <p className="text-lg text-gray-600">
              Explore opportunities across different industries and skill levels
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[
              { name: 'Healthcare', count: '150+', icon: '🏥' },
              { name: 'Retail', count: '200+', icon: '🛍️' },
              { name: 'Manufacturing', count: '120+', icon: '🏭' },
              { name: 'Education', count: '80+', icon: '📚' },
              { name: 'Food Service', count: '180+', icon: '🍽️' },
              { name: 'Construction', count: '90+', icon: '🔨' },
              { name: 'Transportation', count: '110+', icon: '🚛' },
              { name: 'Office & Admin', count: '140+', icon: '💼' },
            ].map(category => (
              <div
                key={category.name}
                className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{category.icon}</div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.count} jobs available
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to Find Your Next Job?
          </h2>
          <p className="mb-8 text-xl opacity-90">
            Join thousands of job seekers who have found their perfect match in{' '}
            {domainConfig.region}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-md bg-white px-8 py-4 text-lg text-primary transition-colors hover:bg-gray-100"
            >
              Create Your Profile
            </Link>
            <Link
              href="/chat"
              className="rounded-md border border-white px-8 py-4 text-lg text-white transition-colors hover:bg-white/10"
            >
              Chat with JobsGPT
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
