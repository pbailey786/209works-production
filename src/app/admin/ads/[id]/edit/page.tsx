import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import authOptions from '../../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/database/prisma';
import AdEditForm from '@/components/admin/AdEditForm';
import type { Session } from 'next-auth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAdPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  // Fetch the advertisement
  const ad = await prisma.advertisement.findFirst({
    where: {
      id: id,
      ...(userRole === 'employer'
        ? { businessName: (session!.user as any)?.name }
        : {}),
    },
  });

  if (!ad) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Advertisement
          </h1>
          <p className="text-muted-foreground">
            Update your advertisement details and settings
          </p>
        </div>

        <AdEditForm ad={ad} />
      </div>
    </div>
  );
}
