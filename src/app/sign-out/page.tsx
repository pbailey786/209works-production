'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
        router.push('/');
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you out...</p>
      </div>
    </div>
  );
}