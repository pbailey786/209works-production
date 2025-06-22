'use client';

// Force deployment - Fixed styling and content for all major pages
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  // Handle case when Clerk is not available (during build)
  let isSignedIn = false;
  let user = null;
  let isLoaded = true;

  try {
    const clerkData = useUser();
    isSignedIn = clerkData.isSignedIn || false;
    user = clerkData.user;
    isLoaded = clerkData.isLoaded;
  } catch (error) {
    // Clerk not available, use defaults
    console.log('Clerk not available, using defaults');
  }
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
    cities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi']
  });

  useEffect(() => {
    // Get domain config from headers if available
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
        cities: ['Sacramento', 'Elk Grove', 'Roseville', 'Folsom', 'Davis']
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
        cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Richmond']
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley',
        cities: ['Concord', 'Walnut Creek', 'Pleasanton', 'Livermore', 'Antioch']
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno',
        cities: ['Fresno', 'Visalia', 'Clovis', 'Madera']
      });
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

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
              {!isSignedIn ? (
                <>
                  <Link href="/sign-in" className="text-gray-700 hover:text-primary">Sign In</Link>
                  <Link href="/sign-up" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                    Get Started
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {domainConfig.areaCode.toUpperCase()} WORKS
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Built for the {domainConfig.areaCode}. Made for the people who work here.
              Find your next opportunity in {domainConfig.region}.
            </p>

            {!isLoaded && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {isLoaded && !isSignedIn && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up" className="bg-primary text-white px-8 py-4 text-lg rounded-md hover:bg-primary/90 transition-colors">
                  Get Started
                </Link>
                <Link href="/sign-in" className="border border-primary text-primary px-8 py-4 text-lg rounded-md hover:bg-primary/5 transition-colors">
                  Sign In
                </Link>
              </div>
            )}

            {isLoaded && isSignedIn && (
              <div className="space-y-4">
                <p className="text-xl text-gray-700">
                  Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
                </p>
                <Link href="/dashboard" className="inline-block bg-primary text-white px-8 py-4 text-lg rounded-md hover:bg-primary/90 transition-colors">
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose {domainConfig.displayName}?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're focused exclusively on {domainConfig.region}, connecting local talent
              with local opportunities in {domainConfig.cities.slice(0, 3).join(', ')} and surrounding areas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Local Focus</h3>
              <p className="text-gray-600">
                Every job is in the {domainConfig.areaCode} area code. No remote work, no out-of-state positions.
                Just local opportunities for local people in {domainConfig.region}.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">JobsGPT</h3>
              <p className="text-gray-600">
                Chat with our AI assistant to find jobs that match your skills and preferences.
                It's like texting a friend who knows every job in {domainConfig.region}.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast & Simple</h3>
              <p className="text-gray-600">
                No complicated forms or endless scrolling. Find what you're looking for
                quickly and apply with confidence.
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
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join hundreds of job seekers and employers who are already using {domainConfig.displayName} to
              connect with local opportunities in {domainConfig.region}.
            </p>

            {!isSignedIn && (
              <Link href="/sign-up" className="bg-white text-primary px-8 py-4 text-lg rounded-md hover:bg-gray-100 transition-colors inline-block">
                Get Started Today
              </Link>
            )}

            {isSignedIn && (
              <Link href="/jobs" className="bg-white text-primary px-8 py-4 text-lg rounded-md hover:bg-gray-100 transition-colors inline-block">
                Browse Jobs
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl font-bold text-primary">{domainConfig.areaCode}</span>
                <div>
                  <h3 className="text-lg font-bold">{domainConfig.displayName}</h3>
                  <p className="text-sm text-gray-400">Local jobs in the {domainConfig.region}</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Serving {domainConfig.region}<br />
                {domainConfig.cities.join(' • ')}<br />
                {domainConfig.region} Focus
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link href="/jobs?chat=true" className="hover:text-white transition-colors">JobsGPT Chat</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Career Resources</Link></li>
                <li><Link href="/resume" className="hover:text-white transition-colors">Resume Builder</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/employers/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link href="/employers/dashboard" className="hover:text-white transition-colors">Employer Dashboard</Link></li>
                <li><Link href="/employers/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/employers/success" className="hover:text-white transition-colors">Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>

              <h5 className="text-md font-semibold mt-6 mb-2">Other Regions</h5>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>209 Works (Current)</li>
                <li><Link href="https://916.works" className="hover:text-white transition-colors">916 Works</Link></li>
                <li><Link href="https://510.works" className="hover:text-white transition-colors">510 Works</Link></li>
                <li><Link href="https://925.works" className="hover:text-white transition-colors">925 Works</Link></li>
                <li><Link href="https://559.works" className="hover:text-white transition-colors">559 Works</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 {domainConfig.displayName}. All rights reserved.<br />
              Built for the {domainConfig.areaCode}. Made for the people who work here.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}