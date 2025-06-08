'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleBasedRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session?.user) {
      const role = (session.user as any).role;
      
      switch (role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'employer':
          router.push('/employers/dashboard');
          break;
        case 'jobseeker':
        default:
          router.push('/');
          break;
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
}
