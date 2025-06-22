import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
      <h1 className="mb-4 text-5xl font-extrabold text-purple-700">404</h1>
      <h2 className="mb-2 text-2xl font-bold">Page Not Found</h2>
      <p className="mb-6 text-gray-600">
        Sorry, the page you are looking for does not exist. Try searching for a
        job or return to the homepage.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-purple-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        Go Home
      </Link>
    </div>
  );
}
