'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Play, 
  Clock, 
  XCircle,
  BarChart3,
  DollarSign,
  Eye,
  MousePointer
} from 'lucide-react';

interface AdManagementStatsProps {
  totalAds: number;
  activeAds: number;
  scheduledAds: number;
  expiredAds: number;
}

export default function AdManagementStats({ 
  totalAds, 
  activeAds, 
  scheduledAds, 
  expiredAds 
}: AdManagementStatsProps) {
  const stats = [
    {
      title: 'Total Advertisements',
      value: totalAds,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'All ads on platform'
    },
    {
      title: 'Active Ads',
      value: activeAds,
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Currently running'
    },
    {
      title: 'Scheduled Ads',
      value: scheduledAds,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Waiting to start'
    },
    {
      title: 'Expired Ads',
      value: expiredAds,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'Campaign ended'
    }
  ];

  // Calculate percentages
  const activePercentage = totalAds > 0 ? Math.round((activeAds / totalAds) * 100) : 0;
  const scheduledPercentage = totalAds > 0 ? Math.round((scheduledAds / totalAds) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
                
                {/* Show percentage for active and scheduled */}
                {stat.title === 'Active Ads' && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {activePercentage}% of total
                  </div>
                )}
                {stat.title === 'Scheduled Ads' && (
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {scheduledPercentage}% of total
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 