import React, { useState, useEffect, useCallback } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/card';
import { Progress } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';



  /**
 * Performance Monitoring Dashboard
 * Real-time performance tracking and system health monitoring
 */
'use client';
import {
  import {
  usePerformanceMonitor,
  CoreWebVitals,
  SystemHealthMetric,
  UserExperienceMetric,
  PerformanceAlert,
  APIPerformanceMetric
} from '@/components/ui/card';
import {
  import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Globe,
  MemoryStick,
  Monitor,
  RefreshCw,
  Server,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Wifi,
  Zap,
  AlertCircle,
  Info,
  Download,
  Eye
} from 'lucide-react';

interface PerformanceData {
  vitals: CoreWebVitals | null;
  systemHealth: SystemHealthMetric | null;
  userExperience: UserExperienceMetric | null;
  alerts: PerformanceAlert[];
  apiMetrics: APIPerformanceMetric[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'needs-improvement' | 'poor';
  threshold?: { good: number; poor: number };
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({
  title,
  value,
  unit,
  status,
  icon,
  description,
}: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-white p-2 shadow-sm">{icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number'
                    ? value.toFixed(value < 10 ? 2 : 0)
                    : value}
                  {unit && (
                    <span className="ml-1 text-sm text-gray-500">{unit}</span>
                  )}
                </p>
                {getStatusIcon()}
              </div>
              {description && (
                <p className="mt-1 text-xs text-gray-500">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: PerformanceAlert;
  onResolve: (alertId: string) => void;
}

function AlertCard({ alert, onResolve }: AlertCardProps) {
  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Alert className={`${getAlertColor()} border-l-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getAlertIcon()}
          <div className="flex-1">
            <AlertTitle className="text-sm font-semibold">
              {alert.metric} Alert
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {alert.message}
            </AlertDescription>
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>Value: {alert.value.toFixed(2)}</span>
              <span>Threshold: {alert.threshold}</span>
              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onResolve(alert.id)}
          className="text-xs"
        >
          Resolve
        </Button>
      </div>
    </Alert>
  );
}

interface SystemInfoCardProps {
  title: string;
  data: Record<string, any>;
  icon: React.ReactNode;
}

function SystemInfoCard({ title, data, icon }: SystemInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="capitalize text-gray-600">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
              <span className="font-medium text-gray-900">
                {typeof value === 'boolean'
                  ? value
                    ? 'Yes'
                    : 'No'
                  : typeof value === 'number'
                    ? value.toLocaleString()
                    : value || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceDashboard() {
  const performanceMonitor = usePerformanceMonitor();
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    vitals: null,
    systemHealth: null,
    userExperience: null,
    alerts: [],
    apiMetrics: [],
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    if (performanceMonitor.isInitialized) {
      performanceMonitor.initializePerformanceMonitoring();
      loadPerformanceData();
    }
  }, [performanceMonitor.isInitialized]);

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    setIsMonitoring(true);
    try {
      const result = await performanceMonitor.monitorPagePerformance(
        'performance-dashboard'
      );

      if (result) {
        setPerformanceData({
          vitals: result.vitals,
          systemHealth: result.systemHealth,
          userExperience: result.userExperience,
          alerts: result.alerts,
          apiMetrics: [], // This would be populated from stored API metrics
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, [performanceMonitor]);

  // Auto-refresh performance data
  useEffect(() => {
    const interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadPerformanceData]);

  // Resolve alert
  const handleResolveAlert = (alertId: string) => {
    setPerformanceData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId),
    }));
  };

  // Get Core Web Vitals status
  const getVitalStatus = (
    metric: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  // Calculate overall performance score
  const getOverallScore = (): number => {
    if (!performanceData.userExperience) return 0;
    return performanceData.userExperience.performanceScore;
  };

  // Get score status
  const getScoreStatus = (
    score: number
  ): 'good' | 'needs-improvement' | 'poor' => {
    if (score >= 90) return 'good';
    if (score >= 70) return 'needs-improvement';
    return 'poor';
  };

  if (!performanceMonitor.isInitialized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">
            Performance monitoring not initialized
          </p>
        </div>
      </div>
    );
  }

  const { vitals, systemHealth, userExperience, alerts } = performanceData;
  const overallScore = getOverallScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Performance Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time performance monitoring and system health
            {lastUpdate && (
              <span className="ml-2">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadPerformanceData}
            disabled={isMonitoring}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isMonitoring ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Overall Performance Score
              </h2>
              <p className="text-sm text-gray-600">
                Based on Core Web Vitals and system metrics
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                {overallScore.toFixed(0)}
              </div>
              <Badge
                variant={
                  getScoreStatus(overallScore) === 'good'
                    ? 'default'
                    : 'destructive'
                }
              >
                {getScoreStatus(overallScore) === 'good'
                  ? 'Good'
                  : getScoreStatus(overallScore) === 'needs-improvement'
                    ? 'Needs Improvement'
                    : 'Poor'}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={overallScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Performance Alerts
          </h2>
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={handleResolveAlert}
            />
          ))}
        </div>
      )}

      <Tabs defaultValue="vitals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="experience">User Experience</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vitals && (
              <>
                <MetricCard
                  title="Largest Contentful Paint"
                  value={vitals.lcp / 1000}
                  unit="s"
                  status={getVitalStatus('lcp', vitals.lcp)}
                  icon={<Eye className="h-5 w-5 text-blue-500" />}
                  description="Time until largest element is rendered"
                />
                <MetricCard
                  title="First Input Delay"
                  value={vitals.fid}
                  unit="ms"
                  status={getVitalStatus('fid', vitals.fid)}
                  icon={<Zap className="h-5 w-5 text-green-500" />}
                  description="Time from first interaction to response"
                />
                <MetricCard
                  title="Cumulative Layout Shift"
                  value={vitals.cls}
                  status={getVitalStatus('cls', vitals.cls)}
                  icon={<Monitor className="h-5 w-5 text-purple-500" />}
                  description="Visual stability of page elements"
                />
                <MetricCard
                  title="First Contentful Paint"
                  value={vitals.fcp / 1000}
                  unit="s"
                  status={getVitalStatus('fcp', vitals.fcp)}
                  icon={<Activity className="h-5 w-5 text-orange-500" />}
                  description="Time until first content is rendered"
                />
                <MetricCard
                  title="Time to First Byte"
                  value={vitals.ttfb}
                  unit="ms"
                  status={getVitalStatus('ttfb', vitals.ttfb)}
                  icon={<Server className="h-5 w-5 text-red-500" />}
                  description="Server response time"
                />
                <MetricCard
                  title="Page Load Time"
                  value={vitals.pageLoadTime / 1000}
                  unit="s"
                  status={
                    vitals.pageLoadTime < 3000
                      ? 'good'
                      : vitals.pageLoadTime < 5000
                        ? 'needs-improvement'
                        : 'poor'
                  }
                  icon={<Clock className="h-5 w-5 text-indigo-500" />}
                  description="Total page load time"
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {systemHealth && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Memory Usage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <MemoryStick className="h-4 w-4" />
                    <span>Memory Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span>
                        {(systemHealth.memoryUsage.used / 1024 / 1024).toFixed(
                          1
                        )}{' '}
                        MB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span>
                        {(systemHealth.memoryUsage.total / 1024 / 1024).toFixed(
                          1
                        )}{' '}
                        MB
                      </span>
                    </div>
                    <Progress
                      value={systemHealth.memoryUsage.percentage}
                      className="h-2"
                    />
                    <div className="text-center text-sm font-medium">
                      {systemHealth.memoryUsage.percentage.toFixed(1)}% used
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Information */}
              <SystemInfoCard
                title="Network Information"
                icon={<Wifi className="h-4 w-4" />}
                data={{
                  effectiveType: systemHealth.networkInfo.effectiveType,
                  downlink: `${systemHealth.networkInfo.downlink} Mbps`,
                  rtt: `${systemHealth.networkInfo.rtt} ms`,
                  saveData: systemHealth.networkInfo.saveData,
                }}
              />

              {/* Device Information */}
              <SystemInfoCard
                title="Device Information"
                icon={<Smartphone className="h-4 w-4" />}
                data={{
                  platform: systemHealth.deviceInfo.platform,
                  language: systemHealth.deviceInfo.language,
                  cookieEnabled: systemHealth.deviceInfo.cookieEnabled,
                  onLine: systemHealth.deviceInfo.onLine,
                  hardwareConcurrency:
                    systemHealth.deviceInfo.hardwareConcurrency,
                }}
              />

              {/* Browser Performance */}
              <SystemInfoCard
                title="Browser Performance"
                icon={<Globe className="h-4 w-4" />}
                data={{
                  jsHeapSizeLimit: `${(systemHealth.browserPerformance.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`,
                  totalJSHeapSize: `${(systemHealth.browserPerformance.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
                  usedJSHeapSize: `${(systemHealth.browserPerformance.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          {userExperience && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Time to Interactive"
                value={userExperience.timeToInteractive / 1000}
                unit="s"
                status={
                  userExperience.timeToInteractive < 3800
                    ? 'good'
                    : userExperience.timeToInteractive < 7300
                      ? 'needs-improvement'
                      : 'poor'
                }
                icon={<Zap className="h-5 w-5 text-blue-500" />}
                description="Time until page is fully interactive"
              />
              <MetricCard
                title="Session Duration"
                value={userExperience.sessionDuration / 1000}
                unit="s"
                status="good"
                icon={<Clock className="h-5 w-5 text-green-500" />}
                description="Current session duration"
              />
              <MetricCard
                title="Performance Score"
                value={userExperience.performanceScore}
                status={getScoreStatus(userExperience.performanceScore)}
                icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                description="Overall performance rating"
              />
              <MetricCard
                title="JavaScript Errors"
                value={userExperience.jsErrors}
                status={
                  userExperience.jsErrors === 0
                    ? 'good'
                    : userExperience.jsErrors < 3
                      ? 'needs-improvement'
                      : 'poor'
                }
                icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                description="Number of JS errors encountered"
              />
              <MetricCard
                title="Network Errors"
                value={userExperience.networkErrors}
                status={
                  userExperience.networkErrors === 0
                    ? 'good'
                    : userExperience.networkErrors < 3
                      ? 'needs-improvement'
                      : 'poor'
                }
                icon={<Wifi className="h-5 w-5 text-orange-500" />}
                description="Number of network errors"
              />
              <MetricCard
                title="Page Views"
                value={userExperience.pageViews}
                status="good"
                icon={<Eye className="h-5 w-5 text-indigo-500" />}
                description="Pages viewed in session"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-gray-500">
                <Server className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p>API performance metrics will be displayed here</p>
                <p className="text-sm">
                  Metrics are collected automatically as you use the application
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
