import { useUser, useAuth, SignInButton, UserButton } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { useState } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/components/ui/card';
import {
import Avatar from './Avatar';
import ProfileIcon from './auth/ProfileIcon';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorDisplay from './ui/ErrorDisplay';
import { Button } from '@/components/ui/card';
import { cn } from '@/lib/utils';

'use client';
import {
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
  Building2
} from 'lucide-react';
// Removed NextAuth session hook

export default function Header() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Removed user menu state - Clerk handles this

  // Simplified auth state
  const isAuthenticated = isSignedIn && !!user;
  const isLoading = !isLoaded;

  const navigation = [
    { name: 'Find Jobs', href: '/jobs', icon: Search },
    { name: 'For Employers', href: '/employers', icon: Building2 },
    { name: 'About', href: '/about', icon: Heart },
    { name: 'Contact', href: '/contact', icon: FileText },
  ];

  // Role-based navigation
  const getUserNavigation = () => {
    if (!user) return [];

    const userRole = user.publicMetadata?.role as string;

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

  // Clerk handles sign-in/sign-out automatically

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md"
      role="banner"
    >
      {/* Auth Error Display - Removed for Clerk migration */}

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
            {isLoading && (
              <div className="flex items-center space-x-2" aria-live="polite">
                <LoadingSpinner size="sm" variant="spinner" color="gray" />
                <span className="hidden text-sm text-gray-500 sm:block">
                  Loading...
                </span>
              </div>
            )}

            {!isLoading && !isAuthenticated && (
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-[#2d4a3e]"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button
                    className="bg-[#ff6b35] text-white hover:bg-[#e55a2b]"
                  >
                    Sign Up
                  </Button>
                </SignInButton>
              </div>
            )}

            {isAuthenticated && user && (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  {/* Clerk User Button with custom appearance */}
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                        userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50"
                      }
                    }}
                  />

                  {/* Navigation links for authenticated users */}
                  <div className="hidden lg:flex items-center space-x-4 ml-4">
                    {userNavigation.slice(0, 3).map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-[#2d4a3e] transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
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

                {user && (
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
                    {/* Clerk UserButton for mobile */}
                    <div className="px-3 py-3">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8",
                            userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg"
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Clerk handles user menu interactions */}
    </header>
  );
}
