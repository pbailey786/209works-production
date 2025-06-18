'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import React from 'react';

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure we're hydrated on the client side
    setIsHydrated(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return <div className="min-h-screen bg-white" />; // Loading placeholder
  }

  return (
    <SessionProvider 
      // Reduce refetch interval to help with stuck loading states
      refetchInterval={5 * 60} // 5 minutes instead of default 60 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      // Ensure session is properly loaded on mount
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}