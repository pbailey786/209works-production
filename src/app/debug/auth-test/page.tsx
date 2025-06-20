'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function AuthTestPage() {
  const { data: session, status, update } = useSession();
  const [isClearing, setIsClearing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const clearCookies = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/auth/clear-cookies', {
        method: 'POST',
      });
      const result = await response.json();
      console.log('Clear cookies result:', result);
      
      // Also clear client-side cookies
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cookies:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const testCredentialsLogin = async () => {
    try {
      const result = await signIn('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
      setTestResult(result);
      console.log('Credentials login result:', result);
    } catch (error) {
      console.error('Credentials login error:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testGoogleLogin = async () => {
    try {
      const result = await signIn('google', {
        redirect: false,
      });
      setTestResult(result);
      console.log('Google login result:', result);
    } catch (error) {
      console.error('Google login error:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testSessionRefresh = async () => {
    try {
      await update();
      console.log('Session refreshed');
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NextAuth v5 Debug Test</h1>
        
        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <div>Status: <span className={`font-mono px-2 py-1 rounded ${
              status === 'authenticated' ? 'bg-green-100 text-green-800' :
              status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>{status}</span></div>
            
            {session?.user && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">User Data:</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div>ID: <span className={(session.user as any)?.id ? 'text-green-600' : 'text-red-600'}>
                    {(session.user as any)?.id || 'undefined'}
                  </span></div>
                  <div>Email: <span className={session.user.email ? 'text-green-600' : 'text-red-600'}>
                    {session.user.email || 'undefined'}
                  </span></div>
                  <div>Name: <span className={session.user.name ? 'text-green-600' : 'text-red-600'}>
                    {session.user.name || 'undefined'}
                  </span></div>
                  <div>Role: <span className={(session.user as any)?.role ? 'text-green-600' : 'text-red-600'}>
                    {(session.user as any)?.role || 'undefined'}
                  </span></div>
                </div>
              </div>
            )}
            
            {!session && status !== 'loading' && (
              <div className="text-gray-600">No session data</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={clearCookies}
              disabled={isClearing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Clear Cookies'}
            </button>
            
            <button
              onClick={testCredentialsLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Credentials Login
            </button>
            
            <button
              onClick={testGoogleLogin}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Google Login
            </button>
            
            <button
              onClick={testSessionRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Refresh Session
            </button>
            
            {session && (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Raw Session Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
