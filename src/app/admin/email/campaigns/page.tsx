import { useState } from '@/components/ui/card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

'use client';

  Send, 
  Calendar, 
  Users, 
  TrendingUp, 
  ArrowLeft,
  Plus,
  Eye,
  Play,
  Pause,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
}

export default function EmailCampaignsPage() {
  const [activeTab, setActiveTab] = useState('all');

  // Mock campaign data (replace with real data)
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Weekly Job Digest - January 2024',
      type: 'weekly-digest',
      status: 'completed',
      recipients: 2450,
      sent: 2450,
      delivered: 2398,
      opened: 612,
      clicked: 89,
      createdAt: '2024-01-15T08:00:00Z',
      sentAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:15:00Z',
    },
    {
      id: '2',
      name: 'New Job Alerts - Tech Positions',
      type: 'job-alert',
      status: 'sending',
      recipients: 156,
      sent: 98,
      delivered: 95,
      opened: 23,
      clicked: 4,
      createdAt: '2024-01-16T14:00:00Z',
      sentAt: '2024-01-16T14:30:00Z',
    },
    {
      id: '3',
      name: 'Welcome Series - New Users',
      type: 'welcome-email',
      status: 'scheduled',
      recipients: 45,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: '2024-01-16T16:00:00Z',
      scheduledAt: '2024-01-17T09:00:00Z',
    },
    {
      id: '4',
      name: 'Healthcare Jobs - Weekly Update',
      type: 'job-alert',
      status: 'draft',
      recipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: '2024-01-16T18:00:00Z',
    },
    {
      id: '5',
      name: 'Monthly Newsletter - December',
      type: 'newsletter',
      status: 'failed',
      recipients: 1200,
      sent: 234,
      delivered: 220,
      opened: 45,
      clicked: 8,
      createdAt: '2024-12-28T10:00:00Z',
      sentAt: '2024-12-28T12:00:00Z',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'sending': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'sending': return <Send className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'draft': return <Eye className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    return campaign.status === activeTab;
  });

  const calculateOpenRate = (opened: number, delivered: number) => {
    if (delivered === 0) return 0;
    return ((opened / delivered) * 100).toFixed(1);
  };

  const calculateClickRate = (clicked: number, delivered: number) => {
    if (delivered === 0) return 0;
    return ((clicked / delivered) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/email">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Email Management
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your email campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/email/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.recipients, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            View and manage your email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({campaigns.filter(c => c.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="sending">
                Sending ({campaigns.filter(c => c.status === 'sending').length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({campaigns.filter(c => c.status === 'scheduled').length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({campaigns.filter(c => c.status === 'draft').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No campaigns found</p>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'all' 
                      ? 'Create your first email campaign to get started'
                      : `No ${activeTab} campaigns at the moment`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{campaign.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(campaign.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(campaign.status)}
                                <span>{campaign.status}</span>
                              </div>
                            </Badge>
                            <Badge variant="outline">
                              {campaign.type.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Created {new Date(campaign.createdAt).toLocaleDateString()}
                            {campaign.scheduledAt && (
                              <> • Scheduled for {new Date(campaign.scheduledAt).toLocaleDateString()}</>
                            )}
                            {campaign.sentAt && (
                              <> • Sent {new Date(campaign.sentAt).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Campaign Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{campaign.recipients.toLocaleString()}</div>
                          <div className="text-muted-foreground">Recipients</div>
                        </div>
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
                          <div className="font-medium">{calculateOpenRate(campaign.opened, campaign.delivered)}%</div>
                          <div className="text-muted-foreground">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{calculateClickRate(campaign.clicked, campaign.delivered)}%</div>
                          <div className="text-muted-foreground">Click Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
