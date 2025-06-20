'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  submenu?: NavigationItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title: string;
  subtitle?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    initials?: string;
  };
  headerActions?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function DashboardLayout({
  children,
  navigation,
  title,
  subtitle,
  user,
  headerActions,
  showSearch = true,
  searchPlaceholder = "Search...",
  onSearch,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 sm:px-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6b35]">
                <span className="text-sm font-bold text-white">209</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden touch-manipulation"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
            {navigation.map((item) => (
              <NavigationItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-center text-xs text-gray-500">
              209 Works © 2025
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden touch-manipulation flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 truncate hidden sm:block">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Search */}
              {showSearch && (
                <form onSubmit={handleSearch} className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 lg:w-64 pl-10"
                    />
                  </div>
                </form>
              )}

              {/* Header actions */}
              <div className="hidden sm:block">
                {headerActions}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative touch-manipulation">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              </Button>

              {/* User menu */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8'
                  }
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavigationItem({ 
  item, 
  pathname 
}: { 
  item: NavigationItem; 
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (hasSubmenu) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-manipulation",
            isActive
              ? "bg-[#ff6b35] text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white flex-shrink-0">
                {item.badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform flex-shrink-0",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>
        
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {item.submenu.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors touch-manipulation",
                  pathname === subItem.href
                    ? "bg-[#2d4a3e] text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{subItem.name}</span>
                {subItem.badge && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white flex-shrink-0">
                    {subItem.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-manipulation",
        isActive
          ? "bg-[#ff6b35] text-white"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
      {item.badge && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white flex-shrink-0">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
