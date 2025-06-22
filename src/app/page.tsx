'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Sparkles,
  Search,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

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
    cities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi'],
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    router.push(`/search?${params.toString()}`);
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Get domain config from headers if available
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
        cities: ['Sacramento', 'Elk Grove', 'Roseville', 'Folsom', 'Davis'],
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
        cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Richmond'],
      });
    }

    // Handle scroll effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loader-dots">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="particles-bg">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Modern Navigation with Glassmorphism */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          isScrolled ? 'glass-dark py-4' : 'py-6'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Bold Local Logo */}
            <Link href="/" className="group flex items-center space-x-4">
              <div className="logo-badge group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-black">
                  {domainConfig.areaCode}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground transition-colors duration-300 group-hover:text-primary logo-209">
                  {domainConfig.displayName}
                </h1>
                <p className="tagline-bold">
                  Rep the 209. Get Hired.
                </p>
              </div>
            </Link>

            {/* Enhanced Navigation */}
            <div className="hidden items-center space-x-6 lg:flex">
              <Link
                href="/jobs"
                className="nav-item text-foreground/80 hover:text-foreground group"
                title="👀 Find local gigs"
              >
                <Search className="h-4 w-4" />
                Find Jobs
              </Link>
              <Link
                href="/employers"
                className="nav-item text-foreground/80 hover:text-foreground group"
                title="📣 Post your opening"
              >
                <Briefcase className="h-4 w-4" />
                Post Jobs
              </Link>
              <Link
                href="/chat"
                className="nav-item text-foreground/80 hover:text-foreground group"
                title="🧠 Chat with JobsGPT"
              >
                <Sparkles className="h-4 w-4" />
                JobsGPT
              </Link>
              <Link
                href="/about"
                className="nav-item text-foreground/80 hover:text-foreground group"
                title="🏠 About the 209"
              >
                <Users className="h-4 w-4" />
                About
              </Link>

              {!isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Link href="/sign-in" className="btn-ghost">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="btn-primary animate-pulse-glow">
                    I Need a Job
                    <Zap className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <Link href="/dashboard" className="btn-primary">
                  My Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button className="btn-glass p-3">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Gradient Mesh */}
      <section className="hero-gradient relative flex min-h-screen items-center justify-center">
        {/* Geometric Shapes Background */}
        <div className="geometric-bg">
          <div
            className="shape shape-triangle"
            style={{ top: '10%', left: '10%' }}
          ></div>
          <div
            className="shape shape-square"
            style={{ top: '60%', right: '15%' }}
          ></div>
          <div
            className="shape shape-circle"
            style={{ bottom: '20%', left: '20%' }}
          ></div>
        </div>

        <div className="container relative z-10 py-32 text-center">
          {/* Animated Badge */}
          <div className="animate-fade-in-down mb-8 inline-flex items-center justify-center">
            <div className="badge-glass px-4 py-2">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Hyperlocal Job Platform for {domainConfig.region}
              </span>
            </div>
          </div>

          {/* Bold Local Title */}
          <h1 className="heading-1 animate-fade-in-up mb-6">
            <span className="block text-foreground font-black">
              Stop Scrolling. Start Working
            </span>
            <span className="text-gradient mt-2 block">
              — in the 209.
            </span>
          </h1>

          {/* Local Tagline */}
          <p className="animate-fade-in-up stagger-1 mx-auto mb-12 max-w-4xl text-xl text-foreground font-semibold md:text-2xl">
            Made for the homies who work hard and rep the 209.
            <span className="text-primary"> Let's get you hired.</span>
          </p>

          {/* Local AI Chat Interface */}
          <div className="animate-fade-in-up stagger-2 mx-auto mb-12 max-w-4xl">
            <div className="chat-container p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-glow">
                  🧠 JobsGPT - Your 209 Career Buddy
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-3">
                  What kind of work you looking for?
                </h3>
                <p className="text-lg text-muted-foreground font-medium">
                  Just ask like you're talking to a friend who knows every job in the Valley
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🛠️ 'Know any warehouse gigs in Stockton?' or 🏪 'Modesto retail work for weekends?'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="chat-input w-full pr-20 text-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-primary text-white p-4 rounded-full hover:scale-110 transition-all shadow-glow animate-pulse-glow"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                </div>

                {/* Local Conversation Starters */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    "🛠️ Know any warehouse gigs in Stockton?",
                    "🏪 Modesto retail work for weekends?",
                    "💼 Office jobs that don't suck near Tracy?",
                    "🏭 Manufacturing work in Manteca?",
                    "🏥 Healthcare jobs in Lodi?"
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSearchQuery(prompt.replace(/🛠️|🏪|💼|🏭|🏥/g, '').trim())}
                      className="chat-prompt-button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </form>

              {/* Local Trust Indicators */}
              <div className="flex items-center justify-center gap-8 mt-8 text-sm font-semibold">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  209 Local Intel
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  Real Jobs, Real Pay
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  No BS Advice
                </div>
              </div>
            </div>
          </div>

          {/* Bold CTA Buttons */}
          <div className="animate-fade-in-up stagger-3 flex flex-col justify-center gap-6 sm:flex-row">
            {!isSignedIn ? (
              <>
                <Link href="/jobs" className="btn-secondary group text-lg px-8 py-4">
                  <Briefcase className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                  Browse Local Jobs
                </Link>
                <Link href="/sign-up" className="btn-primary group text-lg px-8 py-4 animate-pulse-glow">
                  <Zap className="mr-3 h-6 w-6 transition-transform group-hover:rotate-12" />
                  Join the 209 Workforce
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="btn-primary group text-lg px-8 py-4">
                  <Zap className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                  My Dashboard
                </Link>
                <Link href="/jobs" className="btn-secondary group text-lg px-8 py-4">
                  <Search className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                  Find Work
                </Link>
              </>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Features Section with Neon Cards */}
      <section className="section relative">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="heading-2 animate-fade-in-up mb-6">
              Why Choose{' '}
              <span className="gradient-text">{domainConfig.displayName}?</span>
            </h2>
            <p className="animate-fade-in-up stagger-1 mx-auto max-w-3xl text-xl text-muted-foreground">
              We're not just another job board. We're your local career partner,
              deeply connected to the {domainConfig.region} community.
            </p>
          </div>

          <div className="grid-3 gap-8">
            {/* Feature 1: Local Focus */}
            <div className="feature-card animate-fade-in-up stagger-1">
              <div className="feature-icon mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">100% Local Jobs</h3>
              <p className="text-muted-foreground">
                Every opportunity is within the {domainConfig.areaCode} area. No
                remote tricks, no out-of-state positions. Just genuine careers
                in {domainConfig.cities.slice(0, 3).join(', ')} and beyond.
              </p>
            </div>

            {/* Feature 2: AI-Powered */}
            <div className="feature-card animate-fade-in-up stagger-2">
              <div className="feature-icon mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">AI-Powered Matching</h3>
              <p className="text-muted-foreground">
                JobsGPT uses advanced AI to understand your skills and
                preferences, matching you with opportunities that truly fit your
                career goals.
              </p>
            </div>

            {/* Feature 3: Fast & Simple */}
            <div className="feature-card animate-fade-in-up stagger-3">
              <div className="feature-icon mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                No endless forms or complicated processes. Apply to jobs in
                seconds, track applications easily, and get real-time updates on
                your status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Gradient Background */}
      <section className="section relative overflow-hidden">
        <div className="bg-gradient-mesh absolute inset-0 opacity-5"></div>
        <div className="container relative z-10">
          <div className="grid-4 gap-8 text-center">
            <div className="glass-card hover-lift p-8">
              <h3 className="gradient-text mb-2 text-5xl font-bold">5,000+</h3>
              <p className="text-muted-foreground">Active Jobs</p>
            </div>
            <div className="glass-card hover-lift p-8">
              <h3 className="gradient-text mb-2 text-5xl font-bold">500+</h3>
              <p className="text-muted-foreground">Local Employers</p>
            </div>
            <div className="glass-card hover-lift p-8">
              <h3 className="gradient-text mb-2 text-5xl font-bold">50,000+</h3>
              <p className="text-muted-foreground">Job Seekers</p>
            </div>
            <div className="glass-card hover-lift p-8">
              <h3 className="gradient-text mb-2 text-5xl font-bold">95%</h3>
              <p className="text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* JobsGPT Section */}
      <section className="section relative">
        <div className="container">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="neon-card group cursor-pointer">
                <div className="absolute right-4 top-4">
                  <div className="badge-primary pulse-glow">AI Powered</div>
                </div>
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">You</p>
                    <p className="font-medium">
                      I'm looking for warehouse jobs in Stockton that pay at
                      least $20/hour
                    </p>
                  </div>
                  <div className="glass ml-8 rounded-xl p-4">
                    <p className="text-sm text-primary">JobsGPT</p>
                    <p className="font-medium">
                      I found 12 warehouse positions in Stockton matching your
                      criteria. Amazon has 3 openings starting at $22/hour with
                      sign-on bonuses...
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">You</p>
                    <p className="font-medium">
                      Tell me more about the Amazon positions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-6 inline-flex items-center justify-center">
                <div className="badge-accent">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Introducing JobsGPT
                </div>
              </div>
              <h2 className="heading-2 mb-6">
                Your Personal{' '}
                <span className="gradient-text">AI Career Assistant</span>
              </h2>
              <p className="mb-8 text-xl text-muted-foreground">
                Chat naturally about your career goals and let our AI find
                perfect matches. It knows every job, every company, and every
                opportunity in {domainConfig.region}.
              </p>
              <div className="mb-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <p className="text-foreground/80">
                    Understands natural language queries
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <p className="text-foreground/80">
                    Knows local salary ranges and benefits
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <p className="text-foreground/80">
                    Provides personalized recommendations
                  </p>
                </div>
              </div>
              <Link href="/chat" className="btn-primary">
                Try JobsGPT Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section relative overflow-hidden">
        <div className="bg-gradient-primary absolute inset-0 opacity-10"></div>
        <div className="container relative z-10 text-center">
          <h2 className="heading-2 mb-6">Ready to Transform Your Career?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Join thousands of professionals who've found their perfect role
            through {domainConfig.displayName}.
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            {!isSignedIn ? (
              <>
                <Link href="/sign-up" className="btn-primary">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/employers" className="btn-glass">
                  I'm Hiring
                  <Users className="ml-2 h-4 w-4" />
                </Link>
              </>
            ) : (
              <Link href="/jobs" className="btn-primary">
                Explore Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-border/50 relative border-t pb-10 pt-20">
        <div className="bg-gradient-mesh absolute inset-0 opacity-[0.02]"></div>
        <div className="container relative z-10">
          <div className="mb-12 grid gap-8 lg:grid-cols-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center space-x-3">
                <div className="bg-gradient-primary rounded-xl p-2">
                  <span className="text-2xl font-bold text-white">
                    {domainConfig.areaCode}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {domainConfig.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your Gateway to {domainConfig.region} Jobs
                  </p>
                </div>
              </div>
              <p className="mb-6 text-muted-foreground">
                Connecting local talent with local opportunities. Every job is
                within commuting distance, every employer is a neighbor.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="btn-glass p-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>
                <Link href="#" className="btn-glass p-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </Link>
                <Link href="#" className="btn-glass p-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Job Seekers */}
            <div>
              <h4 className="mb-4 font-semibold">Job Seekers</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/jobs"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chat"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    JobsGPT
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tracker"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Application Tracker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Employers */}
            <div>
              <h4 className="mb-4 font-semibold">Employers</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/employers"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/employers/dashboard"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/employers/pricing"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/employers/analytics"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Career Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/community"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-border/50 flex flex-col items-center justify-between border-t pt-8 lg:flex-row">
            <p className="mb-4 text-sm text-muted-foreground lg:mb-0">
              © 2025 {domainConfig.displayName}. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built for the {domainConfig.areaCode}. Made for the people who
              work here.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
