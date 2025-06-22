'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <Search className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="mb-2 text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">
            Page Not Found
          </h2>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <p className="mb-4 text-gray-600">
            Oops! The page you're looking for doesn't exist or may have been
            moved.
          </p>
          <p className="text-sm text-gray-500">
            Don't worry, we'll help you find your way back to finding great
            jobs!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/jobs">
              <Search className="mr-2 h-4 w-4" />
              Browse Jobs
            </Link>
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 rounded-lg bg-white/50 p-4">
          <p className="mb-2 text-sm text-gray-600">
            Still can't find what you're looking for?
          </p>
          <Link
            href="/contact"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  );
}
