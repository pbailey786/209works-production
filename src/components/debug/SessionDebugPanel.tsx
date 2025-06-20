'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function SessionDebugPanel() {
  const { data: session, status, update } = useSession();
  const [apiSessionData, setApiSessionData] = useState<any>(null);
  const [serverSessionData, setServerSessionData] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Test direct API call
  useEffect(() => {
    const testApiSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setApiSessionData(data);
      } catch (error) {
        console.error('API session test failed:', error);
        setApiSessionData({ error: error.message });
      }
    };

    testApiSession();
  }, [refreshCount]);

  // Test server session
  useEffect(() => {
    const testServerSession = async () => {
      try {
        const response = await fetch('/api/debug/server-session');
        const data = await response.json();
        setServerSessionData(data);
      } catch (error) {
        console.error('Server session test failed:', error);
        setServerSessionData({ error: error.message });
      }
    };

    testServerSession();
  }, [refreshCount]);

  const refreshSession = async () => {
    console.log('🔄 Manual session refresh triggered');
    await update();
    setRefreshCount(prev => prev + 1);
  };

  const clearCookies = () => {
    // Clear NextAuth cookies
    document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-black text-white p-4 rounded-lg shadow-lg text-xs font-mono z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-yellow-400">NextAuth v5 Debug Panel</h3>
        <div className="flex gap-2">
          <button 
            onClick={refreshSession}
            className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
          >
            Refresh
          </button>
          <button 
            onClick={clearCookies}
            className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            Clear Cookies
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* useSession Hook Data */}
        <div>
          <div className="text-blue-300 font-bold">useSession Hook:</div>
          <div>Status: <span className={status === 'authenticated' ? 'text-green-400' : status === 'loading' ? 'text-yellow-400' : 'text-red-400'}>{status}</span></div>
          
          {session?.user && (
            <div className="ml-2">
              <div>ID: <span className={(session.user as any)?.id ? 'text-green-400' : 'text-red-400'}>{(session.user as any)?.id || 'undefined'}</span></div>
              <div>Email: <span className={session.user.email ? 'text-green-400' : 'text-red-400'}>{session.user.email || 'undefined'}</span></div>
              <div>Name: <span className={session.user.name ? 'text-green-400' : 'text-red-400'}>{session.user.name || 'undefined'}</span></div>
              <div>Role: <span className={(session.user as any)?.role ? 'text-green-400' : 'text-red-400'}>{(session.user as any)?.role || 'undefined'}</span></div>
            </div>
          )}
        </div>

        {/* API Session Data */}
        <div>
          <div className="text-blue-300 font-bold">API /api/auth/session:</div>
          {apiSessionData ? (
            <div className="ml-2">
              <div>Authenticated: <span className={apiSessionData.authenticated ? 'text-green-400' : 'text-red-400'}>{String(apiSessionData.authenticated)}</span></div>
              {apiSessionData.session?.user && (
                <div className="ml-2">
                  <div>ID: <span className={apiSessionData.session.user.id ? 'text-green-400' : 'text-red-400'}>{apiSessionData.session.user.id || 'undefined'}</span></div>
                  <div>Email: <span className={apiSessionData.session.user.email ? 'text-green-400' : 'text-red-400'}>{apiSessionData.session.user.email || 'undefined'}</span></div>
                  <div>Role: <span className={apiSessionData.session.user.role ? 'text-green-400' : 'text-red-400'}>{apiSessionData.session.user.role || 'undefined'}</span></div>
                </div>
              )}
              {apiSessionData.error && (
                <div className="text-red-400">Error: {apiSessionData.error}</div>
              )}
            </div>
          ) : (
            <div className="text-yellow-400 ml-2">Loading...</div>
          )}
        </div>

        {/* Server Session Data */}
        <div>
          <div className="text-blue-300 font-bold">Server Session:</div>
          {serverSessionData ? (
            <div className="ml-2">
              {serverSessionData.session ? (
                <div>
                  <div>Has Session: <span className="text-green-400">true</span></div>
                  <div>ID: <span className={serverSessionData.session.user?.id ? 'text-green-400' : 'text-red-400'}>{serverSessionData.session.user?.id || 'undefined'}</span></div>
                  <div>Email: <span className={serverSessionData.session.user?.email ? 'text-green-400' : 'text-red-400'}>{serverSessionData.session.user?.email || 'undefined'}</span></div>
                  <div>Role: <span className={serverSessionData.session.user?.role ? 'text-green-400' : 'text-red-400'}>{serverSessionData.session.user?.role || 'undefined'}</span></div>
                </div>
              ) : (
                <div className="text-red-400">No server session</div>
              )}
              {serverSessionData.error && (
                <div className="text-red-400">Error: {serverSessionData.error}</div>
              )}
            </div>
          ) : (
            <div className="text-yellow-400 ml-2">Loading...</div>
          )}
        </div>

        {/* Environment Check */}
        <div>
          <div className="text-blue-300 font-bold">Environment:</div>
          <div className="ml-2">
            <div>NODE_ENV: {process.env.NODE_ENV}</div>
            <div>Refresh Count: {refreshCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
