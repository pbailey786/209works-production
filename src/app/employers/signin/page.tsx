'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployersSignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main sign-in page
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  );
}