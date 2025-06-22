'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley'
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro'
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay'
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley'
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">{domainConfig.areaCode}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{domainConfig.displayName}</h1>
                  <p className="text-sm text-gray-600">Local jobs in the {domainConfig.region}</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-700 hover:text-primary">Jobs</Link>
              <Link href="/employers" className="text-gray-700 hover:text-primary">Employers</Link>
              <Link href="/about" className="text-primary font-medium">About</Link>
              <Link href="/sign-in" className="text-gray-700 hover:text-primary">Sign In</Link>
              <Link href="/sign-up" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About {domainConfig.displayName}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Built for the {domainConfig.areaCode}. Made for the people who work here.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600">
                Connecting local talent with local opportunities in {domainConfig.region}
              </p>
            </div>

            <div className="prose prose-lg mx-auto text-gray-700">
              <p className="text-xl leading-relaxed mb-6">
                {domainConfig.displayName} was created with a simple belief: the best jobs are local jobs.
                We're not interested in remote work or out-of-state positions. We focus exclusively on
                opportunities in the {domainConfig.areaCode} area code because we believe in the power
                of local communities.
              </p>

              <p className="text-lg leading-relaxed mb-6">
                Every job on our platform is within commuting distance. Every employer is a local business
                or organization. Every candidate lives and works in {domainConfig.region}. This isn't just
                our business model—it's our commitment to strengthening local economies and communities.
              </p>

              <p className="text-lg leading-relaxed">
                With our AI-powered JobsGPT assistant, we're making job searching more personal and
                effective than ever before. It's like having a career advisor who knows every opportunity
                in your area and understands exactly what you're looking for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600">
              What drives us every day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Local First</h3>
              <p className="text-gray-600">
                We believe the strongest communities are built when people work where they live.
                Every opportunity on our platform strengthens the local economy.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">People Focused</h3>
              <p className="text-gray-600">
                Technology should serve people, not the other way around. Our AI tools are designed
                to make job searching more human, not less.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple & Fast</h3>
              <p className="text-gray-600">
                Job searching shouldn't be complicated. We cut through the noise to help you
                find what you're looking for quickly and efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join the {domainConfig.areaCode} Community?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Whether you're looking for your next opportunity or your next great hire,
              we're here to help you succeed locally.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs" className="bg-white text-primary px-8 py-4 text-lg rounded-md hover:bg-gray-100 transition-colors">
                Find Jobs
              </Link>
              <Link href="/employers" className="border border-white text-white px-8 py-4 text-lg rounded-md hover:bg-white/10 transition-colors">
                Post Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}