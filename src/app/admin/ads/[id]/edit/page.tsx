// // import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
// import authOptions from '../../../../api/auth/authOptions'; // TODO: Replace with Clerk
// import { hasPermission, Permission } from '@/lib/rbac/permissions'; // TODO: Replace with Clerk
import { prisma } from '@/lib/database/prisma';
import AdEditForm from '@/components/admin/AdEditForm';
// // import type { Session } from 'next-auth'; // TODO: Replace with Clerk // TODO: Replace with Clerk

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAdPage({ params }: PageProps) {
  const { id } = await params;

  // TODO: Replace with Clerk authentication
  const session = { user: { role: 'admin', name: 'Admin User' } }; // Mock session
  const userRole = 'admin'; // Mock admin role

  // Mock authentication check - always allow for now
  // if (!session) {
  //   redirect('/signin?redirect=/admin/ads');
  // }

  // Mock permission check - always allow for now
  // if (!true // TODO: Replace with Clerk permissions) {
  //   redirect('/admin');
  // }

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
