'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function TestAuthPage() {
  const { data: session, status, update } = useSession();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string>('');

  const testLogin = async () => {
    setIsLoading(true);
    setTestResult('🧪 Starting authentication test...\n');
    
    try {
      // Test with timeout detection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setTestResult(prev => prev + '\n⏰ Login request timed out after 15 seconds\n');
        setIsLoading(false);
      }, 15000);

      // Test with test credentials
      const result = await signIn('credentials', {
        email: 'test@test.com',
        password: 'test123',
        redirect: false,
      });
      
      clearTimeout(timeoutId);
      setTestResult(prev => prev + `\n✅ Sign in result: ${JSON.stringify(result, null, 2)}\n`);
      
      // Wait a moment then check session with timeout
      setTimeout(async () => {
        try {
          const sessionController = new AbortController();
          const sessionTimeoutId = setTimeout(() => {
            sessionController.abort();
            setTestResult(prev => prev + '\n⏰ Session check timed out\n');
            setIsLoading(false);
          }, 10000);

          await update();
          const sessionResponse = await fetch('/api/auth/session', {
            signal: sessionController.signal,
          });
          
          clearTimeout(sessionTimeoutId);
          const newSession = await sessionResponse.json();
          setTestResult(prev => prev + `\n📋 Session after login: ${JSON.stringify(newSession, null, 2)}\n`);
          setIsLoading(false);
        } catch (sessionError) {
          setTestResult(prev => prev + `\n❌ Session check error: ${sessionError}\n`);
          setIsLoading(false);
        }
      }, 1000);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setTestResult(prev => prev + '\n❌ Request was aborted due to timeout\n');
      } else {
        setTestResult(prev => prev + `\n❌ Error: ${error}\n`);
      }
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    setTestResult(prev => prev + '\n🔄 Signing out...\n');
    
    try {
      await signOut({ redirect: false });
      
      setTimeout(async () => {
        await update();
        const newSession = await fetch('/api/auth/session').then(r => r.json());
        setTestResult(prev => prev + `\n📋 Session after logout: ${JSON.stringify(newSession, null, 2)}\n`);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Logout error: ${error}\n`);
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAuthStatus({ error: 'Auth status check timed out' });
        setLastStatusCheck(new Date().toLocaleTimeString());
      }, 10000);

      const response = await fetch('/api/debug/auth-status', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      setAuthStatus(data);
      setLastStatusCheck(new Date().toLocaleTimeString());
      console.log('🔍 Auth status check:', data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('🔍 Auth status check timed out');
        setAuthStatus({ error: 'Request timed out after 10 seconds' });
      } else {
        console.error('🔍 Auth status check failed:', error);
        setAuthStatus({ error: 'Failed to check auth status' });
      }
      setLastStatusCheck(new Date().toLocaleTimeString());
    }
  };

  const checkHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setHealthStatus({ error: 'Health check timed out' });
        setLastHealthCheck(new Date().toLocaleTimeString());
      }, 15000);

      const response = await fetch('/api/health', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      setHealthStatus(data);
      setLastHealthCheck(new Date().toLocaleTimeString());
      console.log('🏥 Health check:', data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('🏥 Health check timed out');
        setHealthStatus({ error: 'Request timed out after 15 seconds' });
      } else {
        console.error('🏥 Health check failed:', error);
        setHealthStatus({ error: 'Failed to check server health' });
      }
      setLastHealthCheck(new Date().toLocaleTimeString());
    }
  };

  // Auto-run auth status check and health check on page load
  useEffect(() => {
    checkAuthStatus();
    checkHealth();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>This test page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Authentication Test Page</h1>
      
      {/* Current Session Status */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Session Status</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <span className="font-bold">Status:</span> 
            <span className={
              status === 'loading' ? 'text-yellow-600' : 
              status === 'authenticated' ? 'text-green-600' : 
              'text-red-600'
            }> {status}</span>
          </div>
          
          <div>
            <span className="font-bold">Session exists:</span> 
            <span className={session ? 'text-green-600' : 'text-red-600'}>
              {session ? 'Yes' : 'No'}
            </span>
          </div>

          {session && (
            <>
              <div>
                <span className="font-bold">User exists:</span> 
                <span className={session.user ? 'text-green-600' : 'text-red-600'}>
                  {session.user ? 'Yes' : 'No'}
                </span>
              </div>
              
              {session.user && (
                <>
                  <div>
                    <span className="font-bold">User ID:</span> 
                    <span className={(session.user as any)?.id ? 'text-green-600' : 'text-red-600'}>
                      {(session.user as any)?.id || 'undefined'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">User Email:</span> 
                    <span className={session.user.email ? 'text-green-600' : 'text-red-600'}>
                      {session.user.email || 'undefined'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">User Name:</span> 
                    <span className={session.user.name ? 'text-green-600' : 'text-red-600'}>
                      {session.user.name || 'undefined'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">User Role:</span> 
                    <span className={(session.user as any)?.role ? 'text-green-600' : 'text-red-600'}>
                      {(session.user as any)?.role || 'undefined'}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Raw Session Data:</h3>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8 space-x-4">
        <button
          onClick={testLogin}
          disabled={isLoading || status === 'authenticated'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Login (test@test.com)'}
        </button>
        
        <button
          onClick={testLogout}
          disabled={isLoading || status === 'unauthenticated'}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Logout'}
        </button>
        
        <button
          onClick={update}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Refresh Session
        </button>
        
        <button
          onClick={checkAuthStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Check Auth Status
        </button>
        
        <button
          onClick={checkHealth}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Check Server Health
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {testResult}
          </pre>
          <button
            onClick={() => setTestResult('')}
            className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      )}

      {/* Auth Status Results */}
      {authStatus && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Auth Status Check 
            {lastStatusCheck && <span className="text-sm text-gray-500 ml-2">({lastStatusCheck})</span>}
          </h2>
          
          {authStatus.overall && (
            <div className={`p-4 rounded mb-4 ${
              authStatus.overall === 'HEALTHY' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-bold ${
                authStatus.overall === 'HEALTHY' ? 'text-green-800' : 'text-red-800'
              }`}>
                Overall Status: {authStatus.overall}
              </div>
              
              {authStatus.issues && authStatus.issues.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-red-700">Issues:</div>
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {authStatus.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {authStatus.warnings && authStatus.warnings.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-yellow-700">Warnings:</div>
                  <ul className="list-disc list-inside text-yellow-600 text-sm">
                    {authStatus.warnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {authStatus.recommendations && authStatus.recommendations.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-blue-700">Recommendations:</div>
                  <ul className="list-disc list-inside text-blue-600 text-sm">
                    {authStatus.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-auto max-h-64">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>
      )}

      {/* Health Check Results */}
      {healthStatus && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Server Health Check 
            {lastHealthCheck && <span className="text-sm text-gray-500 ml-2">({lastHealthCheck})</span>}
          </h2>
          
          {healthStatus.status && (
            <div className={`p-4 rounded mb-4 ${
              healthStatus.status === 'healthy' ? 'bg-green-50 border border-green-200' : 
              healthStatus.status === 'degraded' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-bold ${
                healthStatus.status === 'healthy' ? 'text-green-800' : 
                healthStatus.status === 'degraded' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                Status: {healthStatus.status?.toUpperCase()}
              </div>
              
              {healthStatus.checks && (
                <div className="mt-2 space-y-1 text-sm">
                  <div>Database: {healthStatus.checks.database?.status} ({healthStatus.checks.database?.responseTime}ms)</div>
                  <div>Redis: {healthStatus.checks.redis?.status} ({healthStatus.checks.redis?.responseTime}ms)</div>
                  <div>Memory: {healthStatus.checks.memory?.status} ({healthStatus.checks.memory?.usage}MB/{healthStatus.checks.memory?.limit}MB)</div>
                </div>
              )}
            </div>
          )}
          
          <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-auto max-h-64">
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
          <li>Click "Test Login" to authenticate with test@test.com/test123</li>
          <li>Check that session status becomes "authenticated"</li>
          <li>Verify that user data (ID, email, name, role) is populated</li>
          <li>Check browser console for debug logs from authOptions</li>
          <li>Click "Check Server Health" to verify connectivity</li>
          <li>Click "Test Logout" to end the session</li>
          <li>Verify that session status becomes "unauthenticated"</li>
        </ol>
      </div>
    </div>
  );
}