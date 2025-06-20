import { usePostHog } from './posthog-provider';

/**
 * Business Metrics Service
 * Comprehensive KPI tracking and business intelligence for job board analytics
 */


// Business KPI Types
export interface JobBoardKPIs {
  // User Metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  userRetentionRate: number;
  userGrowthRate: number;

  // Job Metrics
  totalJobs: number;
  activeJobs: number;
  newJobsToday: number;
  newJobsThisWeek: number;
  newJobsThisMonth: number;
  jobFillRate: number;
  averageTimeToFill: number;

  // Application Metrics
  totalApplications: number;
  applicationsToday: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  applicationConversionRate: number;
  averageApplicationsPerJob: number;

  // Search Metrics
  totalSearches: number;
  searchesToday: number;
  searchesThisWeek: number;
  searchesThisMonth: number;
  searchToViewRate: number;
  searchToApplicationRate: number;

  // Revenue Metrics (for employers)
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;

  // Engagement Metrics
  averageSessionDuration: number;
  averagePageViews: number;
  bounceRate: number;
  returnVisitorRate: number;

  // Quality Metrics
  jobQualityScore: number;
  applicationQualityScore: number;
  userSatisfactionScore: number;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  data: TrendData[];
}

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  metrics: string[];
  timestamp: string;
}

export interface DashboardData {
  kpis: JobBoardKPIs;
  trends: {
    users: MetricTrend;
    jobs: MetricTrend;
    applications: MetricTrend;
    searches: MetricTrend;
    revenue: MetricTrend;
  };
  insights: BusinessInsight[];
  lastUpdated: string;
}

/**
 * Business Metrics Hook
 * Provides comprehensive business intelligence and KPI tracking
 */
export function useBusinessMetrics() {
  const { trackEvent, isInitialized } = usePostHog();

  // Generate mock KPI data (in production, this would come from your analytics backend)
  const generateMockKPIs = (): JobBoardKPIs => {
    const baseDate = new Date();
    const randomVariation = (base: number, variance: number = 0.2) =>
      Math.floor(base * (1 + (Math.random() - 0.5) * variance));

    return {
      // User Metrics
      totalUsers: randomVariation(15420),
      activeUsers: randomVariation(8930),
      newUsersToday: randomVariation(45),
      newUsersThisWeek: randomVariation(312),
      newUsersThisMonth: randomVariation(1240),
      userRetentionRate: 0.68 + (Math.random() - 0.5) * 0.1,
      userGrowthRate: 0.15 + (Math.random() - 0.5) * 0.05,

      // Job Metrics
      totalJobs: randomVariation(2340),
      activeJobs: randomVariation(1890),
      newJobsToday: randomVariation(23),
      newJobsThisWeek: randomVariation(156),
      newJobsThisMonth: randomVariation(620),
      jobFillRate: 0.72 + (Math.random() - 0.5) * 0.1,
      averageTimeToFill: randomVariation(18), // days

      // Application Metrics
      totalApplications: randomVariation(45600),
      applicationsToday: randomVariation(234),
      applicationsThisWeek: randomVariation(1640),
      applicationsThisMonth: randomVariation(6800),
      applicationConversionRate: 0.12 + (Math.random() - 0.5) * 0.03,
      averageApplicationsPerJob: 19.5 + (Math.random() - 0.5) * 5,

      // Search Metrics
      totalSearches: randomVariation(123400),
      searchesToday: randomVariation(890),
      searchesThisWeek: randomVariation(6230),
      searchesThisMonth: randomVariation(24500),
      searchToViewRate: 0.34 + (Math.random() - 0.5) * 0.1,
      searchToApplicationRate: 0.08 + (Math.random() - 0.5) * 0.02,

      // Revenue Metrics
      totalRevenue: randomVariation(234500),
      revenueToday: randomVariation(1200),
      revenueThisWeek: randomVariation(8400),
      revenueThisMonth: randomVariation(32000),
      averageRevenuePerUser: randomVariation(185),
      customerLifetimeValue: randomVariation(2400),

      // Engagement Metrics
      averageSessionDuration: 420 + (Math.random() - 0.5) * 120, // seconds
      averagePageViews: 4.2 + (Math.random() - 0.5) * 1.5,
      bounceRate: 0.35 + (Math.random() - 0.5) * 0.1,
      returnVisitorRate: 0.42 + (Math.random() - 0.5) * 0.1,

      // Quality Metrics
      jobQualityScore: 7.8 + (Math.random() - 0.5) * 1.0,
      applicationQualityScore: 8.2 + (Math.random() - 0.5) * 0.8,
      userSatisfactionScore: 8.5 + (Math.random() - 0.5) * 0.6,
    };
  };

  // Generate trend data
  const generateTrendData = (
    baseValue: number,
    periods: number = 30
  ): TrendData[] => {
    const data: TrendData[] = [];
    let currentValue = baseValue;

    for (let i = periods; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.2;
      currentValue = Math.max(0, currentValue * (1 + variation));

      const previousValue =
        i === periods
          ? currentValue
          : data[data.length - 1]?.value || currentValue;
      const change = currentValue - previousValue;
      const changePercent =
        previousValue > 0 ? (change / previousValue) * 100 : 0;

      data.push({
        period: date.toISOString().split('T')[0],
        value: Math.round(currentValue),
        change: Math.round(change),
        changePercent: Math.round(changePercent * 100) / 100,
      });
    }

    return data;
  };

  // Generate metric trend
  const generateMetricTrend = (currentValue: number): MetricTrend => {
    const data = generateTrendData(currentValue);
    const previousValue = data[data.length - 2]?.value || currentValue;
    const change = currentValue - previousValue;
    const changePercent =
      previousValue > 0 ? (change / previousValue) * 100 : 0;

    return {
      current: currentValue,
      previous: previousValue,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      data,
    };
  };

  // Generate business insights
  const generateBusinessInsights = (kpis: JobBoardKPIs): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];

    // User growth insight
    if (kpis.userGrowthRate > 0.2) {
      insights.push({
        id: 'user-growth-high',
        type: 'success',
        title: 'Strong User Growth',
        description: `User growth rate of ${(kpis.userGrowthRate * 100).toFixed(1)}% is above target`,
        impact: 'high',
        actionable: true,
        recommendation: 'Consider scaling infrastructure and support team',
        metrics: ['userGrowthRate', 'newUsersThisMonth'],
        timestamp: new Date().toISOString(),
      });
    }

    // Application conversion insight
    if (kpis.applicationConversionRate < 0.1) {
      insights.push({
        id: 'low-conversion',
        type: 'warning',
        title: 'Low Application Conversion',
        description: `Application conversion rate of ${(kpis.applicationConversionRate * 100).toFixed(1)}% is below target`,
        impact: 'high',
        actionable: true,
        recommendation: 'Review job posting quality and application process UX',
        metrics: ['applicationConversionRate', 'searchToApplicationRate'],
        timestamp: new Date().toISOString(),
      });
    }

    // Job fill rate insight
    if (kpis.jobFillRate > 0.8) {
      insights.push({
        id: 'high-fill-rate',
        type: 'success',
        title: 'Excellent Job Fill Rate',
        description: `Job fill rate of ${(kpis.jobFillRate * 100).toFixed(1)}% indicates strong platform effectiveness`,
        impact: 'medium',
        actionable: false,
        metrics: ['jobFillRate', 'averageTimeToFill'],
        timestamp: new Date().toISOString(),
      });
    }

    // Bounce rate insight
    if (kpis.bounceRate > 0.4) {
      insights.push({
        id: 'high-bounce-rate',
        type: 'warning',
        title: 'High Bounce Rate',
        description: `Bounce rate of ${(kpis.bounceRate * 100).toFixed(1)}% suggests user experience issues`,
        impact: 'medium',
        actionable: true,
        recommendation:
          'Optimize landing pages and improve initial user experience',
        metrics: ['bounceRate', 'averageSessionDuration'],
        timestamp: new Date().toISOString(),
      });
    }

    // Revenue opportunity
    if (kpis.averageRevenuePerUser < 200) {
      insights.push({
        id: 'revenue-opportunity',
        type: 'opportunity',
        title: 'Revenue Growth Opportunity',
        description: `ARPU of $${kpis.averageRevenuePerUser} suggests potential for premium features`,
        impact: 'high',
        actionable: true,
        recommendation:
          'Consider introducing premium job posting features or subscription tiers',
        metrics: ['averageRevenuePerUser', 'customerLifetimeValue'],
        timestamp: new Date().toISOString(),
      });
    }

    return insights;
  };

  // Get dashboard data
  const getDashboardData = (): DashboardData => {
    const kpis = generateMockKPIs();

    return {
      kpis,
      trends: {
        users: generateMetricTrend(kpis.newUsersThisMonth),
        jobs: generateMetricTrend(kpis.newJobsThisMonth),
        applications: generateMetricTrend(kpis.applicationsThisMonth),
        searches: generateMetricTrend(kpis.searchesThisMonth),
        revenue: generateMetricTrend(kpis.revenueThisMonth),
      },
      insights: generateBusinessInsights(kpis),
      lastUpdated: new Date().toISOString(),
    };
  };

  // Track dashboard view
  const trackDashboardView = (section?: string) => {
    if (!isInitialized) return;

    trackEvent('business_dashboard_viewed', {
      section: section || 'overview',
      timestamp: new Date().toISOString(),
    });
  };

  // Track insight interaction
  const trackInsightInteraction = (
    insight: BusinessInsight,
    action: 'view' | 'dismiss' | 'act'
  ) => {
    if (!isInitialized) return;

    trackEvent('business_insight_interaction', {
      insight_id: insight.id,
      insight_type: insight.type,
      insight_impact: insight.impact,
      action,
      timestamp: new Date().toISOString(),
    });
  };

  // Track KPI drill-down
  const trackKPIDrillDown = (metric: string, value: number) => {
    if (!isInitialized) return;

    trackEvent('kpi_drill_down', {
      metric,
      value,
      timestamp: new Date().toISOString(),
    });
  };

  // Export dashboard data
  const exportDashboardData = (format: 'json' | 'csv' = 'json') => {
    const data = getDashboardData();

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert KPIs to CSV format
      const csvData = Object.entries(data.kpis)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');

      const blob = new Blob([`Metric,Value\n${csvData}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-kpis-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    trackEvent('dashboard_data_exported', {
      format,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    // Data functions
    getDashboardData,

    // Tracking functions
    trackDashboardView,
    trackInsightInteraction,
    trackKPIDrillDown,

    // Utility functions
    exportDashboardData,

    // State
    isInitialized,
  };
}
