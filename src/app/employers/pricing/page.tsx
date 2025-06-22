'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployerPricingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main employers page with pricing section
    router.push('/employers#pricing');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to pricing...</p>
      </div>
    </div>
  );
}
