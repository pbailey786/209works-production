'use client';

import { useRouter } from 'next/navigation';
import JobModerationDetail from '@/components/admin/JobModerationDetail';

interface JobModerationClientProps {
  job: any;
}

export default function JobModerationClient({ job }: JobModerationClientProps) {
  const router = useRouter();

  const handleModerationAction = async (action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Use Next.js router instead of window.location.href
        router.push('/admin/moderation/jobs');
      } else {
        alert(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error moderating job:', error);
      alert('An error occurred while moderating the job');
    }
  };

  return <JobModerationDetail job={job} onAction={handleModerationAction} />;
}