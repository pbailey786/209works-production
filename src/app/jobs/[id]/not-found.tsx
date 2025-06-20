

import {
  import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function JobNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <ExclamationTriangleIcon className="mx-auto mb-4 h-24 w-24 text-gray-400" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Job Not Found
          </h1>
          <p className="text-gray-600">
            Sorry, we couldn't find the job listing you're looking for. It may
            have been removed or the link might be incorrect.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/jobs"
            className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-purple-700 px-6 py-3 text-base font-medium text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
            Browse All Jobs
          </Link>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Go Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help?{' '}
            <Link
              href="/contact"
              className="text-purple-700 hover:text-purple-800"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
