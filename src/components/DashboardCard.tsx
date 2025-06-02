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
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-6 bg-gray-200 rounded w-full" />
    </div>
  );
}

export default function DashboardCard({ title, description, children, isLoading, empty }: DashboardCardProps) {
  const headingId = `${title.replace(/\s+/g, '-').toLowerCase()}-heading`;
  return (
    <div
      className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col h-full"
      role="region"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
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
        className="mt-auto bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label={`Open ${title} widget`}
      >
        Open
      </button>
    </div>
  );
} 