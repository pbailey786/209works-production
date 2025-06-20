'use client';

import { useState, useEffect } from 'react';

export default function TestIronSessionPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/iron/session');
      const data = await res.json();
      setSession(data);
      console.log('Session check:', data);
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const login = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/auth/iron/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123',
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('✅ Login successful!');
        console.log('Login response:', data);
        await checkSession();
      } else {
        setMessage(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/auth/iron/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        setMessage('✅ Logout successful!');
        await checkSession();
      } else {
        setMessage('❌ Logout failed');
      }
    } catch (error) {
      setMessage(`❌ Logout error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔒 Iron Session Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Session</h2>
        <div className="font-mono text-sm">
          <div>
            <span className="font-bold">Authenticated:</span> 
            <span className={session?.authenticated ? 'text-green-600' : 'text-red-600'}>
              {session?.authenticated ? 'Yes' : 'No'}
            </span>
          </div>
          
          {session?.user && (
            <>
              <div>
                <span className="font-bold">User ID:</span> 
                <span className="text-green-600">{session.user.id}</span>
              </div>
              <div>
                <span className="font-bold">Email:</span> 
                <span className="text-green-600">{session.user.email}</span>
              </div>
              <div>
                <span className="font-bold">Name:</span> 
                <span className="text-green-600">{session.user.name}</span>
              </div>
              <div>
                <span className="font-bold">Role:</span> 
                <span className="text-green-600">{session.user.role}</span>
              </div>
            </>
          )}
        </div>
        
        <pre className="mt-4 bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="mb-4 space-x-4">
        <button
          onClick={login}
          disabled={loading || session?.authenticated}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Login'}
        </button>
        
        <button
          onClick={logout}
          disabled={loading || !session?.authenticated}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Logout'}
        </button>
        
        <button
          onClick={checkSession}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Refresh Session
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
          {message}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">Iron Session Benefits</h2>
        <ul className="list-disc list-inside text-blue-700 text-sm">
          <li>No complex callbacks or configuration</li>
          <li>Works perfectly with Next.js 15</li>
          <li>User data is always available</li>
          <li>No "User: undefined" issues</li>
          <li>Simple, encrypted cookie-based sessions</li>
        </ul>
      </div>
    </div>
  );
}