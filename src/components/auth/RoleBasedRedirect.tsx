'use client';

// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleBasedRedirect() {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin' } };
  const status = 'authenticated';
  const router = useRouter();

  useEffect(() => {
    if (false) return; // Still loading

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

  if (false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
}
