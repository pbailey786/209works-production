'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import path from "path";

interface EmployerLayoutProps {
  children: ReactNode;
}

const employerNavigation = [
  {
    name: 'Dashboard',
    href: '/employers/dashboard',
    icon: '📊',
    description: 'Overview & Analytics',
  },
  {
    name: 'Notifications',
    href: '/employers/notifications',
    icon: '🔔',
    description: 'Messages & Updates',
    submenu: [
      { name: 'Notification Center', href: '/employers/notifications' },
      { name: 'Alerts Dashboard', href: '/employers/alerts' },
      { name: 'Notification Settings', href: '/employers/settings/alerts' },
    ],
  },
  {
    name: 'Jobs',
    href: '/employers/my-jobs',
    icon: '💼',
    description: 'Manage Job Postings',
    submenu: [
      { name: 'My Jobs', href: '/employers/my-jobs' },
      { name: 'Post New Job', href: '/employers/create-job-post' },
      { name: 'Bulk Upload', href: '/employers/bulk-upload' },
    ],
  },
  {
    name: 'Candidates',
    href: '/employers/applicants',
    icon: '👥',
    description: 'Manage Applications',
    submenu: [
      { name: 'All Candidates', href: '/employers/applicants' },
      { name: 'Pipeline View', href: '/employers/applicants/pipeline' },
      { name: 'Contact Database', href: '/employers/crm/contacts' },
    ],
  },
  {
    name: 'Account',
    href: '/employers/settings',
    icon: '⚙️',
    description: 'Settings & Billing',
    submenu: [
      { name: 'Profile', href: '/employers/settings/profile' },
      { name: 'Team & Permissions', href: '/employers/settings/team' },
      { name: 'Billing', href: '/employers/settings/billing' },
      { name: 'Alerts', href: '/employers/settings/alerts' },
    ],
  },
];

const candidateQuickActions = [
  { name: 'View All Candidates', href: '/employers/applicants', icon: '👥' },
  { name: 'Pipeline View', href: '/employers/applicants/pipeline', icon: '📋' },
  { name: 'Contact Database', href: '/employers/crm/contacts', icon: '📞' },
];

const utilityPages = [
  { name: 'Upgrade Plan', href: '/employers/pricing', icon: '⭐' },
  { name: 'Referral Program', href: '/employers/referral', icon: '🎁' },
  { name: 'Support Center', href: '/employers/contact', icon: '💬' },
];

const supportPages = [
  { name: 'FAQ', href: '/employers/faq', icon: '❓' },
  { name: 'Contact', href: '/employers/contact', icon: '📞' },
  { name: 'Terms', href: '/employers/terms', icon: '📄' },
  { name: 'Privacy', href: '/employers/privacy', icon: '🔒' },
];

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  const pathname = usePathname();

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (segments.length > 1) {
      breadcrumbs.push({ name: 'Employers', href: '/employers' });

      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        const href = '/' + segments.slice(0, i + 1).path.join('/');
        const name =
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        breadcrumbs.push({ name, href });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <RoleGuard allowedRoles={['employer', 'admin']} redirectTo="/employers/signin">
      <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="min-h-screen w-64 border-r border-gray-200 bg-white shadow-sm">
          <div className="p-4">
            <Link
              href="/employers"
              className="mb-6 flex items-center space-x-2"
            >
              <span className="text-xl font-bold text-blue-600">
                Employer Hub
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="space-y-2">
              {employerNavigation.map(item => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'border-r-2 border-blue-600 bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{item.icon}</span>
                      <div>
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Submenu */}
                  {item.submenu && isActivePath(item.href) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu.map(subitem => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className={`block rounded-md px-3 py-1 text-sm transition-colors ${
                            pathname === subitem.href
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CRM Quick Actions */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Candidate Management
              </h3>
              <div className="mt-2 space-y-1">
                {candidateQuickActions.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Utility Section */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-1">
                {utilityPages.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support Section */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Support
              </h3>
              <div className="mt-2 space-y-1">
                {supportPages.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <div className="border-b border-gray-200 bg-white px-6 py-3">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href} className="flex items-center">
                      {index > 0 && (
                        <span className="mx-2 text-gray-400">/</span>
                      )}
                      <Link
                        href={breadcrumb.href}
                        className={`text-sm font-medium ${
                          index === breadcrumbs.length - 1
                            ? 'text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {breadcrumb.name}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          )}

          {/* Page Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
    </RoleGuard>
  );
}
