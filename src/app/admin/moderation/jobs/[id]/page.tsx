// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../../../api/auth/authOptions';
import { prisma } from '../../../../api/auth/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import JobModerationClient from './JobModerationClient';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Force dynamic rendering to avoid database connections during build
export const dynamic = 'force-dynamic';

export default async function JobModerationDetailPage({ params }: PageProps) {
  const { id } = await params;
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/moderation/jobs/' + id);
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

  // Fetch the job with all necessary details
  const job = await prisma.job.findUnique({
    where: { id: id },
    include: {
      _count: {
        select: {
          jobApplications: true,
        },
      },
    },
  });

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/moderation/jobs"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Moderation
          </Link>
        </div>

        <div className="py-12 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Job Not Found
          </h1>
          <p className="text-gray-600">
            The job you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/moderation/jobs"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Moderation
        </Link>

        <div className="text-sm text-gray-500">Job ID: {job.id}</div>
      </div>

      {/* Job Moderation Detail Component */}
      <JobModerationClient job={job} />
    </div>
  );
}

