'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md text-center">
            {/* Error Illustration */}
            <div className="mb-8">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="mb-2 text-6xl font-bold text-gray-900">500</h1>
              <h2 className="mb-4 text-2xl font-semibold text-gray-700">
                Something went wrong
              </h2>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <p className="mb-4 text-gray-600">
                We're experiencing some technical difficulties. Our team has
                been notified and is working to fix the issue.
              </p>
              <p className="text-sm text-gray-500">
                Please try again in a few minutes or contact support if the
                problem persists.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="mb-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details (Development)
                </summary>
                <div className="max-h-40 overflow-auto rounded bg-gray-100 p-3 font-mono text-xs text-gray-800">
                  <p className="mb-1 font-semibold">Error Message:</p>
                  <p className="mb-3">{error.message}</p>

                  {error.digest && (
                    <>
                      <p className="mb-1 font-semibold">Error Digest:</p>
                      <p className="mb-3">{error.digest}</p>
                    </>
                  )}

                  <p className="mb-1 font-semibold">Stack Trace:</p>
                  <pre className="whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </div>
              </details>
            )}

            {/* Contact Support */}
            <div className="mt-8 rounded-lg bg-white/50 p-4">
              <p className="mb-2 text-sm text-gray-600">
                Need immediate assistance?
              </p>
              <a
                href="/contact"
                className="text-sm font-medium text-red-600 underline hover:text-red-800"
              >
                Contact our support team
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
