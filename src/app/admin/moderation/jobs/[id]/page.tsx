import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '../../../../api/auth/prisma';
import JobModerationDetail from '@/components/admin/JobModerationDetail';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/database/prisma';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobModerationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/moderation/jobs/' + id);
  }

  const userRole = user?.publicMetadata?.role || 'guest';
  if (!hasPermission(userRole, Permission.MODERATE_JOBS)) {
    redirect('/admin');
  }

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
      <JobModerationDetailClient job={job} />
    </div>
  );
}

// Client component wrapper to handle actions
function JobModerationDetailClient({ job }: { job: any }) {
  const handleModerationAction = async (action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Redirect back to moderation list
        window.location.href = '/admin/moderation/jobs';
      } else {
        alert(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error moderating job:', error);
      alert('An error occurred while moderating the job');
    }
  };

  return <JobModerationDetail job={job} onAction={handleModerationAction} />;
}
