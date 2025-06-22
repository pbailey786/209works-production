import Link from 'next/link';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  className?: string;
}

export default function PlaceholderPage({
  title = "Page Under Development",
  description = "This page is currently being built. Check back soon!",
  showBackButton = true,
  className = ""
}: PlaceholderPageProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-10 w-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {title}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {showBackButton && (
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
            <div className="text-sm text-gray-500">
              or <Link href="/jobs" className="text-primary hover:underline">browse jobs</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
