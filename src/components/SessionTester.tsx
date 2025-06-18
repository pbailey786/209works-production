'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SessionTester() {
  const { data: session, status, update } = useSession();
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshSession = async () => {
    await update();
    setRefreshCount(prev => prev + 1);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg bg-black/90 p-4 text-xs text-white font-mono">
      <div className="mb-2 font-bold text-yellow-400">🧪 Session Tester</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-blue-300">Status:</span> 
          <span className={
            status === 'loading' ? 'text-yellow-400' : 
            status === 'authenticated' ? 'text-green-400' : 
            'text-red-400'
          }> {status}</span>
        </div>
        
        <div>
          <span className="text-blue-300">Session exists:</span> 
          <span className={session ? 'text-green-400' : 'text-red-400'}>
            {session ? 'Yes' : 'No'}
          </span>
        </div>

        {session && (
          <>
            <div>
              <span className="text-blue-300">User exists:</span> 
              <span className={session.user ? 'text-green-400' : 'text-red-400'}>
                {session.user ? 'Yes' : 'No'}
              </span>
            </div>
            
            {session.user && (
              <>
                <div>
                  <span className="text-blue-300">ID:</span> 
                  <span className={(session.user as any)?.id ? 'text-green-400' : 'text-red-400'}>
                    {(session.user as any)?.id || 'undefined'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-300">Email:</span> 
                  <span className={session.user.email ? 'text-green-400' : 'text-red-400'}>
                    {session.user.email || 'undefined'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-300">Name:</span> 
                  <span className={session.user.name ? 'text-green-400' : 'text-red-400'}>
                    {session.user.name || 'undefined'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-300">Role:</span> 
                  <span className={(session.user as any)?.role ? 'text-green-400' : 'text-red-400'}>
                    {(session.user as any)?.role || 'undefined'}
                  </span>
                </div>
              </>
            )}
          </>
        )}
        
        <div className="mt-2 border-t border-gray-600 pt-2">
          <button 
            onClick={refreshSession}
            className="text-blue-300 hover:text-blue-200 underline"
          >
            Refresh Session ({refreshCount})
          </button>
        </div>
        
        <div className="mt-1 text-xs text-gray-400">
          Raw session: {JSON.stringify(session, null, 2)}
        </div>
      </div>
    </div>
  );
}