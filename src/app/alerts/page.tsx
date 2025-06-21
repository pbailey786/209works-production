'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from 'lucide-react';
import { Card } from '@/components/ui/dialog';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface JobAlert {
  id: string;
  type: string;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  jobTitle?: string;
  keywords: string[];
  location?: string;
  categories: string[];
  jobTypes: string[];
  companies: string[];
  salaryMin?: number;
  salaryMax?: number;
  emailEnabled: boolean;
  totalJobsSent: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalNotifications: number;
    recentMatches: number;
    lastMatchDate?: string;
  };
}

interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  emailStats: Record<string, number>;
}

const JOB_CATEGORIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Sales',
  'Engineering',
  'Design',
  'Customer Service',
  'Administration',
  'Other',
];

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'volunteer', label: 'Volunteer' },
];

const FREQUENCY_OPTIONS = [
  {
    value: 'immediate',
    label: 'Immediate',
    description: 'Get notified as soon as new jobs match'
  },
  { value: 'daily', label: 'Daily', description: 'Daily digest at 9 AM' },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Weekly summary every Monday'
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Monthly report on the 1st'
  },
];

export default function AlertsPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [newAlert, setNewAlert] = useState({
    jobTitle: '',
    keywords: [] as string[],
    location: '',
    categories: [] as string[],
    jobTypes: [] as string[],
    companies: [] as string[],
    salaryMin: undefined as number | undefined,
    salaryMax: undefined as number | undefined,
    frequency: 'daily' as const
  });

  // Load alerts on component mount
  useEffect(() => {
    if (isLoaded && user) {
      loadAlerts();
    }
  }, [isLoaded, user]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to load alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    try {
      // Transform the data to match the current API format
      const alertData = {
        type: 'job_title_alert', // Default type
        frequency: newAlert.frequency,
        jobTitle: newAlert.jobTitle,
        keywords: newAlert.keywords,
        location: newAlert.location,
        categories: newAlert.categories,
        jobTypes: newAlert.jobTypes,
        companies: newAlert.companies,
        salaryMin: newAlert.salaryMin,
        salaryMax: newAlert.salaryMax,
        emailEnabled: true
      };

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });

      if (!response.ok) throw new Error('Failed to create alert');

      toast({
        title: 'Success',
        description: 'Alert created successfully!'
      });

      setIsCreateDialogOpen(false);
      resetNewAlert();
      loadAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to create alert. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const updateAlert = async (alertId: string, updates: Partial<JobAlert>) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update alert');

      toast({
        title: 'Success',
        description: 'Alert updated successfully!'
      });

      loadAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      toast({
        title: 'Success',
        description: 'Alert deleted successfully!'
      });

      loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    await updateAlert(alertId, { isActive });
  };

  const resetNewAlert = () => {
    setNewAlert({
      jobTitle: '',
      keywords: [],
      location: '',
      categories: [],
      jobTypes: [],
      companies: [],
      salaryMin: undefined,
      salaryMax: undefined,
      frequency: 'daily'
    });
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !newAlert.keywords.includes(keyword)) {
      setNewAlert(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setNewAlert(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  if (!isLoaded || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold">Job Alerts</h1>
        <p className="mb-6 text-gray-700">
          Please sign in to manage your job alerts.
        </p>
        <Button onClick={() => (window.location.href = '/signin')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Alerts</h1>
          <p className="mt-2 text-gray-600">
            Stay updated with job opportunities that match your preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/alerts/analytics')}
          >
            📊 Analytics
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="job-title">Job Title *</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g., Senior Developer, Marketing Manager"
                      value={newAlert.jobTitle}
                      onChange={e =>
                        setNewAlert(prev => ({
                          ...prev,
                          jobTitle: e.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="alert-frequency">
                      Notification Frequency
                    </Label>
                    <Select
                      value={newAlert.frequency}
                      onValueChange={(value: any) =>
                        setNewAlert(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Job Criteria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Criteria</h3>

                  {/* Keywords */}
                  <div>
                    <Label>Keywords</Label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {newAlert.keywords.map(keyword => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add keywords (press Enter)"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State or ZIP code"
                      value={newAlert.location}
                      onChange={e =>
                        setNewAlert(prev => ({
                          ...prev,
                          location: e.target.value
                        }))
                      }
                    />
                  </div>

                  {/* Job Types */}
                  <div>
                    <Label>Job Types</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {JOB_TYPES.map(type => (
                        <div
                          key={type.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`job-type-${type.value}`}
                            checked={newAlert.jobTypes.includes(type.value)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setNewAlert(prev => ({
                                  ...prev,
                                  jobTypes: [...prev.jobTypes, type.value]
                                }));
                              } else {
                                setNewAlert(prev => ({
                                  ...prev,
                                  jobTypes: prev.jobTypes.filter(
                                    t => t !== type.value
                                  )
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`job-type-${type.value}`}>
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary-min">Min Salary</Label>
                      <Input
                        id="salary-min"
                        type="number"
                        placeholder="50000"
                        value={newAlert.salaryMin || ''}
                        onChange={e =>
                          setNewAlert(prev => ({
                            ...prev,
                            salaryMin: e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary-max">Max Salary</Label>
                      <Input
                        id="salary-max"
                        type="number"
                        placeholder="100000"
                        value={newAlert.salaryMax || ''}
                        onChange={e =>
                          setNewAlert(prev => ({
                            ...prev,
                            salaryMax: e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createAlert} disabled={!newAlert.jobTitle}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold">{stats.totalAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold">
                    {stats.emailStats.sent || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.emailStats.sent
                      ? Math.round(
                          ((stats.emailStats.delivered || 0) /
                            stats.emailStats.sent) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold">No Job Alerts</h3>
              <p className="mb-4 text-gray-600">
                Create your first job alert to get notified about opportunities
                that match your preferences.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map(alert => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">
                      {alert.jobTitle || 'Job Alert'}
                    </CardTitle>
                    <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                      {alert.isActive ? 'Active' : 'Paused'}
                    </Badge>
                    <Badge variant="outline">
                      {
                        FREQUENCY_OPTIONS.find(f => f.value === alert.frequency)
                          ?.label
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={checked =>
                        toggleAlert(alert.id, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAlert(alert)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Keywords
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {alert.keywords.length > 0 ? (
                        alert.keywords.map(keyword => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">
                          No keywords
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Location
                    </p>
                    <p className="text-sm">
                      {alert.location || 'Any location'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Job Types
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {alert.jobTypes.length > 0 ? (
                        alert.jobTypes.map(type => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs"
                          >
                            {JOB_TYPES.find(t => t.value === type)?.label ||
                              type}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">All types</span>
                      )}
                    </div>
                  </div>
                </div>

                {alert.stats && (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-gray-600">
                        Total notifications:
                      </span>
                      <span className="ml-2 font-medium">
                        {alert.stats.totalNotifications}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Recent matches:</span>
                      <span className="ml-2 font-medium">
                        {alert.stats.recentMatches}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last sent:</span>
                      <span className="ml-2 font-medium">
                        {alert.lastTriggered
                          ? new Date(alert.lastTriggered).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
