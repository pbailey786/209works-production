import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import SecurityDashboard from '@/components/security/SecurityDashboard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security Dashboard | 209 Works Admin',
  description: 'Enterprise security monitoring, threat detection, and compliance management for 209 Works platform',
};

// Loading component for security dashboard
function SecurityLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-0.5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['Overview', 'Threats', 'Compliance', 'System'].map((tab) => (
            <Skeleton key={tab} className="h-8 w-24" />
          ))}
        </div>
        
        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Server component to handle auth and setup
async function SecurityContent() {
  // No server-side data fetching needed - the dashboard component handles it
  return <SecurityDashboard />;
}

export default async function AdminSecurityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // TODO: Add proper admin role check
  // For now, assume all authenticated users can access security dashboard
  // In production, check if user has admin role

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="text-gray-600">
              Enterprise security monitoring, threat detection, and compliance management
            </p>
          </div>
        </div>

        {/* Quick info banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Threat Detection</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Real-time security monitoring</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">GDPR Compliance</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Data protection & privacy</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-medium">Audit Logging</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Complete activity tracking</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">Regional Security</span>
            </div>
            <p className="text-xs mt-1 opacity-90">Multi-domain protection</p>
          </div>
        </div>

        {/* Security Features Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Enterprise Security Features</CardTitle>
            <CardDescription>Comprehensive security and compliance capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Advanced Threat Detection</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  AI-powered threat detection with real-time monitoring and automated response
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">GDPR Compliance</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Complete GDPR compliance with consent management and data subject rights
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Comprehensive Audit Logs</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Complete audit trail of all user actions and system events
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">IP Blocking & Rate Limiting</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Automatic IP blocking and rate limiting to prevent abuse
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Data Encryption</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  End-to-end encryption for sensitive data and communications
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Regional Security</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Multi-domain security with regional threat monitoring
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Standards */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Security Standards & Compliance</CardTitle>
            <CardDescription>Industry standards and regulations we comply with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">GDPR</div>
                <div className="text-xs text-gray-600">EU Data Protection</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">CCPA</div>
                <div className="text-xs text-gray-600">California Privacy</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">SOC 2</div>
                <div className="text-xs text-gray-600">Security Controls</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">ISO 27001</div>
                <div className="text-xs text-gray-600">Security Management</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<SecurityLoading />}>
        <SecurityContent />
      </Suspense>
    </div>
  );
}
