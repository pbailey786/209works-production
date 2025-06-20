import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { prisma } from '@/lib/database/prisma';
import {
  PlayCircle,
  PauseCircle,
  DollarSign,
  Eye,
  BarChart3,
  Calendar,
  Target,
  Users,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

export const metadata = {
  title: 'Ad Campaigns | Admin Dashboard',
  description: 'Manage advertising campaigns and promotions',
};

export default async function AdCampaignsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/ads/campaigns');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_AD_CAMPAIGNS)) {
    redirect('/admin');
  }

  // Mock data for ad campaigns (replace with real database queries)
  const campaigns = [
    {
      id: 1,
      name: 'Featured Job Placements - Q1 2024',
      type: 'job_promotion',
      status: 'active',
      budget: 500,
      spent: 342.50,
      impressions: 15420,
      clicks: 892,
      conversions: 45,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-03-31T23:59:59Z',
      targetAudience: 'Job Seekers in 209 Area',
      description: 'Promote featured job listings to increase visibility'
    },
    {
      id: 2,
      name: 'Employer Acquisition Campaign',
      type: 'employer_acquisition',
      status: 'active',
      budget: 1000,
      spent: 678.25,
      impressions: 8950,
      clicks: 234,
      conversions: 12,
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-02-29T23:59:59Z',
      targetAudience: 'HR Managers & Business Owners',
      description: 'Attract new employers to post jobs on the platform'
    },
    {
      id: 3,
      name: 'JobsGPT AI Feature Promotion',
      type: 'feature_promotion',
      status: 'paused',
      budget: 300,
      spent: 156.75,
      impressions: 5670,
      clicks: 445,
      conversions: 89,
      startDate: '2024-01-10T00:00:00Z',
      endDate: '2024-02-10T23:59:59Z',
      targetAudience: 'All Platform Users',
      description: 'Promote the AI-powered job search feature'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700';
      case 'paused': return 'bg-yellow-50 text-yellow-700';
      case 'completed': return 'bg-blue-50 text-blue-700';
      case 'draft': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job_promotion': return 'bg-blue-50 text-blue-700';
      case 'employer_acquisition': return 'bg-purple-50 text-purple-700';
      case 'feature_promotion': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    return impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  };

  const calculateCPC = (spent: number, clicks: number) => {
    return clicks > 0 ? (spent / clicks).toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground">
            Manage advertising campaigns and track performance
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/ads/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${campaigns.reduce((sum, c) => sum + c.spent, 0).toFixed(2)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.conversions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((campaigns.reduce((sum, c) => sum + c.conversions, 0) / campaigns.reduce((sum, c) => sum + c.clicks, 0)) * 100).toFixed(2)}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>All advertising campaigns and their performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getTypeColor(campaign.type)}>
                      {campaign.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Budget:</span>
                    <p className="text-muted-foreground">${campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Spent:</span>
                    <p className="text-muted-foreground">${campaign.spent.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Target:</span>
                    <p className="text-muted-foreground">{campaign.targetAudience}</p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-muted-foreground">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{campaign.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{campaign.clicks.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{campaign.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{calculateCTR(campaign.clicks, campaign.impressions)}%</div>
                    <div className="text-xs text-muted-foreground">CTR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">${calculateCPC(campaign.spent, campaign.clicks)}</div>
                    <div className="text-xs text-muted-foreground">CPC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-indigo-600">
                      {Math.round((campaign.spent / campaign.budget) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Budget Used</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Campaign
                  </Button>
                  {campaign.status === 'active' ? (
                    <Button size="sm" variant="outline">
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
