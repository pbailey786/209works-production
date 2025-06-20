'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import JobSeekerAnalyticsDashboard from '@/components/analytics/JobSeekerAnalyticsDashboard';
import EmployerAnalyticsDashboard from '@/components/analytics/EmployerAnalyticsDashboard';
import AdminAnalyticsDashboard from '@/components/analytics/AdminAnalyticsDashboard';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Shield,
  ArrowLeft,
  Download,
  Share,
  Calendar
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Get user role from metadata
  const userRole = user?.publicMetadata?.role as string || 'job_seeker';

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'employer':
        return <Briefcase className="h-5 w-5" />;
      case 'job_seeker':
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employer':
        return 'bg-blue-100 text-blue-800';
      case 'job_seeker':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Platform Analytics';
      case 'employer':
        return 'Hiring Analytics';
      case 'job_seeker':
      default:
        return 'Job Search Analytics';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Comprehensive platform insights, user metrics, and business intelligence';
      case 'employer':
        return 'Track your job posting performance, applications, and hiring metrics';
      case 'job_seeker':
      default:
        return 'Monitor your job search progress, applications, and platform engagement';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(userRole)}>
                      {getRoleIcon(userRole)}
                      <span className="ml-1 capitalize">{userRole.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Export Report
              </Button>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-specific intro */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getRoleIcon(userRole)}
                <div>
                  <CardTitle>{getRoleTitle(userRole)}</CardTitle>
                  <CardDescription>{getRoleDescription(userRole)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Real-time Data</h3>
                    <p className="text-sm text-blue-700">Live updates every 30 seconds</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Advanced Metrics</h3>
                    <p className="text-sm text-green-700">Comprehensive performance tracking</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Download className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Export & Share</h3>
                    <p className="text-sm text-purple-700">Download reports and insights</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific Dashboard */}
        {userRole === 'admin' && (
          <AdminAnalyticsDashboard />
        )}
        
        {userRole === 'employer' && (
          <EmployerAnalyticsDashboard />
        )}
        
        {(userRole === 'job_seeker' || !userRole) && (
          <JobSeekerAnalyticsDashboard />
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">209 Works Analytics</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Data is updated in real-time and reflects activity across the 209 Works platform.
                All metrics are calculated based on your selected time range and filters.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <span>•</span>
                <span>Data retention: 2 years</span>
                <span>•</span>
                <span>Privacy compliant</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
