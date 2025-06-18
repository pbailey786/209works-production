'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status, update } = useSession();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async () => {
    setIsLoading(true);
    setTestResult('🧪 Starting authentication test...\n');
    
    try {
      // Test with test credentials
      const result = await signIn('credentials', {
        email: 'test@test.com',
        password: 'test123',
        redirect: false,
      });
      
      setTestResult(prev => prev + `\n✅ Sign in result: ${JSON.stringify(result, null, 2)}\n`);
      
      // Wait a moment then check session
      setTimeout(async () => {
        await update();
        const newSession = await fetch('/api/auth/session').then(r => r.json());
        setTestResult(prev => prev + `\n📋 Session after login: ${JSON.stringify(newSession, null, 2)}\n`);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Error: ${error}\n`);
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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
          <li>Click "Test Login" to authenticate with test@test.com/test123</li>
          <li>Check that session status becomes "authenticated"</li>
          <li>Verify that user data (ID, email, name, role) is populated</li>
          <li>Check browser console for debug logs from authOptions</li>
          <li>Click "Test Logout" to end the session</li>
          <li>Verify that session status becomes "unauthenticated"</li>
        </ol>
      </div>
    </div>
  );
}