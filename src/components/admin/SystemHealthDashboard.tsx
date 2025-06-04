'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Zap,
  XCircle,
} from 'lucide-react';

interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  databaseConnections: number;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
  lastUpdated: Date;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastCheck: Date;
}

export default function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    status: 'healthy',
    uptime: '99.9%',
    responseTime: 245,
    errorRate: 0.02,
    activeUsers: 1247,
    databaseConnections: 45,
    memoryUsage: 68,
    diskUsage: 42,
    cpuUsage: 23,
    lastUpdated: new Date(),
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Web Server',
      status: 'online',
      responseTime: 120,
      lastCheck: new Date(),
    },
    {
      name: 'Database',
      status: 'online',
      responseTime: 45,
      lastCheck: new Date(),
    },
    {
      name: 'Redis Cache',
      status: 'online',
      responseTime: 12,
      lastCheck: new Date(),
    },
    {
      name: 'Email Service',
      status: 'online',
      responseTime: 89,
      lastCheck: new Date(),
    },
    {
      name: 'File Storage',
      status: 'online',
      responseTime: 156,
      lastCheck: new Date(),
    },
    {
      name: 'Search Engine',
      status: 'degraded',
      responseTime: 890,
      lastCheck: new Date(),
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          status: data.status,
          uptime: data.application.uptime.formatted,
          responseTime: data.performance.apiResponseTime,
          errorRate: data.performance.errorRate || 0,
          activeUsers: data.users.activeLastDay,
          databaseConnections: data.database?.connections || 0,
          memoryUsage: Math.round((data.application.memory.heapUsed / data.application.memory.heapTotal) * 100),
          diskUsage: data.system?.diskUsage || 0,
          cpuUsage: data.system?.cpuUsage || 0,
          lastUpdated: new Date(data.timestamp),
        });

        // Update services based on health checks
        setServices([
          {
            name: 'Web Server',
            status: data.healthChecks.responseTime ? 'online' : 'degraded',
            responseTime: data.performance.apiResponseTime,
            lastCheck: new Date(data.timestamp),
          },
          {
            name: 'Database',
            status: data.healthChecks.database ? 'online' : 'offline',
            responseTime: data.performance.dbResponseTime,
            lastCheck: new Date(data.timestamp),
          },
          {
            name: 'Memory',
            status: data.healthChecks.memory ? 'online' : 'degraded',
            responseTime: data.application.memory.heapUsed,
            lastCheck: new Date(data.timestamp),
          },
          {
            name: 'User Activity',
            status: data.healthChecks.userActivity ? 'online' : 'degraded',
            responseTime: data.users.activeLastHour,
            lastCheck: new Date(data.timestamp),
          },
        ]);
      } else {
        console.error('Failed to fetch health metrics');
      }
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    // Initial data fetch
    refreshMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Status and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge
            className={`${getStatusColor(metrics.status)} flex items-center space-x-1`}
          >
            {getStatusIcon(metrics.status)}
            <span className="capitalize">{metrics.status}</span>
          </Badge>
          <span className="text-sm text-gray-500">
            Last updated: {metrics.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <Button
          onClick={refreshMetrics}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.uptime}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.errorRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Current resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.cpuUsage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.cpuUsage)}`}
                  style={{ width: `${metrics.cpuUsage}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.memoryUsage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.memoryUsage)}`}
                  style={{ width: `${metrics.memoryUsage}%` }}
                />
              </div>
            </div>

            {/* Disk Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {metrics.diskUsage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.diskUsage)}`}
                  style={{ width: `${metrics.diskUsage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Status of critical system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {service.name === 'Web Server' && (
                      <Globe className="h-4 w-4 text-gray-600" />
                    )}
                    {service.name === 'Database' && (
                      <Database className="h-4 w-4 text-gray-600" />
                    )}
                    {service.name === 'Redis Cache' && (
                      <Zap className="h-4 w-4 text-gray-600" />
                    )}
                    {service.name === 'Email Service' && (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                    {service.name === 'File Storage' && (
                      <HardDrive className="h-4 w-4 text-gray-600" />
                    )}
                    {service.name === 'Search Engine' && (
                      <Server className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <Badge
                    className={`${getStatusColor(service.status)} flex items-center space-x-1`}
                  >
                    {getStatusIcon(service.status)}
                    <span className="capitalize">{service.status}</span>
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {service.responseTime}ms
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.lastCheck.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Database Performance</CardTitle>
          <CardDescription>
            Database connection and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.databaseConnections}
              </div>
              <p className="text-sm text-gray-600">Active Connections</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.responseTime}ms
              </div>
              <p className="text-sm text-gray-600">Avg Query Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(metrics.memoryUsage / 1024).toFixed(1)}MB
              </div>
              <p className="text-sm text-gray-600">Memory Usage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
