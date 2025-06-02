import Link from 'next/link';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function JobNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <ExclamationTriangleIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600">
            Sorry, we couldn't find the job listing you're looking for. 
            It may have been removed or the link might be incorrect.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Browse All Jobs
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
          >
            Go Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help? <Link href="/contact" className="text-purple-700 hover:text-purple-800">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 