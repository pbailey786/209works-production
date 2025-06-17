'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug environment variables
  console.log('🔧 SessionProvider - NODE_ENV:', process.env.NODE_ENV);
  console.log(
    '🔧 SessionProvider - Current window origin:',
    typeof window !== 'undefined' ? window.location.origin : 'server-side'
  );

  // For development, ensure we're using the correct base URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXTAUTH_URL || 'http://localhost:3001';

  console.log('🔧 SessionProvider - Using baseUrl:', baseUrl);

  return (
    <SessionProvider 
      basePath="/api/auth"
      baseUrl={baseUrl}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
