import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Briefcase, 
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Ban,
  CheckCircle
} from 'lucide-react';
import type { Session } from 'next-auth';

export const metadata = {
  title: 'Employer Management | Admin Dashboard',
  description: 'Manage employer accounts and their activities',
};

export default async function EmployersPage() {
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/users/employers');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_USERS)) {
    redirect('/admin');
  }

  // Mock data for employers (replace with real database queries)
  const employers = [
    {
      id: 1,
      name: 'TechCorp Solutions',
      email: 'hr@techcorp.com',
      contactPerson: 'Sarah Johnson',
      phone: '(209) 555-0123',
      location: 'Stockton, CA',
      status: 'active',
      joinedAt: '2024-01-10T00:00:00Z',
      lastLogin: '2024-01-15T14:30:00Z',
      jobsPosted: 12,
      activeJobs: 8,
      totalApplications: 156,
      subscriptionPlan: 'premium'
    },
    {
      id: 2,
      name: 'Local Restaurant Group',
      email: 'hiring@localrestaurants.com',
      contactPerson: 'Mike Rodriguez',
      phone: '(209) 555-0456',
      location: 'Modesto, CA',
      status: 'active',
      joinedAt: '2024-01-05T00:00:00Z',
      lastLogin: '2024-01-14T09:15:00Z',
      jobsPosted: 6,
      activeJobs: 4,
      totalApplications: 89,
      subscriptionPlan: 'basic'
    },
    {
      id: 3,
      name: 'Central Valley Healthcare',
      email: 'careers@cvhealthcare.com',
      contactPerson: 'Dr. Lisa Chen',
      phone: '(209) 555-0789',
      location: 'Fresno, CA',
      status: 'suspended',
      joinedAt: '2023-12-20T00:00:00Z',
      lastLogin: '2024-01-12T16:45:00Z',
      jobsPosted: 3,
      activeJobs: 0,
      totalApplications: 23,
      subscriptionPlan: 'basic'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700';
      case 'suspended': return 'bg-red-50 text-red-700';
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-purple-50 text-purple-700';
      case 'basic': return 'bg-blue-50 text-blue-700';
      case 'free': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employer Management</h1>
        <p className="text-muted-foreground">
          Manage employer accounts, subscriptions, and activities
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employers.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employers.filter(e => e.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((employers.filter(e => e.status === 'active').length / employers.length) * 100)}% active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employers.reduce((sum, e) => sum + e.jobsPosted, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {employers.reduce((sum, e) => sum + e.activeJobs, 0)} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employers.reduce((sum, e) => sum + e.totalApplications, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(employers.reduce((sum, e) => sum + e.totalApplications, 0) / employers.reduce((sum, e) => sum + e.jobsPosted, 0))} per job
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employers List */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Accounts</CardTitle>
          <CardDescription>All registered employers and their account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employers.map((employer) => (
              <div key={employer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{employer.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact: {employer.contactPerson}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getPlanColor(employer.subscriptionPlan)}>
                      {employer.subscriptionPlan}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(employer.status)}>
                      {employer.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{employer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employer.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(employer.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{employer.jobsPosted}</div>
                    <div className="text-xs text-muted-foreground">Jobs Posted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{employer.activeJobs}</div>
                    <div className="text-xs text-muted-foreground">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{employer.totalApplications}</div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">
                      {Math.round(employer.totalApplications / employer.jobsPosted)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg per Job</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Account
                  </Button>
                  <Button size="sm" variant="outline">
                    <Briefcase className="mr-2 h-4 w-4" />
                    View Jobs
                  </Button>
                  {employer.status === 'active' ? (
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
