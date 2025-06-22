'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley',
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno',
      });
    }

    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
            <svg
              className="h-12 w-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {isOnline ? 'Connection Issues' : 'You\'re Offline'}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            {isOnline
              ? 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.'
              : 'It looks like you\'re not connected to the internet. Please check your connection and try again.'
            }
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <div className="text-sm text-gray-500">
            or{' '}
            <Link href="/" className="text-primary hover:underline">
              go back to homepage
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            While you wait...
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Check your internet connection</p>
            <p>• Try refreshing the page</p>
            <p>• Make sure you're connected to WiFi or mobile data</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            {domainConfig.displayName} - Local jobs in the {domainConfig.region}
          </p>
        </div>
      </div>
    </div>
  );
}
