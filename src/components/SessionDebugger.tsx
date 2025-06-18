'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionDebugger() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 Session Debug Info:');
    console.log('  - Status:', status);
    console.log('  - Session data:', session);
    console.log('  - User ID:', (session?.user as any)?.id);
    console.log('  - User email:', session?.user?.email);
    console.log('  - User role:', (session?.user as any)?.role);
    console.log('  - Timestamp:', new Date().toISOString());

    // If stuck in loading state for too long, log additional info
    if (status === 'loading') {
      const timer = setTimeout(() => {
        console.warn('⚠️ Session has been in loading state for 5+ seconds');
        console.warn('  - Current URL:', window.location.href);
        console.warn('  - User agent:', navigator.userAgent);
        console.warn('  - Local storage keys:', Object.keys(localStorage));
        
        // Check for NextAuth cookies
        const cookies = document.cookie.split(';').map(c => c.trim());
        const nextAuthCookies = cookies.filter(c => c.includes('next-auth'));
        console.warn('  - NextAuth cookies:', nextAuthCookies);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [session, status]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded bg-black/80 p-2 text-xs text-white font-mono">
      <div>Status: <span className={`font-bold ${
        status === 'loading' ? 'text-yellow-400' : 
        status === 'authenticated' ? 'text-green-400' : 
        'text-red-400'
      }`}>{status}</span></div>
      {session?.user && (
        <>
          <div>Email: {session.user.email}</div>
          <div>Role: {(session.user as any)?.role}</div>
          <div>ID: {(session.user as any)?.id}</div>
        </>
      )}
      {status === 'loading' && (
        <div className="text-yellow-400 animate-pulse">Loading session...</div>
      )}
    </div>
  );
}