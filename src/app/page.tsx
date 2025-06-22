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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                  <Link href="/sign-up" className="bg-gradient-accent text-white font-black text-lg px-8 py-4 rounded-full hover:scale-110 transition-all shadow-xl hover:shadow-glow animate-pulse-glow inline-flex items-center">
                    I Need a Job ⚡
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
              <button 
                className="btn-glass p-3"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
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
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-4 pt-4 pb-6 space-y-4 bg-white/95 backdrop-blur-lg border-t border-border/50">
                <Link
                  href="/jobs"
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Jobs
                </Link>
                <Link
                  href="/employers"
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post Jobs
                </Link>
                <Link
                  href="/chat"
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  JobsGPT
                </Link>
                <Link
                  href="/about"
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="pt-4 border-t border-border/50">
                  {!isSignedIn ? (
                    <div className="space-y-3">
                      <Link
                        href="/sign-in"
                        className="block px-3 py-2 text-foreground/80 hover:text-foreground font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="block w-full bg-gradient-accent text-white font-bold text-center py-3 px-4 rounded-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        I Need a Job ⚡
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="block w-full bg-gradient-primary text-white font-bold text-center py-3 px-4 rounded-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Gradient Mesh */}
      <section className="hero-gradient relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Street Texture Background */}
        <div className="street-texture"></div>
        
        {/* Local Graphics Background */}
        <div className="local-graphics"></div>
        
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
          <div
            className="shape shape-triangle"
            style={{ top: '40%', right: '8%', transform: 'rotate(90deg)' }}
          ></div>
          <div
            className="shape shape-circle"
            style={{ top: '80%', left: '70%', width: '80px', height: '80px' }}
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
              Jobs for the 209.
            </span>
            <span className="text-gradient mt-2 block">
              No Suits Required.
            </span>
          </h1>

          {/* Local Tagline */}
          <p className="animate-fade-in-up stagger-1 mx-auto mb-12 max-w-4xl text-xl text-foreground font-bold md:text-2xl">
            Built for the folks who work hard and don't mess around.
            <span className="text-primary"> Real jobs that hit close to home.</span>
          </p>

          {/* Local AI Chat Interface */}
          <div className="animate-fade-in-up stagger-2 mx-auto mb-12 max-w-4xl">
            <div className="chat-container p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-6 py-3 rounded-full text-sm font-black mb-6 shadow-glow animate-pulse-glow">
                  <span className="text-lg">🤝</span> JobsGPT - Your 209 Plug for Jobs
                </div>
                <h3 className="text-3xl font-black text-foreground mb-3">
                  Yo, what kind of work you need?
                </h3>
                <p className="text-lg text-muted-foreground font-bold">
                  Text me like I'm your cousin who knows everybody hiring in the Valley
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="💬 Try: 'warehouse gigs in Stockton' or 'retail that pays good in Modesto'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="chat-input w-full pr-24 text-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-primary text-white p-4 rounded-full hover:scale-110 transition-all shadow-lg hover:shadow-glow animate-pulse-glow"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                </div>

                {/* Local Conversation Starters */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    "🏗️ warehouse gigs that pay daily in Stockton",
                    "🛒 weekend retail that doesn't suck in Modesto",
                    "💼 office jobs near Tracy with actual benefits",
                    "🚚 CDL driving gigs around Manteca",
                    "🔧 mechanic shops hiring in Lodi"
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSearchQuery(prompt.replace(/🏗️|🛒|💼|🚚|🔧/g, '').trim())}
                      className="chat-prompt-button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </form>

              {/* Local Trust Indicators */}
              <div className="flex items-center justify-center gap-8 mt-8 text-sm font-black">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-glow"></div>
                  100% Valley Jobs
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-glow"></div>
                  No Cap, Just Facts
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse shadow-glow"></div>
                  Straight Talk Only
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
                <Link href="/sign-up" className="bg-gradient-accent text-white font-black text-xl px-10 py-5 rounded-full hover:scale-110 transition-all shadow-xl hover:shadow-glow animate-pulse-glow inline-flex items-center group">
                  <span className="text-2xl mr-3">⚡</span>
                  Let's Get You Paid
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
                <Link href="/contact" className="btn-glass p-2" title="Contact Us">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </Link>
                <Link href="/about" className="btn-glass p-2" title="About Us">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Link>
                <Link href="/faq" className="btn-glass p-2" title="Help & FAQ">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
                    href="/employers/dashboard"
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
