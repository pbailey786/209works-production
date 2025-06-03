import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { prisma } from '../../../api/auth/prisma';
import JobModerationTable from '@/components/admin/JobModerationTable';
import JobModerationFilters from '@/components/admin/JobModerationFilters';
import { hasPermission, Permission } from '@/lib/rbac/permissions';

interface SearchParams {
  page?: string;
  status?: string;
  company?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function JobModerationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/moderation/jobs');
  }

  const userRole = (session.user as any)?.role;
  if (!hasPermission(userRole, Permission.MODERATE_JOBS)) {
    redirect('/admin');
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Parse search parameters
  const page = parseInt(params.page || '1');
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Build filter conditions
  const whereConditions: any = {};

  if (params.status && params.status !== 'all') {
    // For now, we'll use createdAt as a proxy for moderation status
    // In a real app, you'd add a moderationStatus field to the Job model
    if (params.status === 'pending') {
      whereConditions.createdAt = {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      };
    }
  }

  if (params.company) {
    whereConditions.company = {
      contains: params.company,
      mode: 'insensitive',
    };
  }

  // Sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortBy]: sortOrder };

  // Fetch jobs for moderation
  const [jobs, totalCount, pendingCount, flaggedCount] = await Promise.all([
    prisma.job.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy,
      include: {
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
    }),
    prisma.job.count({ where: whereConditions }),
    // Mock pending count - in real app this would be based on moderation status
    prisma.job.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    // Mock flagged count
    Promise.resolve(3),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const moderationStats = {
    total: totalCount,
    pending: pendingCount,
    flagged: flaggedCount,
    approved: totalCount - pendingCount - flaggedCount,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Moderation</h1>
          <p className="mt-1 text-gray-600">
            Review and moderate job listings submitted to the platform
          </p>
        </div>

        {/* Stats */}
        <div className="flex space-x-4">
          <div className="rounded-lg border bg-white px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-xl font-semibold text-orange-600">
              {moderationStats.pending}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-500">Flagged</div>
            <div className="text-xl font-semibold text-red-600">
              {moderationStats.flagged}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-4 py-2 shadow-sm">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl font-semibold text-gray-900">
              {moderationStats.total}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <JobModerationFilters currentFilters={params} stats={moderationStats} />

      {/* Moderation Table */}
      <JobModerationTable
        jobs={jobs.map(job => ({
          ...job,
          company:
            typeof job.company === 'string'
              ? { name: job.company }
              : job.company,
          applicationCount: job._count.jobApplications,
          salaryMin: job.salaryMin ?? undefined,
          salaryMax: job.salaryMax ?? undefined,
        }))}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
