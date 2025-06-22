// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdCreationForm from '@/components/admin/AdCreationForm';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export default async function CreateAdPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads/create');
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

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
