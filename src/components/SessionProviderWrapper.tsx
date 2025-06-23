'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { FEATURES } from '@/lib/feature-flags';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Phase 4A: Use real Clerk authentication if enabled
  if (FEATURES.CLERK_AUTH) {
    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#ea580c', // Orange-600 to match site theme
          },
        }}
      >
        {children}
      </ClerkProvider>
    );
  }

  // Fallback: Mock session (for development/testing)
  console.log('🔧 Mock SessionProvider - Clerk auth disabled');
  return <>{children}</>;
}
