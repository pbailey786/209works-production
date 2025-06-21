import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from 'lucide-react';

export const metadata = {
  title: 'Email Management | Admin Dashboard',
  description: 'Manage email templates, campaigns, and delivery settings'
};

export default async function EmailManagementPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! }
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/email');
  }

  const userRole = user?.role || 'guest';
  // Temporarily allow admin users to access email management
  if (userRole !== 'admin' && !hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
    redirect('/admin');
  }

  // Mock email system data (replace with real data)
  const emailStats = {
    totalSent: 15420,
    deliveryRate: 98.5,
    openRate: 24.8,
    clickRate: 3.2,
    activeTemplates: 8,
    activeCampaigns: 3,
    queuedEmails: 127,
    failedEmails: 23
  };

  const recentCampaigns = [
    {
      id: '1',
      name: 'Weekly Job Digest',
      type: 'weekly-digest',
      status: 'completed',
      sent: 2450,
      delivered: 2398,
      opened: 612,
      clicked: 89,
      sentAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'New Job Alerts',
      type: 'job-alert',
      status: 'sending',
      sent: 156,
      delivered: 152,
      opened: 0,
      clicked: 0,
      sentAt: '2024-01-16T14:30:00Z'
    },
    {
      id: '3',
      name: 'Welcome Series',
      type: 'welcome-email',
      status: 'scheduled',
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      sentAt: '2024-01-17T09:00:00Z'
    },
  ];

  const emailTemplates = [
    { id: 'job-alert', name: 'Job Alert', category: 'job_seeker', status: 'active', lastUsed: '2024-01-16' },
    { id: 'weekly-digest', name: 'Weekly Digest', category: 'job_seeker', status: 'active', lastUsed: '2024-01-15' },
    { id: 'welcome-email', name: 'Welcome Email', category: 'system', status: 'active', lastUsed: '2024-01-14' },
    { id: 'password-reset', name: 'Password Reset', category: 'system', status: 'active', lastUsed: '2024-01-13' },
    { id: 'application-confirmation', name: 'Application Confirmation', category: 'job_seeker', status: 'draft', lastUsed: null },
    { id: 'new-applicant', name: 'New Applicant Alert', category: 'employer', status: 'active', lastUsed: '2024-01-16' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700';
      case 'sending': return 'bg-blue-50 text-blue-700';
      case 'scheduled': return 'bg-yellow-50 text-yellow-700';
      case 'failed': return 'bg-red-50 text-red-700';
      case 'active': return 'bg-green-50 text-green-700';
      case 'draft': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_seeker': return 'bg-blue-50 text-blue-700';
      case 'employer': return 'bg-purple-50 text-purple-700';
      case 'system': return 'bg-gray-50 text-gray-700';
      case 'marketing': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
          <p className="text-muted-foreground">
            Manage email templates, campaigns, and delivery settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/email/test">
              <TestTube className="mr-2 h-4 w-4" />
              Test Email
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/email/campaigns/new">
              <Send className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.totalSent.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.deliveryRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.3%</span>
              <span className="ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.openRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+1.2%</span>
              <span className="ml-1">vs industry avg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.clickRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Email system health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Email Service</span>
                    </div>
                    <Badge className="bg-green-50 text-green-700">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Queue Processing</span>
                    </div>
                    <Badge className="bg-yellow-50 text-yellow-700">{emailStats.queuedEmails} queued</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Failed Deliveries</span>
                    </div>
                    <Badge className="bg-red-50 text-red-700">{emailStats.failedEmails} failed</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Active Templates</span>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700">{emailStats.activeTemplates} templates</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common email management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/email/test">
                      <TestTube className="mr-2 h-4 w-4" />
                      Send Test Email
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/email/templates">
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Templates
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/email/campaigns">
                      <Send className="mr-2 h-4 w-4" />
                      View Campaigns
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/analytics/email">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Email Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Email campaigns and their performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.status === 'scheduled' ? 'Scheduled for' : 'Sent'} {new Date(campaign.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{campaign.sent.toLocaleString()}</div>
                        <div className="text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{campaign.delivered.toLocaleString()}</div>
                        <div className="text-muted-foreground">Delivered</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{campaign.opened.toLocaleString()}</div>
                        <div className="text-muted-foreground">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{campaign.clicked.toLocaleString()}</div>
                        <div className="text-muted-foreground">Clicked</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage and customize email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={getCategoryColor(template.category)}>
                            {template.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(template.status)}>
                            {template.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/email/templates/${template.id}/preview`}>
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/email/templates/${template.id}/edit`}>
                            <Settings className="mr-1 h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {template.lastUsed && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Last used: {new Date(template.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email delivery settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">SMTP Settings</h4>
                    <div className="text-sm text-gray-600">
                      <div>Provider: Resend</div>
                      <div>Status: Connected</div>
                      <div>From Address: {process.env.RESEND_EMAIL_FROM || 'noreply@209.works'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limits</h4>
                    <div className="text-sm text-gray-600">
                      <div>Hourly Limit: 1,000 emails</div>
                      <div>Daily Limit: 10,000 emails</div>
                      <div>Batch Size: 50 emails</div>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/admin/email/test">
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Configuration
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
