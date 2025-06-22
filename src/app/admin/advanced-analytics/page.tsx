// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../api/auth/authOptions';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  FileText, 
  UserCheck, 
  Download,
  TrendingUp,
  Users,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import AnalyticsExportButton from '@/components/admin/AnalyticsExportButton';
import AutomatedReportsPanel from '@/components/admin/AutomatedReportsPanel';
import UserImpersonationPanel from '@/components/admin/UserImpersonationPanel';

export default async function AdvancedAnalyticsPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as any;

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics & Tools</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive analytics, automated reporting, and admin tools for 209 Works
          </p>
        </div>
        <div className="flex gap-3">
          <AnalyticsExportButton type="overview" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
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
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Chat Sessions</p>
                <p className="text-2xl font-bold text-gray-900">5,678</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +24% from last month
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Export Downloads</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Download className="h-3 w-3 mr-1" />
                  This month
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="exports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data Exports
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Automated Reports
          </TabsTrigger>
          <TabsTrigger value="impersonation" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            User Impersonation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Data Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">User Analytics</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export user registration, activity, and engagement data
                    </p>
                    <AnalyticsExportButton type="users" className="w-full" />
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Job Analytics</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export job postings, categories, and performance metrics
                    </p>
                    <AnalyticsExportButton type="jobs" className="w-full" />
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">AI Analytics</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export JobsGPT usage, queries, and performance data
                    </p>
                    <AnalyticsExportButton type="ai" className="w-full" />
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Application Analytics</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export job application data and conversion metrics
                    </p>
                    <AnalyticsExportButton type="applications" className="w-full" />
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-200 hover:border-red-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Complete Overview</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export comprehensive analytics overview and summary
                    </p>
                    <AnalyticsExportButton type="overview" className="w-full" />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Export Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Multiple format support (CSV, JSON)</li>
                  <li>• Custom date range filtering</li>
                  <li>• Real-time data extraction</li>
                  <li>• Secure download links</li>
                  <li>• Audit trail logging</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AutomatedReportsPanel />
        </TabsContent>

        <TabsContent value="impersonation" className="space-y-6">
          <UserImpersonationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
