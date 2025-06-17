import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../api/auth/authOptions';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { canAccessRoute } from '@/lib/rbac/permissions';
import type { Session } from 'next-auth';

// Force dynamic rendering for admin layout
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Check if we're in build mode or if database is not available
    if (!process.env.DATABASE_URL) {
      // Return children directly to show the error page from the admin page component
      return children;
    }

    const session = await getServerSession(authOptions) as Session | null;

    // Check if user is authenticated
    if (!session) {
      redirect('/signin?redirect=/admin');
    }

    const userRole = session!.user?.role;

    // Check if user has admin or employer role (employers can import jobs)
    if (
      userRole !== 'admin' &&
      userRole !== 'employer' &&
      !userRole?.includes('admin')
    ) {
      redirect('/');
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {session!.user?.name || session!.user?.email}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d4a3e]">
                    <span className="text-sm font-medium text-white">
                      {(session!.user?.name ||
                        session!.user?.email ||
                        'A')[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error in admin layout:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Layout Error
          </h1>
          <p className="text-gray-600">
            There was an error loading the admin interface.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}
