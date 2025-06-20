'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Briefcase, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Zap
} from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  activeJobs: number;
  aiSessions: number;
  applicationsToday: number;
  trends: {
    users: number;
    jobs: number;
    ai: number;
    applications: number;
  };
  lastUpdated: string;
}

interface RealTimeAnalyticsWidgetProps {
  refreshInterval?: number; // in seconds, default 30
  showTrends?: boolean;
  compact?: boolean;
}

export default function RealTimeAnalyticsWidget({
  refreshInterval = 30,
  showTrends = true,
  compact = false
}: RealTimeAnalyticsWidgetProps) {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/analytics/realtime');
      
      if (!response.ok) {
        throw new Error('Failed to fetch real-time metrics');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Real-time analytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchMetrics();
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Set up interval for automatic refresh
    const interval = setInterval(fetchMetrics, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTrend = (trend: number): { icon: React.ReactNode; color: string; text: string } => {
    const isPositive = trend >= 0;
    return {
      icon: isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      text: `${isPositive ? '+' : ''}${trend.toFixed(1)}%`
    };
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && !metrics) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <div className="flex items-center justify-between">
            <CardTitle className={compact ? 'text-sm' : 'text-base'}>
              Real-Time Analytics
            </CardTitle>
            <Activity className="h-4 w-4 animate-pulse text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className={compact ? 'pt-2' : ''}>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>
            Real-Time Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className={compact ? 'pt-2' : ''}>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const metricItems = [
    {
      label: 'Active Users',
      value: metrics.activeUsers,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      trend: showTrends ? metrics.trends.users : undefined
    },
    {
      label: 'Active Jobs',
      value: metrics.activeJobs,
      icon: <Briefcase className="h-4 w-4 text-green-500" />,
      trend: showTrends ? metrics.trends.jobs : undefined
    },
    {
      label: 'AI Sessions',
      value: metrics.aiSessions,
      icon: <Brain className="h-4 w-4 text-purple-500" />,
      trend: showTrends ? metrics.trends.ai : undefined
    },
    {
      label: 'Applications Today',
      value: metrics.applicationsToday,
      icon: <Zap className="h-4 w-4 text-orange-500" />,
      trend: showTrends ? metrics.trends.applications : undefined
    }
  ];

  return (
    <Card className={compact ? 'p-4' : ''}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={compact ? 'text-sm' : 'text-base'}>
              Real-Time Analytics
            </CardTitle>
            {!compact && (
              <CardDescription>
                Live platform metrics • Updated {getTimeAgo(lastRefresh)}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'pt-2' : ''}>
        <div className="space-y-3">
          {metricItems.map((item) => {
            const trendData = item.trend !== undefined ? formatTrend(item.trend) : null;
            
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className={compact ? 'text-xs' : 'text-sm'}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                    {formatNumber(item.value)}
                  </span>
                  {trendData && (
                    <div className={`flex items-center gap-1 ${trendData.color}`}>
                      {trendData.icon}
                      <span className="text-xs">{trendData.text}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {compact && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-gray-500 text-center">
              Updated {getTimeAgo(lastRefresh)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
