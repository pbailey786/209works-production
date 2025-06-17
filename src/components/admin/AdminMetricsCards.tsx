import {
  Users,
  FileText,
  Send,
  Bell,
  Shield,
  TrendingUp,
  PlayCircle,
  Activity,
} from 'lucide-react';

interface MetricsData {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeAlerts: number;
  pendingModerations: number;
  monthlySignups: number;
  activeAds: number;
  systemHealth: {
    status: string;
    uptime: string;
    responseTime: string;
  };
}

interface AdminMetricsCardsProps {
  metrics: MetricsData;
}

export default function AdminMetricsCards({ metrics }: AdminMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      trend: `+${metrics.monthlySignups} this month`,
      trendColor: 'text-green-600',
    },
    {
      title: 'Job Listings',
      value: metrics.totalJobs.toLocaleString(),
      icon: FileText,
      color: 'bg-green-500',
      trend: `${metrics.pendingModerations} pending review`,
      trendColor: 'text-orange-600',
    },
    {
      title: 'Applications',
      value: metrics.totalApplications.toLocaleString(),
      icon: Send,
      color: 'bg-purple-500',
      trend: 'Total submissions',
      trendColor: 'text-gray-600',
    },
    {
      title: 'Active Alerts',
      value: metrics.activeAlerts.toLocaleString(),
      icon: Bell,
      color: 'bg-yellow-500',
      trend: 'Email notifications',
      trendColor: 'text-gray-600',
    },
    {
      title: 'Moderation Queue',
      value: metrics.pendingModerations.toString(),
      icon: Shield,
      color: 'bg-red-500',
      trend: 'Needs attention',
      trendColor:
        metrics.pendingModerations > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'Advertisements',
      value: metrics.activeAds.toLocaleString(),
      icon: PlayCircle,
      color: 'bg-indigo-500',
      trend: 'Active campaigns',
      trendColor: 'text-gray-600',
    },
    {
      title: 'System Health',
      value: metrics.systemHealth.uptime,
      icon: Activity,
      color: 'bg-emerald-500',
      trend: `${metrics.systemHealth.responseTime} avg response`,
      trendColor: 'text-gray-600',
    },
    {
      title: 'Monthly Growth',
      value: `+${metrics.monthlySignups}`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      trend: 'New users this month',
      trendColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-lg p-3 ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="truncate text-sm font-medium text-gray-500">
                {card.title}
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-sm ${card.trendColor}`}>{card.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
