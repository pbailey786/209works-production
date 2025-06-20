'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

export default function ClearSessionPage() {
  const [status, setStatus] = useState<string>('Starting session clear...');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const clearSession = async () => {
    try {
      setStep(1);
      setStatus('🔄 Clearing NextAuth session...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Method 1: Use NextAuth signOut
      await signOut({ redirect: false });

      setStep(2);
      setStatus('🍪 Clearing all cookies...');
      await new Promise(resolve => setTimeout(resolve, 600));

      // Clear all cookies aggressively
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        // Clear for multiple domains and paths
        const domains = [window.location.hostname, `.${window.location.hostname}`, 'localhost', '.localhost'];
        const paths = ['/', '/api', '/api/auth'];

        for (let domain of domains) {
          for (let path of paths) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
          }
        }
      }

      setStep(3);
      setStatus('💾 Clearing local storage...');
      await new Promise(resolve => setTimeout(resolve, 400));
      localStorage.clear();
      sessionStorage.clear();

      setStep(4);
      setStatus('🌐 Clearing server session...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Method 2: Also clear via our custom endpoint
      try {
        await fetch('/api/auth/clear-session', {
          method: 'POST',
        });
      } catch (e) {
        console.log('Server clear failed (expected):', e);
      }

      setStep(5);
      setStatus('✅ Session cleared successfully! Redirecting...');
      setLoading(false);

      // Redirect after showing success
      setTimeout(() => {
        window.location.href = '/employers/signin';
      }, 2000);

    } catch (error) {
      console.error('Error clearing session:', error);
      setStatus('⚠️ Mostly cleared - redirecting anyway...');
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/employers/signin';
      }, 3000);
    }
  };

  useEffect(() => {
    // Auto-start clearing process
    clearSession();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🔧 Fixing Your Session
        </h1>

        <div className="mb-6">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">{status}</p>
                <div className="flex justify-center space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        step >= i ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-green-600 text-4xl">✅</div>
              <p className="text-gray-700 font-medium">{status}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-2">This fixes:</p>
          <ul className="text-left space-y-1">
            <li>• Logout loops</li>
            <li>• Missing user role data</li>
            <li>• Broken session cookies</li>
            <li>• Authentication errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
