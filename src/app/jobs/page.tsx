'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobsPage() {
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
              <Link href="/jobs" className="text-primary font-medium">Jobs</Link>
              <Link href="/employers" className="text-gray-700 hover:text-primary">Employers</Link>
              <Link href="/sign-in" className="text-gray-700 hover:text-primary">Sign In</Link>
              <Link href="/sign-up" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Local Jobs in the {domainConfig.areaCode}
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Discover opportunities in {domainConfig.region}. Every job is local, every opportunity is real.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="City or zip code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
                  Search Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JobsGPT Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Try JobsGPT - AI-Powered Job Search
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Chat with our AI assistant to find jobs that match your skills and preferences.
                It's like having a personal career advisor who knows every job in {domainConfig.region}.
              </p>
              <Link href="/chat" className="bg-primary text-white px-8 py-4 text-lg rounded-md hover:bg-primary/90 transition-colors inline-block">
                Start Chatting with JobsGPT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Job Categories in {domainConfig.region}
            </h2>
            <p className="text-lg text-gray-600">
              Explore opportunities across different industries and skill levels
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Healthcare', count: '150+', icon: '🏥' },
              { name: 'Retail', count: '200+', icon: '🛍️' },
              { name: 'Manufacturing', count: '120+', icon: '🏭' },
              { name: 'Education', count: '80+', icon: '📚' },
              { name: 'Food Service', count: '180+', icon: '🍽️' },
              { name: 'Construction', count: '90+', icon: '🔨' },
              { name: 'Transportation', count: '110+', icon: '🚛' },
              { name: 'Office & Admin', count: '140+', icon: '💼' }
            ].map((category) => (
              <div key={category.name} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} jobs available</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Next Job?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of job seekers who have found their perfect match in {domainConfig.region}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="bg-white text-primary px-8 py-4 text-lg rounded-md hover:bg-gray-100 transition-colors">
              Create Your Profile
            </Link>
            <Link href="/chat" className="border border-white text-white px-8 py-4 text-lg rounded-md hover:bg-white/10 transition-colors">
              Chat with JobsGPT
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}