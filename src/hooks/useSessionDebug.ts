'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export function useSessionDebug() {
  const { data: session, status } = useSession();
  const previousStatus = useRef(status);
  const previousSession = useRef(session);

  useEffect(() => {
    // Log status changes
    if (previousStatus.current !== status) {
      console.log('🔄 Session status changed:', {
        from: previousStatus.current,
        to: status,
        timestamp: new Date().toISOString(),
      });
      previousStatus.current = status;
    }

    // Log session data changes
    if (JSON.stringify(previousSession.current) !== JSON.stringify(session)) {
      console.log('📋 Session data changed:', {
        previous: previousSession.current,
        current: session,
        timestamp: new Date().toISOString(),
      });
      
      // Detailed analysis of user data
      if (session?.user) {
        const user = session.user as any;
        console.log('👤 User data analysis:', {
          hasId: !!user.id,
          hasEmail: !!user.email,
          hasName: !!user.name,
          hasRole: !!user.role,
          idValue: user.id,
          emailValue: user.email,
          nameValue: user.name,
          roleValue: user.role,
        });
        
        // Check for undefined fields that should be populated
        const missingFields = [];
        if (!user.id) missingFields.push('id');
        if (!user.email) missingFields.push('email');
        if (!user.role) missingFields.push('role');
        
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing user fields:', missingFields);
        }
      }
      
      previousSession.current = session;
    }

    // Continuous monitoring for authenticated but incomplete sessions
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      if (!user.id || !user.email || !user.role) {
        console.error('🚨 CRITICAL: Authenticated session with incomplete user data', {
          status,
          hasUser: !!session.user,
          hasId: !!user.id,
          hasEmail: !!user.email,
          hasRole: !!user.role,
          session: session,
        });
      }
    }
  }, [session, status]);

  // Return debugging information
  return {
    status,
    session,
    isAuthenticated: status === 'authenticated',
    hasUser: !!session?.user,
    hasUserId: !!(session?.user as any)?.id,
    hasUserEmail: !!session?.user?.email,
    hasUserRole: !!(session?.user as any)?.role,
    isIncomplete: status === 'authenticated' && (!!(session?.user) && (!(session?.user as any)?.id || !session?.user?.email || !(session?.user as any)?.role)),
  };
}