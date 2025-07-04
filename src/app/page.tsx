/**
 * Phase 1 Simplified Homepage with AI Chat Search
 * 
 * A minimal, fast-loading version of the homepage with AI-powered job search
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, Heart, Shield, Zap, Briefcase } from 'lucide-react';
import HomepageChat from '@/components/HomepageChat';
import AISearchTeaser from '@/components/homepage/AISearchTeaser';
import SocialProofSection from '@/components/homepage/SocialProofSection';
import { FEATURES } from '@/lib/feature-flags';

export default function HomeSimple() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || 'jobs in the 209 area';
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  const handleQuickSearch = (suggestion: string) => {
    router.push(`/chat?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Apple-style Hero Section */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Hero Icon */}
            <div className="mx-auto mb-12 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl">
              <Briefcase className="h-16 w-16 text-white" />
            </div>
            
            {/* Headline */}
            <div className="mb-12">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
                209 Jobs.
                <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  209 People.
                </span>
              </h1>
              <p className="mx-auto max-w-4xl text-xl font-medium text-gray-600 sm:text-2xl">
                No Bay Area commute. No LA competition.
                <span className="block text-blue-600">Just local jobs for local people.</span>
              </p>
            </div>

            {/* AI Search Teaser - Redirects to /chat */}
            {FEATURES.AI_CHAT ? (
              <div className="mx-auto mb-12">
                <AISearchTeaser />
              </div>
            ) : (
              /* Fallback to regular search if AI is disabled */
              <div className="mx-auto mb-12 max-w-3xl">
                <form onSubmit={handleSearch} className="relative">
                  <div className="rounded-3xl border border-gray-200/60 bg-white/90 p-3 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="What kind of work are you looking for?"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-4 pl-14 pr-6 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        type="submit"
                        className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105"
                      >
                        <span>Search Jobs</span>
                        <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  </div>
                </form>

                {/* Apple-style Quick Search Suggestions */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {[
                    'Healthcare Jobs',
                    'Warehouse & Logistics', 
                    'Customer Service',
                    'Manufacturing'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleQuickSearch(suggestion)}
                      className="rounded-full border-2 border-gray-200 bg-white/80 px-6 py-2 font-medium text-gray-700 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apple-style CTA Button */}
            <Link
              href="/chat"
              className="group inline-flex items-center gap-4 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 px-12 py-6 text-xl font-bold text-white shadow-2xl transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-3xl hover:scale-105"
            >
              <span>Explore Jobs</span>
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section with Real Data */}
      <SocialProofSection />

      {/* Apple-style Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Stop Competing with the Whole World
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Built for the Central Valley, by people who live here too.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-gray-200/60 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">Actually Local</h3>
              <p className="text-gray-600">
                Every job is within driving distance. No San Francisco startups or remote-only bait and switch.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-gray-200/60 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">AI That Gets It</h3>
              <p className="text-gray-600">
                JobsGPT knows the difference between Stockton and San Jose. Search like you talk.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-gray-200/60 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">No Resume Upload</h3>
              <p className="text-gray-600">
                Most employers want to meet you, not read 10 pages. Apply with contact info and let them call.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-3xl border border-gray-200/60 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">Your Neighbors</h3>
              <p className="text-gray-600">
                Work with people you might run into at the grocery store. Build your local network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 py-16 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <span className="text-xl font-bold text-white">209</span>
                </div>
                <span className="text-2xl font-bold">209 Works</span>
              </div>
              <p className="text-lg text-gray-300">
                Your local job platform for the Central Valley. Built for people who work hard.
              </p>
            </div>
            
            <div>
              <h4 className="mb-6 text-xl font-bold">Job Seekers</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link 
                    href="/chat" 
                    className="group inline-flex items-center rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Browse Jobs
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="group inline-flex items-center rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Get Help
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-6 text-xl font-bold">Employers</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link 
                    href="/employers" 
                    className="group inline-flex items-center rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Post a Job
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="group inline-flex items-center rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-gray-700/50 pt-8 text-center">
            <p className="text-lg text-gray-400">
              &copy; 2025 209 Works. Built for the 209.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}