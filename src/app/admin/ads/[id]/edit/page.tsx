import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { notFound } from '@/components/ui/card';
import { hasPermission, Permission } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';


interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAdPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = user?.role || 'guest';
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
