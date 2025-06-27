'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain, TrendingUp, Database, Clock, Play } from 'lucide-react';

interface LearningStats {
  totalAnalyses: number;
  recentAnalyses: number;
  learnedTemplates: number;
  averageSuccessScore: number;
  topJobTypes: Array<{
    jobType: string;
    count: number;
  }>;
  lastUpdated: string;
}

export default function LearningSystemPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/learning-pipeline');
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch learning stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runLearningPipeline = async () => {
    try {
      setIsRunningPipeline(true);
      const response = await fetch('/api/admin/learning-pipeline', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastRun(result.timestamp);
        // Refresh stats after pipeline runs
        setTimeout(() => fetchStats(), 2000);
      } else {
        console.error('Failed to run learning pipeline');
      }
    } catch (error) {
      console.error('Error running learning pipeline:', error);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Job Learning System
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage the AI learning system that improves Job Genie from successful job posts
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchStats}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={runLearningPipeline}
            disabled={isRunningPipeline}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Play className={`w-4 h-4 mr-2 ${isRunningPipeline ? 'animate-spin' : ''}`} />
            {isRunningPipeline ? 'Running...' : 'Run Pipeline'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.totalAnalyses?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Job posts analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.recentAnalyses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learned Templates</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.learnedTemplates || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-generated templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : Math.round(stats?.averageSuccessScore || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Job Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Most Analyzed Job Types</CardTitle>
          <p className="text-sm text-gray-600">
            Job types with the most successful posts for learning
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.topJobTypes?.map((jobType, index) => (
                <div key={jobType.jobType} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium capitalize">
                      {jobType.jobType.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {jobType.count} posts
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 col-span-3 text-center py-4">
                  No data available yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Pipeline Status</CardTitle>
          <p className="text-sm text-gray-600">
            Learning pipeline execution history and controls
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Automatic Learning</h4>
                <p className="text-sm text-gray-600">
                  Runs daily at 2 AM to analyze new job posts and update templates
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>

            {lastRun && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Last Manual Run</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(lastRun).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Completed
                </Badge>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">How Learning Works</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Analyzes job posts with high view/application rates</li>
                <li>• Extracts common duties, requirements, and benefits</li>
                <li>• Creates learned templates for new job types</li>
                <li>• Enhances Job Genie responses with real data</li>
                <li>• Updates templates as more successful posts are found</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}