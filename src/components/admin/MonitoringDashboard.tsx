'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    redis: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    external_apis: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      services: Array<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        error?: string;
      }>;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      usage: number;
      limit: number;
    };
  };
}

interface SystemMetrics {
  activeUsers: number;
  totalJobs: number;
  totalApplications: number;
  apiRequests24h: number;
  errorRate: number;
  avgResponseTime: number;
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch health status
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    }
  };

  // Fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHealthStatus(), fetchSystemMetrics()]);
      setLoading(false);
      setLastUpdated(new Date());
    };

    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchHealthStatus(), fetchSystemMetrics()]);
    setLoading(false);
    setLastUpdated(new Date());
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) => {
    const variants = {
      healthy: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      degraded: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      unhealthy: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' }
    };

    const { variant, icon: Icon, color } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !healthStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <StatusBadge status={healthStatus.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatUptime(healthStatus.uptime)}</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthStatus.version}</div>
                <div className="text-sm text-gray-600">Version</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold capitalize">{healthStatus.environment}</div>
                <div className="text-sm text-gray-600">Environment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Date(healthStatus.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-600">Last Check</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Health Checks Tab */}
        <TabsContent value="health" className="space-y-4">
          {healthStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <StatusBadge status={healthStatus.checks.database.status} />
                    <div className="text-sm text-gray-600">
                      Response: {healthStatus.checks.database.responseTime}ms
                    </div>
                    {healthStatus.checks.database.error && (
                      <div className="text-xs text-red-600">
                        {healthStatus.checks.database.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Redis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Redis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <StatusBadge status={healthStatus.checks.redis.status} />
                    <div className="text-sm text-gray-600">
                      Response: {healthStatus.checks.redis.responseTime}ms
                    </div>
                    {healthStatus.checks.redis.error && (
                      <div className="text-xs text-red-600">
                        {healthStatus.checks.redis.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Memory */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MemoryStick className="h-4 w-4" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <StatusBadge status={healthStatus.checks.memory.status} />
                    <div className="text-sm text-gray-600">
                      {healthStatus.checks.memory.usage}MB / {healthStatus.checks.memory.limit}MB
                    </div>
                    <Progress 
                      value={(healthStatus.checks.memory.usage / healthStatus.checks.memory.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* External APIs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    External APIs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <StatusBadge status={healthStatus.checks.external_apis.status} />
                    <div className="text-xs text-gray-600">
                      {healthStatus.checks.external_apis.services.length} services
                    </div>
                    {healthStatus.checks.external_apis.services.map((service, index) => (
                      <div key={index} className="text-xs">
                        <span className={service.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                          {service.name}: {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* System Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {systemMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Currently online</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Total Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.totalJobs.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Active listings</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.totalApplications.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total submitted</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    API Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.apiRequests24h.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Last 24 hours</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Error Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.errorRate.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Last 24 hours</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.avgResponseTime}ms</div>
                  <div className="text-sm text-gray-600">API endpoints</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>
                Real-time performance metrics and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Performance charts and detailed metrics will be displayed here.
                <br />
                Integration with monitoring services like DataDog or New Relic recommended.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
