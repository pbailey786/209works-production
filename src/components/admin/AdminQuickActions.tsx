import Link from 'next/link';
import {
  Shield,
  Users,
  BarChart3,
  PlayCircle,
  Settings,
  Download,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Review Content',
    description: 'Moderate pending job listings',
    href: '/admin/moderation/jobs',
    icon: Shield,
    color: 'bg-red-500 hover:bg-red-600',
    badge: '12',
  },
  {
    title: 'User Reports',
    description: 'Handle user-generated reports',
    href: '/admin/moderation/reports',
    icon: AlertTriangle,
    color: 'bg-orange-500 hover:bg-orange-600',
    badge: '3',
  },
  {
    title: 'Manage Users',
    description: 'View and edit user accounts',
    href: '/admin/users',
    icon: Users,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Analytics',
    description: 'View platform performance',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Ad Campaigns',
    description: 'Manage advertisements',
    href: '/admin/ads/campaigns',
    icon: PlayCircle,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'Export Reports',
    description: 'Generate system reports',
    href: '/admin/reports',
    icon: Download,
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
];

export default function AdminQuickActions() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Quick Actions</h3>

      <div className="grid grid-cols-1 gap-3">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`relative flex items-center rounded-lg p-4 transition-colors ${action.color} group text-white`}
          >
            <action.icon className="mr-3 h-5 w-5 flex-shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium">{action.title}</p>
                {action.badge && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-white bg-opacity-20 px-2 py-0.5 text-xs font-medium">
                    {action.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs opacity-90">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <Link
          href="/admin/settings"
          className="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <Settings className="mr-2 h-4 w-4" />
          System Settings
        </Link>
      </div>
    </div>
  );
}
