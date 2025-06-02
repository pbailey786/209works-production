"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import Avatar from "./Avatar";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorDisplay from "./ui/ErrorDisplay";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session, status } = useSession();
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

  const userNavigation = session?.user ? [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Applications', href: '/profile/applications', icon: FileText },
    { name: 'Saved Jobs', href: '/profile/saved', icon: Heart },
    { name: 'Settings', href: '/profile/settings', icon: Settings },
  ] : [];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setAuthError(null);

    try {
      await signOut({
        redirect: false,
        callbackUrl: '/'
      });
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
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50" role="banner">
      {/* Auth Error Display */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-b border-red-200 px-4 py-2 overflow-hidden"
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2d4a3e] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-[#9fdf9f] font-bold text-sm sm:text-base">209</span>
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-[#ff6b35] rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-[#2d4a3e]">
                209 Works
              </span>
              <p className="text-xs text-gray-500 -mt-1">Your Local Job Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "text-gray-700 hover:text-[#2d4a3e] hover:bg-[#9fdf9f]/10",
                    "focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3" role="region" aria-label="User account actions">
            {status === "loading" && (
              <div className="flex items-center space-x-2" aria-live="polite">
                <LoadingSpinner size="sm" variant="spinner" color="gray" />
                <span className="text-sm text-gray-500 hidden sm:block">Loading...</span>
              </div>
            )}
            
            {status === "unauthenticated" && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={handleSignIn}
                  className="text-gray-700 hover:text-[#2d4a3e]"
                >
                  Sign In
                </Button>
                <Button
                  asChild
                  className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
            
            {status === "authenticated" && session.user && (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  {/* User Menu Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      disabled={isSigningOut}
                      className={cn(
                        "flex items-center space-x-2 h-10 px-3 rounded-lg",
                        "hover:bg-gray-100 focus:ring-2 focus:ring-blue-500",
                        isUserMenuOpen && "bg-gray-100"
                      )}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="true"
                      aria-label={`User menu for ${session.user.name || session.user.email}`}
                    >
                      <Avatar 
                        src={session.user.image || undefined} 
                        alt={session.user.name || session.user.email || "User"} 
                        size={32} 
                      />
                      <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {session.user.name || session.user.email}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-gray-500 transition-transform duration-200",
                        isUserMenuOpen && "rotate-180"
                      )} />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                          role="menu"
                          aria-label="User account menu"
                        >
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session.user.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {session.user.email}
                            </p>
                          </div>

                          {/* Menu Items */}
                          {userNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                role="menuitem"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Icon className="w-4 h-4 text-gray-400" />
                                {item.name}
                              </Link>
                            );
                          })}
                          
                          <hr className="my-2 border-gray-100" role="separator" />
                          
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleSignOut();
                            }}
                            disabled={isSigningOut}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            role="menuitem"
                          >
                            {isSigningOut ? (
                              <>
                                <LoadingSpinner size="sm" variant="spinner" color="gray" />
                                Signing Out...
                              </>
                            ) : (
                              <>
                                <LogOut className="w-4 h-4 text-gray-400" />
                                Sign Out
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
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
              className="lg:hidden py-4 border-t border-gray-200 overflow-hidden"
              role="navigation"
              aria-label="Mobile navigation menu"
            >
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
                
                {session?.user && (
                  <>
                    <hr className="my-3 border-gray-200" role="separator" />
                    {userNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
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
                      className="flex items-center gap-3 w-full px-3 py-3 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSigningOut ? (
                        <>
                          <LoadingSpinner size="sm" variant="spinner" color="gray" />
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-5 h-5" />
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