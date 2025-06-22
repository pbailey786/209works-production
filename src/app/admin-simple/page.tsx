'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Settings,
  Users,
  BarChart3,
  FileText,
  Shield,
  Activity,
  Database,
  Download
} from 'lucide-react';

export default function SimpleAdminPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', sub: 'mock-user-id' } };
  const status = 'authenticated';

  useEffect(() => {
    setLoading(false);

    // Get user info
    fetch('/api/debug/current-user')
      .then(res => res.json())
      .then(data => setUserInfo(data))
      .catch(err => console.error('Error fetching user info:', err));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock admin role for now - replace with Clerk role checking
  const userRole = 'admin';
  const isAdmin = true;

  const adminLinks = [
    {
      name: 'Email Management',
      href: '/admin/email',
      icon: Mail,
      description: 'Manage email templates and campaigns'
    },
    {
      name: 'User Management', 
      href: '/admin/users',
      icon: Users,
      description: 'Manage users and permissions'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics', 
      icon: BarChart3,
      description: 'View platform analytics'
    },
    {
      name: 'Content Moderation',
      href: '/admin/moderation',
      icon: Shield,
      description: 'Moderate jobs and content'
    },
    {
      name: 'System Health',
      href: '/admin/health',
      icon: Activity,
      description: 'Monitor system status'
    },
    {
      name: 'Job Import',
      href: '/admin/adzuna-import',
      icon: Database,
      description: 'Import jobs from external sources'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: Download,
      description: 'Generate and download reports'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Simple Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.email}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userRole || 'No Role'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* User Info Debug */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Email:</strong> {session.user?.email}
            </div>
            <div>
              <strong>Role:</strong> {userRole || 'Not set'}
            </div>
            <div>
              <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Session Status:</strong> {status}
            </div>
          </div>
          
          {userInfo && (
            <div className="mt-4">
              <strong>API Response:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Admin Links */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <link.icon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {link.name}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-600">
              You don't have admin permissions. Your current role is: {userRole || 'Not set'}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="space-x-4">
            <Link 
              href="/admin"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Regular Admin Dashboard
            </Link>
            <Link 
              href="/"
              className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
