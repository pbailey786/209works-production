import { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Award,
  BarChart3,
  UserCheck,
  Crown,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard | 209jobs',
  description: 'Administrative dashboard for managing the 209jobs platform.',
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of platform performance and key metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Employers
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,456</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$89,247</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18.7%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Premium Job Seekers
              </CardTitle>
              <CardDescription>$19/month subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-purple-600">
                2,847
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Revenue:</span>
                  <span className="font-medium">$54,093</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate:</span>
                  <span className="font-medium">22.1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Churn Rate:</span>
                  <span className="font-medium">3.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Employer Plans
              </CardTitle>
              <CardDescription>Basic, Pro & Enterprise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Basic ($49/mo)</span>
                  <Badge variant="secondary">847 active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pro ($149/mo)</span>
                  <Badge variant="default">356 active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enterprise (Custom)</span>
                  <Badge variant="outline">44 active</Badge>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Revenue:</span>
                    <span>$35,154/mo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Chamber Partnerships
              </CardTitle>
              <CardDescription>25% discount program</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-green-600">247</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Members:</span>
                  <span className="font-medium">1,847</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount Applied:</span>
                  <span className="font-medium">$8,923</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate:</span>
                  <span className="font-medium">34.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New employer signup</p>
                    <p className="text-xs text-gray-500">
                      TechCorp Industries - Pro Plan
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">2m ago</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Premium upgrade</p>
                    <p className="text-xs text-gray-500">
                      Sarah M. upgraded to Premium
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">5m ago</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Chamber partnership</p>
                    <p className="text-xs text-gray-500">
                      Modesto Chamber verified
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">12m ago</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job posting spike</p>
                    <p className="text-xs text-gray-500">
                      +47 new jobs in Healthcare
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">18m ago</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System alert</p>
                    <p className="text-xs text-gray-500">
                      High server load detected
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">25m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/users">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Users</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Analytics</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/moderation">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Moderation</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/reports">
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Reports</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/settings">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/health">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">System Health</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
            <CardDescription>
              Current platform health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">247ms</div>
                <p className="text-sm text-gray-600">Avg Response</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">1,247</div>
                <p className="text-sm text-gray-600">Active Sessions</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">23.4GB</div>
                <p className="text-sm text-gray-600">Data Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
