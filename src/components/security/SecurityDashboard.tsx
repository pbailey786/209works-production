'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from 'lucide-react';

interface SecurityData {
  overview: {
    securityScore: number;
    timeRange: string;
    region: string;
    lastUpdated: string;
  };
  security: {
    metrics: {
      totalEvents: number;
      blockedEvents: number;
      criticalEvents: number;
      highSeverityEvents: number;
      blockedIPs: number;
      suspiciousUsers: number;
    };
    alerts: any[];
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  compliance: {
    report: any;
    gdprCompliant: boolean;
    consentRate: number;
  };
  system: {
    health: any;
    uptime: number;
    memory: any;
  };
  recommendations: string[];
}

interface SecurityDashboardProps {
  region?: string;
}

export default function SecurityDashboard({ region }: SecurityDashboardProps) {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, [timeRange, region]);

  const fetchSecurityData = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (timeRange) params.set('timeRange', timeRange);
      if (region) params.set('region', region);
      
      const response = await fetch(`/api/admin/security?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch security data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Security data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityAction = async (action: string, target: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target, reason })
      });

      if (response.ok) {
        // Refresh data after action
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Security action error:', error);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading security dashboard...</span>
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
            onClick={fetchSecurityData}
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
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">
            Enterprise security monitoring and compliance overview
            {region && ` for ${region} region`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <Button variant="outline" onClick={fetchSecurityData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(data.overview.securityScore)}`}>
                {data.overview.securityScore}
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {data.overview.securityScore >= 90 ? 'Excellent' : 
                   data.overview.securityScore >= 70 ? 'Good' : 'Needs Attention'}
                </div>
                <div className="text-sm text-gray-600">Security Posture</div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={getThreatLevelColor(data.security.threatLevel)}>
                {data.security.threatLevel.toUpperCase()} THREAT
              </Badge>
              <div className="text-xs text-gray-500 mt-1">Current Threat Level</div>
            </div>
          </div>
          
          <Progress value={data.overview.securityScore} className="mb-4" />
          
          {data.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Security Recommendations:</h4>
              {data.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Metrics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold">{data.security.metrics.totalEvents}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blocked Events</p>
                    <p className="text-2xl font-bold">{data.security.metrics.blockedEvents}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Events</p>
                    <p className="text-2xl font-bold">{data.security.metrics.criticalEvents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
                    <p className="text-2xl font-bold">{data.security.metrics.blockedIPs}</p>
                  </div>
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>
                Latest security threats and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.security.alerts.length > 0 ? (
                <div className="space-y-4">
                  {data.security.alerts.slice(0, 10).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{alert.type}</div>
                          <div className="text-sm text-gray-600">{alert.description}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.acknowledged ? 'default' : 'destructive'}>
                          {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                        </Badge>
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSecurityAction('acknowledge_alert', alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Recent Alerts
                  </h3>
                  <p className="text-gray-600">
                    Your security posture is good. No threats detected in the selected time range.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance</CardTitle>
                <CardDescription>Data protection and privacy compliance status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Compliance</span>
                  <div className="flex items-center gap-2">
                    {data.compliance.gdprCompliant ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={data.compliance.gdprCompliant ? 'default' : 'destructive'}>
                      {data.compliance.gdprCompliant ? 'Compliant' : 'Non-Compliant'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Consent Rate</span>
                  <span className="font-semibold">{data.compliance.consentRate.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Requests</span>
                  <span className="font-semibold">{data.compliance.report.overview.pendingRequests}</span>
                </div>
                
                <Progress value={data.compliance.consentRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>Data lifecycle and retention compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retention Compliance</span>
                  <Badge variant={data.compliance.report.dataRetention.compliant ? 'default' : 'destructive'}>
                    {data.compliance.report.dataRetention.compliant ? 'Compliant' : 'Action Required'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expired Data Items</span>
                  <span className="font-semibold">{data.compliance.report.dataRetention.expiredData.length}</span>
                </div>
                
                {data.compliance.report.dataRetention.expiredData.length > 0 && (
                  <Button size="sm" variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Review Expired Data
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Platform performance and availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="font-semibold">{formatUptime(data.system.uptime)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold">{data.system.health.activeUsers}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Jobs</span>
                  <span className="font-semibold">{data.system.health.totalJobs}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="font-semibold">{data.system.health.errorRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Server memory consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">RSS</span>
                  <span className="font-semibold">{formatBytes(data.system.memory.rss)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Heap Used</span>
                  <span className="font-semibold">{formatBytes(data.system.memory.heapUsed)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Heap Total</span>
                  <span className="font-semibold">{formatBytes(data.system.memory.heapTotal)}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600 mb-1">Heap Usage</div>
                  <Progress 
                    value={(data.system.memory.heapUsed / data.system.memory.heapTotal) * 100} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
