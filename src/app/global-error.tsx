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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            {/* Error Illustration */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Something went wrong
              </h2>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <p className="text-gray-600 mb-4">
                We're experiencing some technical difficulties. Our team has been notified and is working to fix the issue.
              </p>
              <p className="text-sm text-gray-500">
                Please try again in a few minutes or contact support if the problem persists.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
                  Error Details (Development)
                </summary>
                <div className="p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <p className="font-semibold mb-1">Error Message:</p>
                  <p className="mb-3">{error.message}</p>
                  
                  {error.digest && (
                    <>
                      <p className="font-semibold mb-1">Error Digest:</p>
                      <p className="mb-3">{error.digest}</p>
                    </>
                  )}
                  
                  <p className="font-semibold mb-1">Stack Trace:</p>
                  <pre className="whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </div>
              </details>
            )}

            {/* Contact Support */}
            <div className="mt-8 p-4 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Need immediate assistance?
              </p>
              <a 
                href="mailto:support@209.works"
                className="text-red-600 hover:text-red-800 font-medium text-sm underline"
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