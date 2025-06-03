/**
 * Funnel Analytics Dashboard
 * Comprehensive visualization of conversion funnels and optimization insights
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useFunnelAnalysis,
  FunnelAnalysis,
  FunnelStep,
  DropOffPoint,
  OptimizationRecommendation,
  JOB_SEEKER_FUNNEL,
  EMPLOYER_FUNNEL,
} from '@/lib/analytics/funnel-analysis';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  FunnelChart,
  Funnel,
  Cell,
  LabelList,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  ArrowDown,
  ArrowRight,
  Filter,
  Download,
  RefreshCw,
  Zap,
  AlertCircle,
  Info,
  Eye,
  MousePointer,
  UserPlus,
  FileText,
  CreditCard,
  Repeat,
} from 'lucide-react';

interface FunnelDashboardProps {
  className?: string;
}

const FUNNEL_COLORS = {
  awareness: '#3B82F6',
  interest: '#10B981',
  consideration: '#F59E0B',
  conversion: '#EF4444',
  retention: '#8B5CF6',
};

const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

const STEP_ICONS = {
  landing: Eye,
  search: Filter,
  job_view: FileText,
  registration: UserPlus,
  application_start: MousePointer,
  application_complete: CheckCircle,
  profile_complete: Users,
  employer_landing: Eye,
  pricing_view: Target,
  employer_registration: UserPlus,
  job_post_start: FileText,
  payment: CreditCard,
  job_published: CheckCircle,
  repeat_posting: Repeat,
};

export function FunnelAnalyticsDashboard({
  className = '',
}: FunnelDashboardProps) {
  const funnelAnalysis = useFunnelAnalysis();
  const [selectedFunnel, setSelectedFunnel] = useState<
    'job_seeker' | 'employer'
  >('job_seeker');
  const [funnelData, setFunnelData] = useState<FunnelAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load funnel data
  const loadFunnelData = useCallback(async () => {
    setIsLoading(true);
    try {
      const steps =
        selectedFunnel === 'job_seeker' ? JOB_SEEKER_FUNNEL : EMPLOYER_FUNNEL;
      const analysis = await funnelAnalysis.analyzeFunnel(
        selectedFunnel,
        steps
      );
      setFunnelData(analysis);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFunnel, funnelAnalysis]);

  // Load data on mount and when funnel changes
  useEffect(() => {
    if (funnelAnalysis.isInitialized) {
      loadFunnelData();
    }
  }, [funnelAnalysis.isInitialized, loadFunnelData]);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(loadFunnelData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [loadFunnelData]);

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    return (
      SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#6B7280'
    );
  };

  // Get step icon
  const getStepIcon = (stepId: string) => {
    const IconComponent =
      STEP_ICONS[stepId as keyof typeof STEP_ICONS] || Target;
    return IconComponent;
  };

  // Format funnel data for chart
  const formatFunnelChartData = () => {
    if (!funnelData) return [];

    return funnelData.steps.map((step, index) => ({
      name: step.step.name,
      users: step.users,
      completionRate: step.completionRate,
      dropOffRate: step.dropOffRate,
      fill: FUNNEL_COLORS[step.step.category],
      order: index + 1,
    }));
  };

  // Format drop-off data for chart
  const formatDropOffChartData = () => {
    if (!funnelData) return [];

    return funnelData.dropOffPoints.map(dropOff => ({
      transition: `${dropOff.fromStep} → ${dropOff.toStep}`,
      dropOffRate: dropOff.dropOffRate,
      usersLost: dropOff.usersLost,
      severity: dropOff.severity,
      fill: getSeverityColor(dropOff.severity),
    }));
  };

  if (!funnelAnalysis.isInitialized) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Funnel analytics not initialized</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Conversion Funnel Analysis
          </h1>
          <p className="text-gray-600">
            Track user journeys, identify drop-off points, and optimize
            conversion rates
          </p>
        </div>

        <div className="flex gap-3">
          <Select
            value={selectedFunnel}
            onValueChange={(value: 'job_seeker' | 'employer') =>
              setSelectedFunnel(value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select funnel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="job_seeker">Job Seeker Journey</SelectItem>
              <SelectItem value="employer">Employer Journey</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={loadFunnelData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {funnelData && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {funnelData.totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Overall Conversion
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {funnelData.overallConversionRate.toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Critical Drop-offs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      funnelData.dropOffPoints.filter(
                        d => d.severity === 'critical'
                      ).length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Optimization Opportunities
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {funnelData.optimizationRecommendations.length}
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Visualization</TabsTrigger>
          <TabsTrigger value="dropoffs">Drop-off Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Optimization</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-6">
          {/* Funnel Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData ? (
                <div className="space-y-4">
                  {funnelData.steps.map((stepData, index) => {
                    const IconComponent = getStepIcon(stepData.step.id);
                    const isLastStep = index === funnelData.steps.length - 1;

                    return (
                      <div key={stepData.step.id} className="relative">
                        <div
                          className="flex items-center justify-between rounded-lg border-l-4 bg-gray-50 p-6"
                          style={{
                            borderLeftColor:
                              FUNNEL_COLORS[stepData.step.category],
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-full"
                              style={{
                                backgroundColor:
                                  FUNNEL_COLORS[stepData.step.category],
                              }}
                            >
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {stepData.step.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {stepData.step.description}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {stepData.step.category}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {stepData.users.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">users</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-900">
                                  {stepData.completionRate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">
                                  completion
                                </p>
                              </div>
                              {index > 0 && (
                                <div>
                                  <p className="text-lg font-semibold text-red-600">
                                    -{stepData.dropOffRate.toFixed(1)}%
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    drop-off
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isLastStep && (
                          <div className="mb-2 mt-2 flex justify-center">
                            <ArrowDown className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <RefreshCw
                    className={`mx-auto mb-2 h-8 w-8 text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  <p className="text-gray-500">Loading funnel data...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funnel Chart */}
          {funnelData && (
            <Card>
              <CardHeader>
                <CardTitle>Funnel Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={formatFunnelChartData()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'users' ? `${value} users` : `${value}%`,
                        name === 'users' ? 'Users' : 'Completion Rate',
                      ]}
                    />
                    <Bar dataKey="users" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dropoffs" className="space-y-6">
          {/* Drop-off Points */}
          {funnelData && (
            <Card>
              <CardHeader>
                <CardTitle>Drop-off Analysis</CardTitle>
                <p className="text-sm text-gray-600">
                  Identify where users are leaving the funnel and why
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.dropOffPoints.map((dropOff, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getSeverityColor(dropOff.severity),
                              color: getSeverityColor(dropOff.severity),
                            }}
                          >
                            {dropOff.severity}
                          </Badge>
                          <span className="font-medium">
                            {dropOff.fromStep} → {dropOff.toStep}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-red-600">
                            -{dropOff.dropOffRate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {dropOff.usersLost.toLocaleString()} users lost
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Progress
                          value={dropOff.dropOffRate}
                          className="h-2"
                          style={{
                            backgroundColor: `${getSeverityColor(dropOff.severity)}20`,
                          }}
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Primary Reasons:
                        </p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {dropOff.primaryReasons.map((reason, reasonIndex) => (
                            <li
                              key={reasonIndex}
                              className="flex items-center gap-2"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {dropOff.potentialRevenueLost && (
                        <div className="mt-3 rounded-lg bg-red-50 p-3">
                          <p className="text-sm text-red-800">
                            <strong>Potential Revenue Lost:</strong> $
                            {dropOff.potentialRevenueLost.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drop-off Chart */}
          {funnelData && (
            <Card>
              <CardHeader>
                <CardTitle>Drop-off Rates by Transition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatDropOffChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="transition"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={value => [`${value}%`, 'Drop-off Rate']}
                    />
                    <Bar dataKey="dropOffRate" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Optimization Recommendations */}
          {funnelData && (
            <div className="space-y-4">
              {funnelData.optimizationRecommendations.map(recommendation => (
                <Card key={recommendation.id}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Lightbulb className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="mb-1 font-semibold text-gray-900">
                            {recommendation.title}
                          </h3>
                          <p className="mb-2 text-gray-600">
                            {recommendation.description}
                          </p>
                          <div className="mb-3 flex gap-2">
                            <Badge
                              variant={
                                recommendation.priority === 'critical'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {recommendation.priority} priority
                            </Badge>
                            <Badge variant="outline">
                              {recommendation.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {recommendation.implementationEffort} effort
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {recommendation.estimatedLift && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            +{recommendation.estimatedLift}%
                          </p>
                          <p className="text-sm text-gray-600">
                            estimated lift
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-700">
                        <strong>Expected Impact:</strong>{' '}
                        {recommendation.expectedImpact}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Affects: {recommendation.affectedSteps.join(', ')}
                      </div>
                      <Button size="sm">Implement Recommendation</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <p className="text-sm text-gray-600">
                Compare conversion rates across different user segments
              </p>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Info className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-gray-500">Cohort analysis coming soon</p>
                <p className="mt-1 text-sm text-gray-400">
                  This feature will allow you to compare funnel performance
                  across different user segments
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {lastUpdate && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      )}
    </div>
  );
}
