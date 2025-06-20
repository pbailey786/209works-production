import React, { useState, useEffect } from '@/components/ui/card';
import { useRouter } from '@/components/ui/card';
import { useUser, useAuth } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/components/ui/card';
import { LazyOnVisible } from '@/components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

'use client';

import {
  import {
  MapPin,
  Users,
  Building2,
  TrendingUp,
  Heart,
  Search,
  ArrowRight,
  Star,
  CheckCircle,
  Briefcase,
  Clock,
  Shield,
  Zap
} from 'lucide-react';


// Lazy load heavy components
const Analytics = React.lazy(() => import('../components/Analytics'));
const Footer = React.lazy(() => import('../components/Footer'));

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  // Debug Clerk auth state
  console.log('🏠 Homepage - Is signed in:', isSignedIn);
  console.log('🏠 Homepage - User:', user);
  console.log('🏠 Homepage - Is loaded:', isLoaded);

  const handleSearch = (query: string) => {
    setLoading(true);

    // Use the actual query or default to general search
    const searchQuery = query.trim() || 'jobs in the 209 area';

    // Track search event for analytics
    if (typeof window !== 'undefined' && window.trackJobSearch) {
      window.trackJobSearch(searchQuery, '209 Area');
    }

    // Navigate to JobsGPT chat with the query (jobs page has the chat functionality)
    router.push(`/jobs?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <SEOHead />
      <React.Suspense fallback={null}>
        <Analytics />
      </React.Suspense>

      {/* Hero Section - Dark Green Background like Wise */}
      <section className="relative overflow-hidden bg-[#2d4a3e] px-4 py-20">
        <div className="relative mx-auto max-w-6xl text-center">
          {/* Dynamic Headlines Component */}
          <DynamicHeroHeadlines />

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
              <div className="mx-auto max-w-2xl">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const query = formData.get('search') as string;
                    handleSearch(query?.trim() || '');
                  }}
                  className="relative"
                >
                  <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                          type="text"
                          name="search"
                          placeholder="What kind of work are you looking for?"
                          className="w-full rounded-lg border-0 py-3 pl-12 pr-4 text-lg placeholder-gray-400 focus:outline-none focus:ring-0"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-[#e55a2b]"
                      >
                        <span>Search with AI</span>
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
                    'Manufacturing',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => handleSearch(suggestion)}
                      className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-sm text-white transition-all duration-200 hover:border-white/50 hover:bg-white/30 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons - conditional based on auth status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              {status === 'authenticated' ? (
                // Authenticated user - show explore jobs
                <Link
                  href="/jobs"
                  className="inline-flex transform items-center gap-3 rounded-lg bg-[#ff6b35] px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#e55a2b]"
                >
                  <span>Explore Jobs</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                // Unauthenticated user - show sign up and sign in
                <>
                  <Link
                    href="/signup"
                    className="inline-flex transform items-center gap-3 rounded-lg bg-[#ff6b35] px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#e55a2b]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/signin"
                    className="inline-flex transform items-center gap-3 rounded-lg border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-white hover:text-[#2d4a3e]"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </motion.div>
        </div>
      </section>

      {/* Feature Cards Section - Like Wise's 4 cards */}
      <LazyOnVisible
        fallback={
          <section className="bg-gray-50 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="text-center">
                    <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
                    <Skeleton className="mb-4 h-6 w-32 mx-auto" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Local Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Heart className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                24/7 local support
              </h3>
              <p className="leading-relaxed text-gray-600">
                We're here to help. Get in touch with any questions about
                finding work in the 209.
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
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Verified employers
              </h3>
              <p className="leading-relaxed text-gray-600">
                Test your integrations before going live with real Central
                Valley businesses.
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
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Zap className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Quick applications
              </h3>
              <p className="leading-relaxed text-gray-600">
                Learn how to apply fast and make the most of our streamlined job
                platform.
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
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Briefcase className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Career tools
              </h3>
              <p className="leading-relaxed text-gray-600">
                Easily create and manage your professional profile and career
                journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      </LazyOnVisible>

      {/* Bottom Section with Visual - Like Wise's puzzle piece section */}
      <LazyOnVisible
        fallback={
          <section className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <Skeleton className="h-96 w-full rounded-2xl" />
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-12 w-48" />
                </div>
              </div>
            </div>
          </section>
        }
      >
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left side - Visual placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Placeholder for puzzle piece visual - you can replace with actual image */}
              <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 via-blue-100 to-green-100">
                <div className="text-center">
                  <Building2 className="mx-auto mb-4 h-24 w-24 text-[#2d4a3e]" />
                  <p className="font-medium text-gray-600">209 Area Visual</p>
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
              <h2 className="mb-8 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
                Built for the 209. Made for the people who work here.
              </h2>

              <div className="mb-8 space-y-6">
                <p className="text-lg leading-relaxed text-gray-600">
                  Tired of job boards packed with scams, spam, and "remote
                  opportunities" that are nowhere near you? 209 Works is a
                  local-first job platform built for Central Valley workers and
                  the businesses that actually hire them.
                </p>

                <p className="text-lg leading-relaxed text-gray-600">
                  Whether you're a warehouse worker in Stockton, a dental
                  assistant in Turlock, or a small business in Modesto trying to
                  grow your team — this platform was made for you.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    <span className="text-lg font-medium text-gray-700">
                      Find real local jobs.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <span className="text-lg font-medium text-gray-700">
                      Use AI tools to help you stand out.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <span className="text-lg font-medium text-gray-700">
                      Stay close to home.
                    </span>
                  </div>
                </div>

                <p className="text-lg font-medium leading-relaxed text-gray-600">
                  No corporate noise. No fees for job seekers. Just work, right
                  here in the 209.
                </p>
              </div>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-3 rounded-lg bg-[#ff6b35] px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-[#e55a2b]"
              >
                <span>Start Your Search</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      </LazyOnVisible>

      {/* Footer */}
      <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Footer />
      </React.Suspense>
    </>
  );
}
