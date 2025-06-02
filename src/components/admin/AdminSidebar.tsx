'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Shield,
  Activity,
  PlayCircle,
  UserCheck,
  AlertTriangle,
  Database,
  Download,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  CloudDownload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Permission } from '@/lib/rbac/permissions';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  permission?: Permission;
  permissions?: Permission[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: Permission.VIEW_ANALYTICS,
  },
  {
    name: 'Content Moderation',
    href: '/admin/moderation',
    icon: Shield,
    permission: Permission.VIEW_MODERATION_QUEUE,
    children: [
      {
        name: 'Job Listings',
        href: '/admin/moderation/jobs',
        icon: FileText,
        badge: '12',
        permission: Permission.MODERATE_JOBS,
      },
      {
        name: 'User Reports',
        href: '/admin/moderation/reports',
        icon: AlertTriangle,
        badge: '3',
        permission: Permission.HANDLE_REPORTS,
      },
    ]
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    permission: Permission.VIEW_USERS,
    children: [
      {
        name: 'All Users',
        href: '/admin/users',
        icon: Users,
        permission: Permission.VIEW_USERS,
      },
      {
        name: 'Employers',
        href: '/admin/users/employers',
        icon: UserCheck,
        permission: Permission.VIEW_USERS,
      },
      {
        name: 'Jobseekers',
        href: '/admin/users/jobseekers',
        icon: Users,
        permission: Permission.VIEW_USERS,
      },
    ]
  },
  {
    name: 'Advertisement Management',
    href: '/admin/ads',
    icon: PlayCircle,
    permission: Permission.VIEW_ADS,
    children: [
      {
        name: 'Active Campaigns',
        href: '/admin/ads/campaigns',
        icon: PlayCircle,
        permission: Permission.MANAGE_AD_CAMPAIGNS,
      },
      {
        name: 'Performance',
        href: '/admin/ads/performance',
        icon: BarChart3,
        permission: Permission.VIEW_AD_PERFORMANCE,
      },
    ]
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: Permission.VIEW_ANALYTICS,
    children: [
      {
        name: 'Platform Overview',
        href: '/admin/analytics',
        icon: BarChart3,
        permission: Permission.VIEW_ANALYTICS,
      },
      {
        name: 'JobsGPT Analytics',
        href: '/admin/jobsgpt-analytics',
        icon: BarChart3,
        permission: Permission.VIEW_ANALYTICS,
      },
      {
        name: 'User Engagement',
        href: '/admin/analytics/engagement',
        icon: Users,
        permission: Permission.VIEW_ANALYTICS,
      },
      {
        name: 'Search Analytics',
        href: '/admin/analytics/search',
        icon: BarChart3,
        permission: Permission.VIEW_ANALYTICS,
      },
      {
        name: 'Email Performance',
        href: '/admin/analytics/email',
        icon: BarChart3,
        permission: Permission.VIEW_EMAIL_ANALYTICS,
      },
    ]
  },
  {
    name: 'System Health',
    href: '/admin/health',
    icon: Activity,
    permission: Permission.VIEW_SYSTEM_HEALTH,
  },
  {
    name: 'Job Import',
    href: '/admin/adzuna-import',
    icon: CloudDownload,
    permission: Permission.MANAGE_SYSTEM_SETTINGS,
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit',
    icon: FileText,
    permission: Permission.VIEW_AUDIT_LOGS,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: Download,
    permission: Permission.EXPORT_REPORTS,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: Permission.MANAGE_SYSTEM_SETTINGS,
  },
];

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isExpanded = (href: string) => {
    return expandedItems.includes(href) || pathname.startsWith(href);
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    // Check permissions for this nav item
    const hasItemPermission = () => {
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      if (item.permissions && !hasAnyPermission(item.permissions)) {
        return false;
      }
      return true;
    };

    // Filter children based on permissions
    const visibleChildren = item.children?.filter(child => {
      if (child.permission && !hasPermission(child.permission)) {
        return false;
      }
      if (child.permissions && !hasAnyPermission(child.permissions)) {
        return false;
      }
      return true;
    });

    // Don't render if user doesn't have permission
    if (!hasItemPermission()) {
      return null;
    }

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const expanded = isExpanded(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <div
          className={cn(
            "flex items-center justify-between py-2 px-3 rounded-lg text-sm font-medium transition-colors",
            level > 0 && "ml-4",
            active
              ? "bg-[#2d4a3e]/10 text-[#2d4a3e]"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Link href={item.href} className="flex items-center flex-1">
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {item.badge}
              </span>
            )}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.href)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {hasChildren && expanded && (
          <div className="mt-1 space-y-1">
            {visibleChildren!.map(child => (
              <NavItemComponent key={child.href} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center">
              <div className="w-8 h-8 bg-[#2d4a3e] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map(item => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              209 Works Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
} 