import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  empty?: boolean;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-200" />
      <div className="h-6 w-full rounded bg-gray-200" />
    </div>
  );
}

export default function DashboardCard({
  title,
  description,
  children,
  isLoading,
  empty,
}: DashboardCardProps) {
  const headingId = `${title.replace(/\s+/g, '-').toLowerCase()}-heading`;
  return (
    <div
      className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg"
      role="region"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="mb-2 text-xl font-semibold">
        {title}
      </h2>
      <p className="mb-4 text-sm text-gray-600">{description}</p>
      <div className="mb-4 flex-1">
        {isLoading ? (
          <Skeleton />
        ) : empty ? (
          <p className="text-gray-400">No items yet.</p>
        ) : (
          children
        )}
      </div>
      <button
        className="mt-auto rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label={`Open ${title} widget`}
      >
        Open
      </button>
    </div>
  );
}
