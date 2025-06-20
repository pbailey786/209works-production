'use client';

import { useUser } from '@clerk/nextjs';
import { useDomain } from '@/lib/domain/context';
import Link from 'next/link';
import DomainAwareHeader from '@/components/layout/DomainAwareHeader';
import DomainAwareFooter from '@/components/layout/DomainAwareFooter';

export default function HomePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { config, isLoading: isDomainLoading } = useDomain();

  if (isDomainLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DomainAwareHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DomainAwareHeader />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="text-center">
            <h1 className="hero-title mb-6">
              {config.displayName.toUpperCase()}
            </h1>
            <p className="hero-subtitle mb-8">
              Built for the {config.areaCode}. Made for the people who work here.
              Find your next opportunity in {config.region}.
            </p>

            {!isLoaded && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground"></div>
              </div>
            )}

            {isLoaded && !isSignedIn && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up" className="btn-accent px-8 py-4 text-lg">
                  Get Started
                </Link>
                <Link href="/sign-in" className="btn-outline px-8 py-4 text-lg">
                  Sign In
                </Link>
              </div>
            )}

            {isLoaded && isSignedIn && (
              <div className="space-y-4">
                <p className="text-xl opacity-90">
                  Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
                </p>
                <Link href="/dashboard" className="btn-accent px-8 py-4 text-lg">
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Why Choose {config.displayName}?</h2>
            <p className="body-large max-w-2xl mx-auto">
              We're focused exclusively on {config.region}, connecting local talent
              with local opportunities in {config.cities.slice(0, 3).join(', ')} and surrounding areas.
            </p>
          </div>

          <div className="grid-3">
            <div className="feature-card text-center">
              <div className="feature-icon mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="heading-4 mb-2">Local Focus</h3>
              <p className="body">
                Every job is in the {config.areaCode} area code. No remote work, no out-of-state positions.
                Just local opportunities for local people in {config.region}.
              </p>
            </div>

            <div className="feature-card text-center">
              <div className="feature-icon mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="heading-4 mb-2">JobsGPT</h3>
              <p className="body">
                Chat with our AI assistant to find jobs that match your skills and preferences.
                It's like texting a friend who knows every job in {config.region}.
              </p>
            </div>

            <div className="feature-card text-center">
              <div className="feature-icon mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="heading-4 mb-2">Fast & Simple</h3>
              <p className="body">
                No complicated forms or endless scrolling. Find what you're looking for
                quickly and apply with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="text-center">
            <h2 className="heading-2 mb-4 text-secondary-foreground">
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="body-large mb-8 text-secondary-foreground/80 max-w-2xl mx-auto">
              Join hundreds of job seekers and employers who are already using {config.displayName}
              to connect with local opportunities in {config.region}.
            </p>

            {!isSignedIn && (
              <Link href="/sign-up" className="btn-primary px-8 py-4 text-lg">
                Get Started Today
              </Link>
            )}

            {isSignedIn && (
              <Link href="/jobs" className="btn-primary px-8 py-4 text-lg">
                Browse Jobs
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <DomainAwareFooter />
    </div>
  );
}
