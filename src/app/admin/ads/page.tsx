import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import AdManagementStats from '@/components/admin/AdManagementStats';
import AdManagementFilters from '@/components/admin/AdManagementFilters';
import AdManagementTable from '@/components/admin/AdManagementTable';
import { Card } from '@/components/ui/card';

interface SearchParams {
  status?: string;
  type?: string;
  advertiser?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default async function AdManagementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Parse search parameters
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const status = params.status;
  const type = params.type;
  const advertiser = params.advertiser;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;

  // Build where clause for filtering
  const where: any = {};

  if (status) {
    // Map status to the simple Advertisement model
    if (status === 'active') {
      where.AND = [
        { startDate: { lte: new Date() } },
        { endDate: { gte: new Date() } },
      ];
    } else if (status === 'expired') {
      where.endDate = { lt: new Date() };
    } else if (status === 'scheduled') {
      where.startDate = { gt: new Date() };
    }
  }

  if (advertiser) {
    where.businessName = { contains: advertiser, mode: 'insensitive' };
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Get advertisements with pagination
  const [ads, totalCount] = await Promise.all([
    prisma.advertisement.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.advertisement.count({ where }),
  ]);

  // Get statistics
  const stats = await Promise.all([
    prisma.advertisement.count(),
    prisma.advertisement.count({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.advertisement.count({
      where: { startDate: { gt: new Date() } },
    }),
    prisma.advertisement.count({
      where: { endDate: { lt: new Date() } },
    }),
  ]);

  const [totalAds, activeAds, scheduledAds, expiredAds] = stats;

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Advertisement Management
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all advertisements on the platform
          </p>
        </div>
        <Link href="/admin/ads/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ad
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <AdManagementStats
        totalAds={totalAds}
        activeAds={activeAds}
        scheduledAds={scheduledAds}
        expiredAds={expiredAds}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter advertisements by status, type, advertiser, and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdManagementFilters />
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisements ({totalCount})</CardTitle>
          <CardDescription>All advertisements on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <AdManagementTable
            ads={ads}
            totalCount={totalCount}
            currentPage={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            limit={limit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
