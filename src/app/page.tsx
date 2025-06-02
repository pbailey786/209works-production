'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Building2, TrendingUp, Heart, Search, ArrowRight, Star, CheckCircle, Briefcase, Clock, Shield, Zap } from 'lucide-react';

import SEOHead from '../components/SEOHead';
import Analytics from '../components/Analytics';
import Footer from '../components/Footer';


export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (query: string) => {
    setLoading(true);

    // Track search event for analytics
    if (typeof window !== 'undefined' && window.trackJobSearch) {
      window.trackJobSearch(query, '209 Area');
    }

    // Navigate to JobsGPT chat with the query (jobs page has the chat functionality)
    router.push(`/jobs?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <SEOHead />
      <Analytics />

      {/* Hero Section - Dark Green Background like Wise */}
      <section className="bg-[#2d4a3e] py-20 px-4 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Headline - Wise Style */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#9fdf9f] mb-8 leading-tight tracking-tight uppercase font-inter">
              INTRODUCING THE 209 WORKS
              <br />
              <span className="text-white">PLATFORM</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with local employers, discover meaningful work, and
              build your career right here in the Central Valley.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="max-w-2xl mx-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch('jobs in 209 area'); }} className="relative">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 p-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="What kind of work are you looking for?"
                          className="w-full pl-12 pr-4 py-3 text-lg border-0 rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearch(e.currentTarget.value || 'jobs in 209 area');
                            }
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 justify-center"
                      >
                        <span>Search with AI</span>
                        <Search className="w-4 h-4" />
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
                      onClick={() => handleSearch(suggestion)}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 rounded-full text-sm text-white hover:text-white transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link
                href="/jobs"
                className="inline-flex items-center gap-3 bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
              >
                <span>Explore our jobs</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section - Like Wise's 4 cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1: Local Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">24/7 local support</h3>
              <p className="text-gray-600 leading-relaxed">
                We're here to help. Get in touch with any questions about finding work in the 209.
              </p>
            </motion.div>

            {/* Card 2: Verified Employers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Verified employers</h3>
              <p className="text-gray-600 leading-relaxed">
                Test your integrations before going live with real Central Valley businesses.
              </p>
            </motion.div>

            {/* Card 3: Quick Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick applications</h3>
              <p className="text-gray-600 leading-relaxed">
                Learn how to apply fast and make the most of our streamlined job platform.
              </p>
            </motion.div>

            {/* Card 4: Career Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Career tools</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily create and manage your professional profile and career journey.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Bottom Section with Visual - Like Wise's puzzle piece section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left side - Visual placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Placeholder for puzzle piece visual - you can replace with actual image */}
              <div className="w-full h-96 bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-24 h-24 text-[#2d4a3e] mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">209 Area Visual</p>
                </div>
              </div>
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Built for the 209. Made for the people who work here.
              </h2>

              <div className="space-y-6 mb-8">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Tired of job boards packed with scams, spam, and "remote opportunities" that are nowhere near you?
                  209 Works is a local-first job platform built for Central Valley workers and the businesses that actually hire them.
                </p>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Whether you're a warehouse worker in Stockton, a dental assistant in Turlock, or a small business in Modesto trying to grow your team — this platform was made for you.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    <span className="text-lg font-medium text-gray-700">Find real local jobs.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <span className="text-lg font-medium text-gray-700">Use AI tools to help you stand out.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <span className="text-lg font-medium text-gray-700">Stay close to home.</span>
                  </div>
                </div>

                <p className="text-lg text-gray-600 leading-relaxed font-medium">
                  No corporate noise. No fees for job seekers. Just work, right here in the 209.
                </p>
              </div>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-3 bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
              >
                <span>Start Your Search</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
