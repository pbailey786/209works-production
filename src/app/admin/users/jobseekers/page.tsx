import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { prisma } from 'lucide-react';

export const metadata = {
  title: 'Job Seeker Management | Admin Dashboard',
  description: 'Manage job seeker accounts and their activities'
};

export default async function JobSeekersPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! }
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/users/jobseekers');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_USERS)) {
    redirect('/admin');
  }

  // Mock data for job seekers (replace with real database queries)
  const jobSeekers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(209) 555-0123',
      location: 'Stockton, CA',
      status: 'active',
      joinedAt: '2024-01-08T00:00:00Z',
      lastLogin: '2024-01-15T10:30:00Z',
      applicationsSubmitted: 15,
      profileCompleteness: 85,
      jobAlertsActive: 3,
      chatSessionsCount: 12,
      preferredCategories: ['Technology', 'Engineering']
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '(209) 555-0456',
      location: 'Modesto, CA',
      status: 'active',
      joinedAt: '2024-01-12T00:00:00Z',
      lastLogin: '2024-01-15T14:20:00Z',
      applicationsSubmitted: 8,
      profileCompleteness: 92,
      jobAlertsActive: 5,
      chatSessionsCount: 7,
      preferredCategories: ['Healthcare', 'Administration']
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '(209) 555-0789',
      location: 'Fresno, CA',
      status: 'inactive',
      joinedAt: '2023-12-15T00:00:00Z',
      lastLogin: '2024-01-05T09:15:00Z',
      applicationsSubmitted: 3,
      profileCompleteness: 45,
      jobAlertsActive: 1,
      chatSessionsCount: 2,
      preferredCategories: ['Retail', 'Customer Service']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700';
      case 'inactive': return 'bg-gray-50 text-gray-700';
      case 'suspended': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Seeker Management</h1>
        <p className="text-muted-foreground">
          Manage job seeker accounts, profiles, and activities
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Job Seekers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobSeekers.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobSeekers.filter(js => js.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((jobSeekers.filter(js => js.status === 'active').length / jobSeekers.length) * 100)}% active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobSeekers.reduce((sum, js) => sum + js.applicationsSubmitted, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(jobSeekers.reduce((sum, js) => sum + js.applicationsSubmitted, 0) / jobSeekers.length)} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobSeekers.reduce((sum, js) => sum + js.chatSessionsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              JobsGPT sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Seekers List */}
      <Card>
        <CardHeader>
          <CardTitle>Job Seeker Accounts</CardTitle>
          <CardDescription>All registered job seekers and their account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobSeekers.map((jobSeeker) => (
              <div key={jobSeeker.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{jobSeeker.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(jobSeeker.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getStatusColor(jobSeeker.status)}>
                      {jobSeeker.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{jobSeeker.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{jobSeeker.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Last login: {new Date(jobSeeker.lastLogin).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{jobSeeker.applicationsSubmitted}</div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getCompletenessColor(jobSeeker.profileCompleteness)}`}>
                      {jobSeeker.profileCompleteness}%
                    </div>
                    <div className="text-xs text-muted-foreground">Profile Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{jobSeeker.jobAlertsActive}</div>
                    <div className="text-xs text-muted-foreground">Job Alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{jobSeeker.chatSessionsCount}</div>
                    <div className="text-xs text-muted-foreground">AI Chats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{jobSeeker.preferredCategories.length}</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Preferred Categories:</span>
                    <div className="flex gap-1 mt-1">
                      {jobSeeker.preferredCategories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Applications
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat History
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Account
                  </Button>
                  {jobSeeker.status === 'active' ? (
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
