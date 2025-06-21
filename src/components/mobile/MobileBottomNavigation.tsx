'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useEffect } from "react";
import { useState } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
  roles?: string[];
}

interface MobileBottomNavigationProps {
  className?: string;
}

export default function MobileBottomNavigation({ className = '' }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { unreadCount } = useRealTimeNotifications();
  
  // Get user role from metadata
  const userRole = user?.publicMetadata?.role as string || 'job_seeker';

  // Navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        name: 'Home',
        href: '/',
        icon: Home
      },
      {
        name: 'Jobs',
        href: '/jobs',
        icon: Briefcase
      },
      {
        name: 'Search',
        href: '/search',
        icon: Search
      },
    ];

    if (user) {
      if (userRole === 'job_seeker') {
        return [
          ...baseItems,
          {
            name: 'JobsGPT',
            href: '/jobsgpt',
            icon: MessageSquare,
            requiresAuth: true
          },
          {
            name: 'Profile',
            href: '/profile',
            icon: User,
            badge: unreadCount > 0 ? unreadCount : undefined,
            requiresAuth: true
          },
        ];
      } else if (userRole === 'employer') {
        return [
          {
            name: 'Dashboard',
            href: '/dashboard',
            icon: BarChart3,
            requiresAuth: true,
            roles: ['employer']
          },
          {
            name: 'Jobs',
            href: '/jobs',
            icon: Briefcase
          },
          {
            name: 'Post Job',
            href: '/post-job',
            icon: Search,
            requiresAuth: true,
            roles: ['employer']
          },
          {
            name: 'Messages',
            href: '/messages',
            icon: MessageSquare,
            badge: unreadCount > 0 ? unreadCount : undefined,
            requiresAuth: true
          },
          {
            name: 'Profile',
            href: '/profile',
            icon: User,
            requiresAuth: true
          },
        ];
      } else if (userRole === 'admin') {
        return [
          {
            name: 'Dashboard',
            href: '/admin',
            icon: BarChart3,
            requiresAuth: true,
            roles: ['admin']
          },
          {
            name: 'Jobs',
            href: '/jobs',
            icon: Briefcase
          },
          {
            name: 'Analytics',
            href: '/analytics',
            icon: Search,
            requiresAuth: true,
            roles: ['admin']
          },
          {
            name: 'Messages',
            href: '/messages',
            icon: MessageSquare,
            badge: unreadCount > 0 ? unreadCount : undefined,
            requiresAuth: true
          },
          {
            name: 'Profile',
            href: '/profile',
            icon: User,
            requiresAuth: true
          },
        ];
      }
    }

    // Default for non-authenticated users
    return [
      ...baseItems,
      {
        name: 'JobsGPT',
        href: '/jobsgpt',
        icon: MessageSquare
      },
      {
        name: 'Sign In',
        href: '/sign-in',
        icon: User
      },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Don't show on certain pages
  const hiddenPaths = ['/sign-in', '/sign-up', '/onboarding'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden ${className}`}>
      <div className="grid grid-cols-5 h-16">
        {navigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          // Check if user has permission to access this item
          if (item.requiresAuth && !user) {
            return null;
          }
          
          if (item.roles && !item.roles.includes(userRole)) {
            return null;
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center p-2 transition-colors duration-200"
            >
              <div className="relative">
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-green-100 rounded-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative z-10">
                  <Icon 
                    className={`h-5 w-5 transition-colors duration-200 ${
                      active 
                        ? 'text-green-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`} 
                  />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge 
                        variant="destructive" 
                        className="h-4 w-4 p-0 flex items-center justify-center text-xs"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <span 
                className={`text-xs mt-1 transition-colors duration-200 ${
                  active 
                    ? 'text-green-600 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}

// Hook to detect if user is on mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Mobile-specific layout wrapper
export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with bottom padding for navigation */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <MobileBottomNavigation />
    </div>
  );
}
