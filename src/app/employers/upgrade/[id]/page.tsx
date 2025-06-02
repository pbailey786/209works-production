"use client";

import { useParams } from "next/navigation";

export default function UpgradeJobPage() {
  const params = useParams();
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Upgrade Job Post</h1>
      <p className="text-gray-700">Upgrade job post ID: <span className="font-mono">{params.id}</span> to featured or top of list.</p>
    </div>
  );
} 