'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function ClearSessionPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const clearSession = async () => {
    setLoading(true);
    setStatus('Clearing session...');
    
    try {
      // Method 1: Use NextAuth signOut
      await signOut({ redirect: false });
      setStatus('✅ Session cleared via NextAuth signOut');
      
      // Method 2: Also clear via our custom endpoint
      const response = await fetch('/api/auth/clear-session', {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus('✅ Session cleared successfully! You can now log in fresh.');
      } else {
        setStatus('⚠️ Session cleared via signOut, but custom endpoint failed');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
      setStatus('❌ Error clearing session: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const redirectToLogin = () => {
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Clear Session</h1>
        
        <p className="text-gray-600 mb-6">
          This will clear your current session and allow you to log in fresh with properly populated user data.
        </p>
        
        <button
          onClick={clearSession}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 mb-4"
        >
          {loading ? 'Clearing...' : 'Clear Session'}
        </button>
        
        {status && (
          <div className="mb-4 p-3 rounded-md bg-gray-100">
            <p className="text-sm">{status}</p>
          </div>
        )}
        
        {status.includes('✅') && (
          <button
            onClick={redirectToLogin}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Go to Login Page
          </button>
        )}
      </div>
    </div>
  );
}
