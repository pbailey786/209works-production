'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  Users,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

interface PerformanceInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  confidence: number;
  category: 'visibility' | 'applications' | 'quality' | 'conversion' | 'engagement';
}

interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
}

interface JobPerformanceData {
  jobId: string;
  jobTitle: string;
  metrics: PerformanceMetric[];
  insights: PerformanceInsight[];
  benchmarks: BenchmarkData[];
  overallScore: number;
  performanceGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  timeToFill: number;
  costPerHire: number;
  qualityOfHire: number;
  predictions: {
    expectedApplications: number;
    timeToFillEstimate: number;
    successProbability: number;
  };
}

interface JobPerformanceInsightsProps {
  jobId: string;
  className?: string;
}

export function JobPerformanceInsights({ jobId, className }: JobPerformanceInsightsProps) {
  const [performanceData, setPerformanceData] = useState<JobPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<PerformanceInsight | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (jobId) {
      fetchPerformanceData();
    }
  }, [jobId, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/job-performance/${jobId}?range=${timeRange}`);
      
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      } else {
        // Mock data for demonstration
        setPerformanceData({
          jobId,
          jobTitle: 'Senior Frontend Developer',
          overallScore: 78,
          performanceGrade: 'B+',
          timeToFill: 23,
          costPerHire: 3200,
          qualityOfHire: 85,
          metrics: [
            {
              name: 'Job Views',
              current: 342,
              previous: 298,
              target: 400,
              trend: 'up',
              status: 'good',
            },
            {
              name: 'Applications',
              current: 28,
              previous: 35,
              target: 40,
              trend: 'down',
              status: 'needs_improvement',
            },
            {
              name: 'Application Rate',
              current: 8.2,
              previous: 11.7,
              target: 10.0,
              trend: 'down',
              status: 'needs_improvement',
            },
            {
              name: 'Quality Score',
              current: 7.8,
              previous: 7.2,
              target: 8.0,
              trend: 'up',
              status: 'good',
            },
          ],
          insights: [
            {
              id: '1',
              type: 'warning',
              priority: 'high',
              title: 'Declining Application Rate',
              description: 'Your application rate has dropped by 30% compared to last month. This suggests potential issues with job attractiveness or market competition.',
              impact: 'May extend time to fill by 2-3 weeks',
              actionItems: [
                'Review and update job description',
                'Consider increasing salary range',
                'Add more attractive benefits',
                'Improve job title for better searchability',
              ],
              confidence: 87,
              category: 'applications',
            },
            {
              id: '2',
              type: 'opportunity',
              priority: 'medium',
              title: 'Strong View-to-Application Potential',
              description: 'Your job is getting good visibility with 342 views, but the conversion rate could be improved with better positioning.',
              impact: 'Could increase applications by 40-50%',
              actionItems: [
                'Optimize job description for conversion',
                'Add company culture highlights',
                'Include employee testimonials',
                'Clarify remote work options',
              ],
              confidence: 73,
              category: 'conversion',
            },
            {
              id: '3',
              type: 'success',
              priority: 'low',
              title: 'Improving Candidate Quality',
              description: 'The quality of applicants has improved by 8% this month, indicating better job targeting.',
              impact: 'Reduced screening time and better hires',
              actionItems: [
                'Continue current sourcing strategy',
                'Document what\'s working well',
                'Consider expanding to similar channels',
              ],
              confidence: 91,
              category: 'quality',
            },
            {
              id: '4',
              type: 'recommendation',
              priority: 'medium',
              title: 'Optimize for Mobile Candidates',
              description: '68% of your job views come from mobile devices, but application completion rate is lower on mobile.',
              impact: 'Could increase applications by 25%',
              actionItems: [
                'Simplify application process',
                'Optimize for mobile experience',
                'Reduce required fields',
                'Add one-click apply options',
              ],
              confidence: 82,
              category: 'engagement',
            },
          ],
          benchmarks: [
            {
              metric: 'Time to Fill',
              yourValue: 23,
              industryAverage: 28,
              topPerformers: 18,
              percentile: 72,
            },
            {
              metric: 'Application Rate',
              yourValue: 8.2,
              industryAverage: 9.5,
              topPerformers: 15.2,
              percentile: 45,
            },
            {
              metric: 'Quality of Hire',
              yourValue: 85,
              industryAverage: 78,
              topPerformers: 92,
              percentile: 68,
            },
            {
              metric: 'Cost per Hire',
              yourValue: 3200,
              industryAverage: 4100,
              topPerformers: 2800,
              percentile: 75,
            },
          ],
          predictions: {
            expectedApplications: 45,
            timeToFillEstimate: 26,
            successProbability: 78,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-purple-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'recommendation': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Unable to load performance data</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Performance Insights</h2>
          <p className="text-gray-600">{performanceData.jobTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getGradeColor(performanceData.performanceGrade)}`}>
                {performanceData.performanceGrade}
              </div>
              <div className="text-sm text-gray-600">Performance Grade</div>
              <div className="text-xs text-gray-500 mt-1">Score: {performanceData.overallScore}/100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{performanceData.timeToFill}d</div>
              <div className="text-sm text-gray-600">Time to Fill</div>
              <div className="text-xs text-gray-500 mt-1">Target: 21 days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${performanceData.costPerHire.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Cost per Hire</div>
              <div className="text-xs text-gray-500 mt-1">Industry avg: $4,100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{performanceData.qualityOfHire}%</div>
              <div className="text-sm text-gray-600">Quality of Hire</div>
              <div className="text-xs text-gray-500 mt-1">Above average</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData.metrics.map((metric, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{metric.name}</h4>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                    {metric.name.includes('Rate') ? `${metric.current}%` : metric.current.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Target: {metric.name.includes('Rate') ? `${metric.target}%` : metric.target.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Previous: {metric.name.includes('Rate') ? `${metric.previous}%` : metric.previous.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.insights.map((insight) => (
              <div
                key={insight.id}
                className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.priority} priority
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                </div>

                <p className="text-gray-700 mb-3">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <strong>Impact:</strong> {insight.impact}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    View Actions
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.benchmarks.map((benchmark, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{benchmark.metric}</span>
                  <span className="text-sm text-gray-600">{benchmark.percentile}th percentile</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Your Value: {benchmark.yourValue}</span>
                    <span>Industry Avg: {benchmark.industryAverage}</span>
                    <span>Top 10%: {benchmark.topPerformers}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${benchmark.percentile}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.predictions.expectedApplications}
              </div>
              <div className="text-sm text-gray-600">Expected Applications</div>
              <div className="text-xs text-gray-500">Next 30 days</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {performanceData.predictions.timeToFillEstimate}d
              </div>
              <div className="text-sm text-gray-600">Estimated Time to Fill</div>
              <div className="text-xs text-gray-500">Based on current trends</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.predictions.successProbability}%
              </div>
              <div className="text-sm text-gray-600">Success Probability</div>
              <div className="text-xs text-gray-500">Likelihood of successful hire</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedInsight.title}</h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">{selectedInsight.description}</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                  <ul className="space-y-2">
                    {selectedInsight.actionItems.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedInsight(null)}>
                    Close
                  </Button>
                  <Button className="bg-[#ff6b35] hover:bg-[#e55a2b]">
                    Implement Actions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
