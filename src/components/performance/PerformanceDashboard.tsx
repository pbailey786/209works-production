'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from 'lucide-react';

interface PerformanceData {
  enhanced: {
    database: {
      totalQueries: number;
      averageDuration: number;
      slowQueries: number;
      cacheHitRate: number;
    };
    api: {
      totalCalls: number;
      averageDuration: number;
      slowCalls: number;
      errorRate: number;
    };
  };
  cache: {
    metrics: {
      cacheHits: number;
      cacheMisses: number;
      avgResponseTime: number;
      slowQueries: number;
      totalRequests: number;
    };
    hitRatio: number;
    efficiency: string;
  };
  performance: {
    score: number;
    grade: string;
    recommendations: string[];
  };
  system: {
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

interface PerformanceDashboardProps {
  region?: string;
}

export default function PerformanceDashboard({ region }: PerformanceDashboardProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (region) params.set('region', region);
      
      const response = await fetch(`/api/analytics/performance?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Performance data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, [region]);

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (efficiency: string) => {
    const variants = {
      excellent: 'default',
      good: 'secondary',
      'needs-improvement': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[efficiency as keyof typeof variants] || 'secondary'}>
        {efficiency.replace('-', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={fetchPerformanceData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">
            Real-time performance monitoring and optimization insights
            {region && ` for ${region} region`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button variant="outline" onClick={fetchPerformanceData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(data.performance.score)}`}>
                {data.performance.score}
              </div>
              <div>
                <div className="text-2xl font-semibold">{data.performance.grade}</div>
                <div className="text-sm text-gray-600">Performance Grade</div>
              </div>
            </div>
            <div className="text-right">
              <Progress value={data.performance.score} className="w-32 mb-2" />
              <div className="text-xs text-gray-500">Score out of 100</div>
            </div>
          </div>
          
          {data.performance.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              {data.performance.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Tabs */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Queries</p>
                    <p className="text-2xl font-bold">{data.enhanced.database.totalQueries}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                    <p className="text-2xl font-bold">{data.enhanced.database.averageDuration}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Slow Queries</p>
                    <p className="text-2xl font-bold">{data.enhanced.database.slowQueries}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">{data.enhanced.database.cacheHitRate}%</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total API Calls</p>
                    <p className="text-2xl font-bold">{data.enhanced.api.totalCalls}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold">{data.enhanced.api.averageDuration}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Slow Calls</p>
                    <p className="text-2xl font-bold">{data.enhanced.api.slowCalls}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold">{data.enhanced.api.errorRate}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Cache hit ratio and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hit Ratio</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{(data.cache.hitRatio * 100).toFixed(1)}%</span>
                    {getEfficiencyBadge(data.cache.efficiency)}
                  </div>
                </div>
                <Progress value={data.cache.hitRatio * 100} />
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{data.cache.metrics.cacheHits}</div>
                    <div className="text-sm text-gray-600">Cache Hits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{data.cache.metrics.cacheMisses}</div>
                    <div className="text-sm text-gray-600">Cache Misses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Detailed cache performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Requests</span>
                    <span className="font-semibold">{data.cache.metrics.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Response Time</span>
                    <span className="font-semibold">{data.cache.metrics.avgResponseTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Slow Queries</span>
                    <span className="font-semibold">{data.cache.metrics.slowQueries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Node.js memory consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">RSS</span>
                    <span className="font-semibold">{formatBytes(data.system.memory.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Heap Total</span>
                    <span className="font-semibold">{formatBytes(data.system.memory.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Heap Used</span>
                    <span className="font-semibold">{formatBytes(data.system.memory.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">External</span>
                    <span className="font-semibold">{formatBytes(data.system.memory.external)}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600 mb-1">Heap Usage</div>
                  <Progress 
                    value={(data.system.memory.heapUsed / data.system.memory.heapTotal) * 100} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Server runtime information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-semibold">{formatUptime(data.system.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Node Version</span>
                    <span className="font-semibold">{data.system.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Platform</span>
                    <span className="font-semibold">{data.system.platform}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
