'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Briefcase,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Heart,
  FileText,
  BarChart3,
  Users,
  Building2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { FEATURES } from '@/lib/feature-flags';
import Avatar from './Avatar';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorDisplay from './ui/ErrorDisplay';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  // Use Clerk authentication if enabled, otherwise fall back to mock
  const { user: clerkUser, isLoaded } = FEATURES.CLERK_AUTH ? useUser() : { user: null, isLoaded: true };
  
  // Create session object for compatibility
  const session = FEATURES.CLERK_AUTH 
    ? (clerkUser ? {
        user: { 
          email: clerkUser.emailAddresses[0]?.emailAddress,
          role: clerkUser.publicMetadata?.role || 'jobseeker',
          name: clerkUser.fullName || clerkUser.firstName,
          id: clerkUser.id,
          image: clerkUser.imageUrl 
        }
      } : null)
    : {
        user: { 
          email: 'admin@209.works', 
          role: 'admin', 
          name: 'Mock User', 
          id: 'mock-user-id', 
          image: null 
        }
      };
  
  const status = session ? 'authenticated' : 'unauthenticated';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const navigation = [
    { name: 'Find Jobs', href: '/jobs', icon: Search },
    { name: 'For Employers', href: '/employers', icon: Building2 },
    { name: 'About', href: '/about', icon: Heart },
    { name: 'Contact', href: '/contact', icon: FileText },
  ];

  // Role-based navigation
  const getUserNavigation = () => {
    if (!session?.user) return [];

    const userRole = (session.user as any).role;

    if (userRole === 'employer') {
      return [
        { name: 'Dashboard', href: '/employers/dashboard', icon: BarChart3 },
        { name: 'My Jobs', href: '/employers/my-jobs', icon: FileText },
        { name: 'Post Job', href: '/employers/create-job-post', icon: Building2 },
        { name: 'Settings', href: '/employers/settings', icon: Settings },
      ];
    } else if (userRole === 'admin') {
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Job Seeker Dashboard', href: '/dashboard', icon: User },
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Settings', href: '/profile/settings', icon: Settings },
      ];
    } else {
      // Job seeker navigation
      return [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Applications', href: '/profile/applications', icon: FileText },
        { name: 'Saved Jobs', href: '/profile/saved', icon: Heart },
        { name: 'Settings', href: '/profile/settings', icon: Settings },
      ];
    }
  };

  const userNavigation = getUserNavigation();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setAuthError(null);

    try {
      // TODO: Replace with Clerk sign out
      console.log('Mock sign out');
      // Redirect to home page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError('Failed to sign out. Please try again.');

      // Clear error after 3 seconds
      setTimeout(() => setAuthError(null), 3000);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignIn = () => {
    // Navigate to the job seeker sign-in page
    window.location.href = '/signin';
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md"
      role="banner"
    >
      {/* Auth Error Display */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-red-200 bg-red-50 px-4 py-2"
            role="alert"
            aria-live="assertive"
          >
            <ErrorDisplay
              error={authError}
              type="error"
              size="sm"
              variant="inline"
              onDismiss={() => setAuthError(null)}
              showIcon={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-3">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2d4a3e] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl sm:h-10 sm:w-10">
                <span className="text-sm font-bold text-[#9fdf9f] sm:text-base">
                  209
                </span>
              </div>
              <div className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-[#ff6b35] sm:h-3 sm:w-3"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-[#2d4a3e]">
                209 Works
              </span>
              <p className="-mt-1 text-xs text-gray-500">
                Your Local Job Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden space-x-1 lg:flex"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    'text-gray-700 hover:bg-[#9fdf9f]/10 hover:text-[#2d4a3e]',
                    'focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div
            className="flex items-center space-x-3"
            role="region"
            aria-label="User account actions"
          >
            {false && (
              <div className="flex items-center space-x-2" aria-live="polite">
                <LoadingSpinner size="sm" variant="spinner" color="gray" />
                <span className="hidden text-sm text-gray-500 sm:block">
                  Loading...
                </span>
              </div>
            )}

            {/* Simplified Auth Buttons */}
            {status === 'unauthenticated' && (
              <div className="flex items-center space-x-2">
                {FEATURES.CLERK_AUTH ? (
                  <>
                    <SignInButton mode="modal">
                      <Button
                        variant="ghost"
                        className="text-gray-700 hover:text-[#2d4a3e]"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        className="bg-[#ff6b35] text-white hover:bg-[#e55a2b]"
                      >
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="text-gray-700 hover:text-[#2d4a3e]"
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-[#ff6b35] text-white hover:bg-[#e55a2b]"
                    >
                      <Link href="/sign-up">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* User Menu */}
            {session?.user && (
              <div className="flex items-center space-x-3">
                {FEATURES.CLERK_AUTH ? (
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                ) : (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      disabled={isSigningOut}
                      className={cn(
                        'flex h-10 items-center space-x-2 rounded-lg px-3',
                        'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500',
                        isUserMenuOpen && 'bg-gray-100'
                      )}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="true"
                      aria-label={`User menu for ${session.user.name || session.user?.email}`}
                    >
                      <Avatar
                        src={session.user.image || undefined}
                        alt={session.user.name || session.user?.email || 'User'}
                        size={32}
                      />
                      <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 sm:block">
                        {session.user.name || session.user?.email}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-gray-500 transition-transform duration-200',
                          isUserMenuOpen && 'rotate-180'
                        )}
                      />
                    </Button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-lg ring-1 ring-black/5"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="user-menu"
                        >
                          {/* User Info */}
                          <div className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {session.user.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {session.user?.email}
                            </p>
                          </div>

                          <hr className="my-2 border-gray-100" />

                          {/* Navigation Links */}
                          {userNavigation.map(item => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                                role="menuitem"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Icon className="h-4 w-4 text-gray-400" />
                                {item.name}
                              </Link>
                            );
                          })}

                          <hr className="my-2 border-gray-100" />

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleSignOut();
                            }}
                            disabled={isSigningOut}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            role="menuitem"
                          >
                            {isSigningOut ? (
                              <>
                                <LoadingSpinner size="sm" variant="spinner" color="gray" />
                                Signing Out...
                              </>
                            ) : (
                              <>
                                <LogOut className="h-4 w-4 text-gray-400" />
                                Sign Out
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-200 py-4 lg:hidden"
              role="navigation"
              aria-label="Mobile navigation menu"
            >
              <div className="space-y-1">
                {navigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-[#9fdf9f]/10 hover:text-[#2d4a3e]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {session?.user && (
                  <>
                    <hr className="my-3 border-gray-200" role="separator" />
                    {userNavigation.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-[#9fdf9f]/10 hover:text-[#2d4a3e]"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-[#9fdf9f]/10 hover:text-[#2d4a3e] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSigningOut ? (
                        <>
                          <LoadingSpinner
                            size="sm"
                            variant="spinner"
                            color="gray"
                          />
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
