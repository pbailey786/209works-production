/**
 * Phase 1 Simplified Homepage
 * 
 * A minimal, fast-loading version of the homepage with only core functionality
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, Heart, Shield, Zap, Briefcase } from 'lucide-react';

export default function HomeSimple() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || 'jobs in the 209 area';
    router.push(`/jobs?q=${encodeURIComponent(query)}`);
  };

  const handleQuickSearch = (suggestion: string) => {
    router.push(`/jobs?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">209</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">209 Works</h1>
                <p className="text-sm text-gray-600">Central Valley Jobs</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/jobs" className="text-gray-700 hover:text-orange-600 font-medium">
                Find Jobs
              </Link>
              <Link href="/employers" className="text-gray-700 hover:text-orange-600 font-medium">
                Post Jobs
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-600 font-medium">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-orange-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Jobs for the 209.
              <span className="block text-orange-600">No Suits Required.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Built for the folks who work hard and don't mess around.
              <span className="text-orange-600 font-semibold"> Real jobs that hit close to home.</span>
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="bg-white rounded-xl border-2 border-orange-200 p-2 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="What kind of work are you looking for?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-lg border-0 rounded-lg focus:outline-none focus:ring-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Search Jobs</span>
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Search Suggestions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                'Healthcare Jobs',
                'Warehouse & Logistics', 
                'Customer Service',
                'Manufacturing'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleQuickSearch(suggestion)}
                  className="bg-white/70 border border-orange-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-white hover:border-orange-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-3 bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            <span>Explore Jobs</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Local Support</h3>
              <p className="text-gray-600">
                We're here to help. Get in touch with any questions about finding work in the 209.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Employers</h3>
              <p className="text-gray-600">
                Work with real Central Valley businesses that are actually hiring.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Applications</h3>
              <p className="text-gray-600">
                Apply fast with our streamlined job platform. No endless forms.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Career Tools</h3>
              <p className="text-gray-600">
                Build your profile and track your job search progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">209</span>
                </div>
                <span className="text-xl font-bold">209 Works</span>
              </div>
              <p className="text-gray-400">
                Your local job platform for the Central Valley. Built for people who work hard.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/contact" className="hover:text-white">Get Help</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/employers" className="hover:text-white">Post a Job</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 209 Works. Built for the 209.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}