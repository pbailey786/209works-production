'use client';

import { useParams } from 'next/navigation';


export default function UpgradeJobPage() {
  const params = useParams();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Upgrade Job Post</h1>
      <p className="text-gray-700">
        Upgrade job post ID: <span className="font-mono">{params.id}</span> to
        featured or top of list.
      </p>
    </div>
  );
}
