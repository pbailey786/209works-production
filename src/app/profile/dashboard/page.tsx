'use client';
import React from 'react';
import DashboardCard from '@/components/DashboardCard';

// In a production app, you would fetch real data and manage loading/empty states with hooks or state management here.
// For now, we use static placeholder data and demo loading/empty states.
const widgets = [
  {
    title: 'Saved Jobs',
    description: "View jobs you've saved for later.",
    // TODO: Replace with real saved jobs data from backend/API
    // Example: Use SWR/React Query or useEffect to fetch jobs, and set isLoading/empty accordingly
    isLoading: true, // Simulate loading state
    content: null,
  },
  {
    title: 'Application History',
    description: "Track where you've applied and when.",
    // TODO: Replace with real application history data from backend/API
    empty: true, // Simulate empty state
    content: null,
  },
  {
    title: 'Alerts & Notifications',
    description: 'Manage your job alerts and notifications.',
    // TODO: Replace with real alerts/notifications data from backend/API
    content: (
      <p className="text-sm text-gray-500">
        New alert: "Remote jobs in Stockton"
      </p>
    ),
  },
  {
    title: 'Resume Versions',
    description: 'Upload and manage different versions of your resume.',
    // TODO: Replace with real resume version data from backend/API
    content: <p className="text-sm text-gray-500">Resume_2025_V2.pdf</p>,
  },
  {
    title: 'Cover Letters',
    description: 'Create and store custom cover letters.',
    // TODO: Replace with real cover letter data from backend/API
    content: (
      <p className="text-sm text-gray-500">CoverLetter_MarketingRole.docx</p>
    ),
  },
];

export default function DashboardPage() {
  // In a real app, you might use useEffect or a data fetching library here to load widget data
  // Example: const { data, isLoading } = useQuery(...)
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Your Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map((w, i) => (
          <DashboardCard
            key={i}
            title={w.title}
            description={w.description}
            isLoading={w.isLoading}
            empty={w.empty}
          >
            {/* In production, replace this with dynamic content from API or state */}
            {w.content}
          </DashboardCard>
        ))}
      </div>
    </main>
  );
}
