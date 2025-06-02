import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
      <h1 className="text-5xl font-extrabold text-purple-700 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-6">Sorry, the page you are looking for does not exist. Try searching for a job or return to the homepage.</p>
      <Link href="/" className="px-6 py-3 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition text-base focus:outline-none focus:ring-2 focus:ring-purple-500">Go Home</Link>
    </div>
  );
} 