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

  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>;
}
