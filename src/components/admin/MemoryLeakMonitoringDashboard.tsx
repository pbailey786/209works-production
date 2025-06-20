import React, { useState, useEffect, useRef } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Progress } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/card';
import { memoryLeakDetector } from '@/lib/monitoring/memory-leak-detector';

/**
 * Memory Leak Monitoring Dashboard
 *
 * Admin dashboard component for monitoring memory leaks in real-time
 */

import {
  import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

interface ComponentLeakInfo {
  name: string;
  mountCount: number;
  unmountCount: number;
  activeTimers: number;
  activeListeners: number;
  memoryUsage: number;
  lastActivity: number;
  status: 'healthy' | 'warning' | 'critical';
}

export default function MemoryLeakMonitoringDashboard() {
  const [memoryStats, setMemoryStats] = useState<MemoryStats[]>([]);
  const [componentStats, setComponentStats] = useState<ComponentLeakInfo[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<number | undefined>(undefined);

  // Get current memory usage
  const getCurrentMemoryStats = (): MemoryStats => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed / 1024 / 1024, // MB
        heapTotal: usage.heapTotal / 1024 / 1024, // MB
        external: usage.external / 1024 / 1024, // MB
        rss: usage.rss / 1024 / 1024, // MB
        timestamp: Date.now(),
      };
    }

    // Fallback for browser environment
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      timestamp: Date.now(),
    };
  };

  // Update memory statistics
  const updateMemoryStats = () => {
    const currentStats = getCurrentMemoryStats();
    setMemoryStats(prev => {
      const newStats = [...prev, currentStats];
      // Keep only last 100 data points
      return newStats.slice(-100);
    });

    // Check for memory leaks
    checkForMemoryLeaks(currentStats);
  };

  // Check for potential memory leaks
  const checkForMemoryLeaks = (stats: MemoryStats) => {
    const newAlerts: string[] = [];

    // Check heap usage growth
    if (memoryStats.length > 10) {
      const recentStats = memoryStats.slice(-10);
      const avgGrowth =
        recentStats.reduce((acc, stat, index) => {
          if (index === 0) return 0;
          return acc + (stat.heapUsed - recentStats[index - 1].heapUsed);
        }, 0) /
        (recentStats.length - 1);

      if (avgGrowth > 1) {
        // More than 1MB growth per interval
        newAlerts.push(
          `High memory growth detected: ${avgGrowth.toFixed(2)}MB per interval`
        );
      }
    }

    // Check absolute memory usage
    if (stats.heapUsed > 100) {
      // More than 100MB
      newAlerts.push(`High memory usage: ${stats.heapUsed.toFixed(2)}MB`);
    }

    // Check component statistics
    const criticalComponents = componentStats.filter(
      comp => comp.status === 'critical'
    );
    if (criticalComponents.length > 0) {
      newAlerts.push(
        `${criticalComponents.length} component(s) with critical memory leaks`
      );
    }

    setAlerts(newAlerts);
  };

  // Update component statistics
  const updateComponentStats = () => {
    const stats = memoryLeakDetector.getComponentStats();
    const componentInfo: ComponentLeakInfo[] = Object.entries(stats).map(
      ([name, data]) => {
        const activeTimers = data.timers?.size || 0;
        const activeListeners = data.listeners?.size || 0;
        const memoryUsage = data.memoryUsage || 0;

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (activeTimers > 5 || activeListeners > 10 || memoryUsage > 50) {
          status = 'critical';
        } else if (
          activeTimers > 2 ||
          activeListeners > 5 ||
          memoryUsage > 20
        ) {
          status = 'warning';
        }

        return {
          name,
          mountCount: data.mountCount || 0,
          unmountCount: data.unmountCount || 0,
          activeTimers,
          activeListeners,
          memoryUsage,
          lastActivity: data.lastActivity || Date.now(),
          status,
        };
      }
    );

    setComponentStats(componentInfo);
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    updateMemoryStats();
    updateComponentStats();

    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        updateMemoryStats();
        updateComponentStats();
      }, refreshInterval);
    }
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  // Export data
  const exportData = () => {
    const data = {
      memoryStats,
      componentStats,
      alerts,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-leak-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (isMonitoring && autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        updateMemoryStats();
        updateComponentStats();
      }, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, [autoRefresh, refreshInterval, isMonitoring]);

  const latestMemoryStats = memoryStats[memoryStats.length - 1];
  const memoryTrend =
    memoryStats.length > 1
      ? memoryStats[memoryStats.length - 1].heapUsed -
        memoryStats[memoryStats.length - 2].heapUsed
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Memory Leak Monitoring</h1>
        <div className="flex gap-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
          >
            {isMonitoring ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Memory Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heap Used</CardTitle>
            {memoryTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMemoryStats
                ? `${latestMemoryStats.heapUsed.toFixed(1)}MB`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {memoryTrend > 0 ? '+' : ''}
              {memoryTrend.toFixed(2)}MB from last check
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heap Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMemoryStats
                ? `${latestMemoryStats.heapTotal.toFixed(1)}MB`
                : 'N/A'}
            </div>
            <Progress
              value={
                latestMemoryStats
                  ? (latestMemoryStats.heapUsed / latestMemoryStats.heapTotal) *
                    100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{componentStats.length}</div>
            <p className="text-xs text-muted-foreground">
              {componentStats.filter(c => c.status === 'critical').length}{' '}
              critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {isMonitoring ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMonitoring ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              {autoRefresh
                ? `Refreshing every ${refreshInterval / 1000}s`
                : 'Manual refresh'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Component Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Component Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {componentStats.length === 0 ? (
              <p className="text-muted-foreground">
                No component data available. Start monitoring to see statistics.
              </p>
            ) : (
              componentStats.map(component => (
                <div
                  key={component.name}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{component.name}</h3>
                      <Badge
                        variant={
                          component.status === 'critical'
                            ? 'destructive'
                            : component.status === 'warning'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {component.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Mounts: {component.mountCount} | Unmounts:{' '}
                      {component.unmountCount} | Timers:{' '}
                      {component.activeTimers} | Listeners:{' '}
                      {component.activeListeners}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {component.memoryUsage.toFixed(1)}MB
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(component.lastActivity).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm font-medium">
                Auto-refresh data
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="refreshInterval" className="text-sm font-medium">
                Refresh Interval (seconds)
              </label>
              <select
                id="refreshInterval"
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                className="w-full rounded-md border p-2"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>

            <Button
              onClick={() => {
                updateMemoryStats();
                updateComponentStats();
              }}
              variant="outline"
              disabled={isMonitoring && autoRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Manual Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
