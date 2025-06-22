'use client';

// // import { SessionProvider } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk
import React from 'react';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Replace with Clerk provider when implemented
  console.log('🔧 Mock SessionProvider - NODE_ENV:', process.env.NODE_ENV);
  console.log(
    '🔧 Mock SessionProvider - Current window origin:',
    typeof window !== 'undefined' ? window.location.origin : 'server-side'
  );

  // Return children directly for now - replace with Clerk provider
  return <>{children}</>;
}
