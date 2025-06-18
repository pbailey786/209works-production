'use client';

import { useEffect, useState } from 'react';

export default function SecurityErrorHandler() {
  const [hasSecurityError, setHasSecurityError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    // Listen for security errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('SecurityError') || 
          event.message?.includes('SecurityError') ||
          event.message?.includes('replaceState') ||
          event.message?.includes('History')) {
        console.error('🚨 SecurityError detected:', event);
        setHasSecurityError(true);
        setErrorDetails(event.message || event.error?.message || 'Unknown security error');
        
        // Try to fix by clearing NextAuth state
        try {
          // Clear NextAuth cookies and local storage
          document.cookie.split(";").forEach(function(c) { 
            if (c.includes('next-auth')) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            }
          });
          
          // Clear local storage
          localStorage.clear();
          
          console.log('🔧 Cleared NextAuth state, please refresh the page');
        } catch (clearError) {
          console.error('🔧 Failed to clear auth state:', clearError);
        }
      }
    };

    // Listen for unhandled errors
    window.addEventListener('error', handleError);
    
    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('SecurityError') || 
          event.reason?.message?.includes('replaceState')) {
        console.error('🚨 SecurityError in promise:', event);
        setHasSecurityError(true);
        setErrorDetails(event.reason?.message || 'Unknown security error in promise');
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!hasSecurityError) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold mb-2">🚨 Security Error Detected</h2>
        <p className="mb-2">NextAuth URL configuration issue detected. This usually happens when:</p>
        <ul className="list-disc list-inside mb-4 text-sm">
          <li>NEXTAUTH_URL environment variable doesn't match the current domain</li>
          <li>Running on a different domain than configured</li>
          <li>URL mismatch between client and server</li>
        </ul>
        
        <div className="bg-red-800 p-3 rounded mb-4">
          <p className="text-xs font-mono">{errorDetails}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              // Clear everything and reload
              try {
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                window.location.href = '/';
              } catch (error) {
                window.location.reload();
              }
            }}
            className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-gray-100"
          >
            Clear Auth & Reload
          </button>
          
          <button
            onClick={() => setHasSecurityError(false)}
            className="bg-red-800 text-white px-4 py-2 rounded font-medium hover:bg-red-900"
          >
            Dismiss
          </button>

          <a
            href="/"
            className="bg-red-800 text-white px-4 py-2 rounded font-medium hover:bg-red-900"
          >
            Go Home
          </a>
        </div>

        <div className="mt-4 text-xs">
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          <p><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}