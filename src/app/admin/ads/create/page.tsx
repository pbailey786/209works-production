import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { hasPermission, Permission } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { ArrowLeft } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function CreateAdPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/ads/create');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/ads"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ads
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create Advertisement
            </h1>
            <p className="text-muted-foreground">
              Create a new advertisement for the platform
            </p>
          </div>
        </div>
      </div>

      {/* Ad Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Details</CardTitle>
          <CardDescription>
            Fill in the details for the new advertisement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}
