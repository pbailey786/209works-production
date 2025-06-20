import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { prisma } from '@/lib/database/prisma';
import {
  Shield,
  FileText,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Eye,
  Flag,
} from 'lucide-react';

export const metadata = {
  title: 'Content Moderation | Admin Dashboard',
  description: 'Manage content moderation for jobs, users, and reports',
};

export default async function ModerationPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/moderation');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_MODERATION_QUEUE)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate jobs, user reports, and platform content
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">+3</span> since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+1</span> new report
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.3h</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Moderation
            </CardTitle>
            <CardDescription>
              Review job postings for compliance and quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pending Review</p>
                <p className="text-sm text-muted-foreground">12 jobs waiting for approval</p>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                12 pending
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Flagged Content</p>
                <p className="text-sm text-muted-foreground">Jobs flagged by AI or users</p>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                2 flagged
              </Badge>
            </div>

            <Button asChild className="w-full">
              <Link href="/admin/moderation/jobs">
                <Eye className="mr-2 h-4 w-4" />
                Review Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              User Reports
            </CardTitle>
            <CardDescription>
              Handle user reports and complaints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Reports</p>
                <p className="text-sm text-muted-foreground">3 reports need attention</p>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                3 new
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">In Progress</p>
                <p className="text-sm text-muted-foreground">Reports being investigated</p>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                1 active
              </Badge>
            </div>

            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/moderation/reports">
                <Flag className="mr-2 h-4 w-4" />
                Review Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Moderation Activity</CardTitle>
          <CardDescription>Latest moderation actions and decisions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Job approved: "Software Engineer at TechCorp"</p>
                <p className="text-xs text-muted-foreground">Approved by Admin • 2 hours ago</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Job rejected: "Work from home - Easy money"</p>
                <p className="text-xs text-muted-foreground">Rejected by Admin • 4 hours ago</p>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">User report resolved: Spam complaint</p>
                <p className="text-xs text-muted-foreground">Resolved by Admin • 6 hours ago</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Resolved</Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Job flagged by AI: Potential duplicate content</p>
                <p className="text-xs text-muted-foreground">Flagged by system • 8 hours ago</p>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">Flagged</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
