import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Flag, 
  User, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { prisma } from '@/lib/database/prisma';

export const metadata = {
  title: 'User Reports | Admin Dashboard',
  description: 'Review and handle user reports and complaints',
};

export default async function UserReportsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/moderation/reports');
  }

  const userRole = user?.publicMetadata?.role || 'guest';
  if (!hasPermission(userRole, Permission.HANDLE_REPORTS)) {
    redirect('/admin');
  }

  // Mock data for reports (replace with real database queries)
  const reports = [
    {
      id: 1,
      type: 'job',
      title: 'Inappropriate job posting',
      description: 'This job posting contains discriminatory language',
      reportedBy: 'john.doe@email.com',
      reportedItem: 'Software Engineer at XYZ Corp',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T10:30:00Z',
      category: 'Discrimination'
    },
    {
      id: 2,
      type: 'user',
      title: 'Spam messages',
      description: 'User is sending spam messages to job seekers',
      reportedBy: 'jane.smith@email.com',
      reportedItem: 'employer@company.com',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-14T15:45:00Z',
      category: 'Spam'
    },
    {
      id: 3,
      type: 'job',
      title: 'Fake job posting',
      description: 'This appears to be a scam job posting asking for personal information',
      reportedBy: 'user@example.com',
      reportedItem: 'Work from Home - Easy Money',
      status: 'resolved',
      priority: 'high',
      createdAt: '2024-01-13T09:15:00Z',
      category: 'Fraud'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-700';
      case 'in_progress': return 'bg-blue-50 text-blue-700';
      case 'resolved': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'low': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Reports</h1>
        <p className="text-muted-foreground">
          Review and handle user reports and complaints
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>All user reports and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {report.type === 'job' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-purple-600" />
                      )}
                      <h3 className="font-medium">{report.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Reported by:</span>
                    <p className="text-muted-foreground">{report.reportedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium">Reported item:</span>
                    <p className="text-muted-foreground">{report.reportedItem}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{report.category}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p className="text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {report.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Reporter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
