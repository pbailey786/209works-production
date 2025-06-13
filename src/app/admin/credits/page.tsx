import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '@/app/api/auth/authOptions';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/database/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import CreditManagementDashboard from '@/components/admin/CreditManagementDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

async function getCreditData() {
  try {
    // Get credit statistics
    const [
      totalCreditsIssued,
      totalCreditsUsed,
      totalCreditsExpired,
      recentTransactions,
      topCreditUsers,
      creditsByType,
    ] = await Promise.all([
      // Total credits issued
      prisma.jobPostingCredit.count(),
      
      // Total credits used
      prisma.jobPostingCredit.count({
        where: { isUsed: true }
      }),
      
      // Total credits expired
      prisma.jobPostingCredit.count({
        where: {
          expiresAt: { lt: new Date() },
          isUsed: false
        }
      }),
      
      // Recent credit transactions (last 50)
      prisma.jobPostingPurchase.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          credits: {
            select: {
              type: true,
              isUsed: true,
              usedAt: true,
            }
          }
        }
      }),
      
      // Top credit users
      prisma.user.findMany({
        where: {
          jobPostingCredits: {
            some: {}
          }
        },
        include: {
          _count: {
            select: {
              jobPostingCredits: true
            }
          },
          jobPostingCredits: {
            select: {
              type: true,
              isUsed: true,
              expiresAt: true,
            }
          }
        },
        orderBy: {
          jobPostingCredits: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Credits by type
      prisma.jobPostingCredit.groupBy({
        by: ['type'],
        _count: {
          id: true
        }
      })
    ]);

    return {
      totalCreditsIssued,
      totalCreditsUsed,
      totalCreditsExpired,
      activeCredits: totalCreditsIssued - totalCreditsUsed - totalCreditsExpired,
      recentTransactions,
      topCreditUsers,
      creditsByType,
    };
  } catch (error) {
    console.error('Error fetching credit data:', error);
    return {
      totalCreditsIssued: 0,
      totalCreditsUsed: 0,
      totalCreditsExpired: 0,
      activeCredits: 0,
      recentTransactions: [],
      topCreditUsers: [],
      creditsByType: [],
    };
  }
}

export default async function AdminCreditsPage() {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session?.user?.email) {
    redirect('/signin');
  }

  // Get user with role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || !hasPermission(user.role, Permission.VIEW_USERS)) {
    redirect('/');
  }

  const creditData = await getCreditData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
          <p className="mt-1 text-gray-600">
            Manage job posting credits, transactions, and user balances
          </p>
        </div>
      </div>

      <Suspense fallback={<CreditManagementSkeleton />}>
        <CreditManagementDashboard creditData={creditData} />
      </Suspense>
    </div>
  );
}

function CreditManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-56" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
