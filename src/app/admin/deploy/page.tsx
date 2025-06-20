'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  Rocket, 
  Database, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function AdminDeployPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  if (status === 'unauthenticated') {
    router.push('/admin/signin');
    return null;
  }

  const runDeployment = async () => {
    setIsDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      const response = await fetch('/api/admin/deploy-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setDeploymentResult(result);
      } else {
        setError(result.error || 'Deployment failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Rocket className="mr-3 h-6 w-6 text-blue-600" />
              Chat History Deployment
            </h1>
            <p className="mt-2 text-gray-600">
              Deploy chat history feature and clean up test data
            </p>
          </div>

          <div className="p-6">
            {/* Deployment Actions */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  What this deployment will do:
                </h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center">
                    <Database className="mr-2 h-4 w-4" />
                    Update database schema with ChatHistory model
                  </li>
                  <li className="flex items-center">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove test/fake data from database
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify chat history functionality
                  </li>
                  <li className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clean up orphaned job applications
                  </li>
                </ul>
              </div>

              {/* Deploy Button */}
              <div className="flex justify-center">
                <button
                  onClick={runDeployment}
                  disabled={isDeploying}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    isDeploying
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Run Deployment
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-medium text-red-900">
                      Deployment Failed
                    </h3>
                  </div>
                  <p className="mt-2 text-red-800">{error}</p>
                </div>
              )}

              {/* Success Display */}
              {deploymentResult && deploymentResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium text-green-900">
                      Deployment Successful!
                    </h3>
                  </div>
                  
                  {deploymentResult.results.summary && (
                    <div className="space-y-4">
                      {/* Before/After Stats */}
                      {deploymentResult.results.summary.before && (
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">Database State Before:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>Jobs: {deploymentResult.results.summary.before.totalJobs}</div>
                            <div>Applications: {deploymentResult.results.summary.before.totalApplications}</div>
                            <div>Employers: {deploymentResult.results.summary.before.totalEmployers}</div>
                            <div>Job Seekers: {deploymentResult.results.summary.before.totalJobSeekers}</div>
                            <div>Jobs without Employer: {deploymentResult.results.summary.before.jobsWithoutEmployer}</div>
                          </div>
                        </div>
                      )}

                      {/* Cleanup Results */}
                      {deploymentResult.results.summary.cleanup && (
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">Cleanup Results:</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>Deleted Jobs: {deploymentResult.results.summary.cleanup.deletedJobs}</div>
                            <div>Deleted Users: {deploymentResult.results.summary.cleanup.deletedUsers}</div>
                            <div>Deleted Orphaned Apps: {deploymentResult.results.summary.cleanup.deletedOrphanedApplications}</div>
                          </div>
                        </div>
                      )}

                      {/* Final Verification */}
                      {deploymentResult.results.summary.after && (
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">Final State:</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>Chat History Records: {deploymentResult.results.summary.after.chatHistoryRecords}</div>
                            <div>Valid Applications: {deploymentResult.results.summary.after.validJobApplications}</div>
                            <div>Jobs with Employers: {deploymentResult.results.summary.after.jobsWithEmployers}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
