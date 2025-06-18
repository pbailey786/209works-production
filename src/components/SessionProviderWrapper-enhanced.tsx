'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import React from 'react';

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log('🔄 SessionProvider mounting...');
    setIsMounted(true);
  }, []);

  // Always render SessionProvider but handle hydration gracefully
  return (
    <SessionProvider 
      // More aggressive refetch to catch session issues
      refetchInterval={60} // 1 minute for debugging
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {isMounted ? children : (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">Loading application...</div>
        </div>
      )}
    </SessionProvider>
  );
}