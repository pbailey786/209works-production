'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import React from 'react';
import { toast } from '@/hooks/use-toast';

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [sessionErrors, setSessionErrors] = useState<string[]>([]);

  useEffect(() => {
    console.log('🔄 SessionProvider mounting...');
    setIsMounted(true);

    // Listen for fetch errors that might indicate timeout issues
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check if this is a NextAuth request that's timing out
        if (args[0]?.toString().includes('/api/auth/')) {
          const url = args[0]?.toString();
          
          if (!response.ok) {
            console.error(`🚨 NextAuth request failed: ${url} - ${response.status}`);
            if (response.status >= 500) {
              toast({
                title: 'Authentication Service Issue',
                description: 'Having trouble connecting to authentication service. Please try again.',
                variant: 'destructive',
              });
            }
          }
        }
        
        return response;
      } catch (error) {
        // Check if this is a NextAuth timeout
        if (args[0]?.toString().includes('/api/auth/')) {
          console.error('🚨 NextAuth request timeout:', args[0], error);
          setSessionErrors(prev => [...prev, `Auth request timeout: ${error}`]);
          
          toast({
            title: 'Connection Timeout',
            description: 'Authentication request timed out. Please check your connection.',
            variant: 'destructive',
          });
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Always render SessionProvider but handle hydration gracefully
  return (
    <SessionProvider 
      // v5 has better default session handling, reduce refetch frequency
      refetchInterval={process.env.NODE_ENV === 'development' ? 300 : 0} // 5 min dev, disabled prod
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {isMounted ? children : (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse">
            <div className="text-gray-500 text-center">
              <div className="text-lg font-medium">Loading 209 Jobs...</div>
              <div className="text-sm mt-2">Initializing your session</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Show session errors in development */}
      {process.env.NODE_ENV === 'development' && sessionErrors.length > 0 && (
        <div className="fixed top-0 left-0 w-full bg-red-100 border-b border-red-200 p-2 z-50">
          <div className="text-red-800 text-sm">
            Session Errors: {sessionErrors.length} errors detected
            <button 
              onClick={() => setSessionErrors([])}
              className="ml-2 px-2 py-1 bg-red-200 text-red-800 rounded text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}