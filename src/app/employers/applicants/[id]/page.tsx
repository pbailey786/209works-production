'use client';
import { useParams } from 'next/navigation';
export default function ApplicantProfilePage() {
  const params = useParams();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Applicant Profile</h1>
      <p className="text-gray-700">
        Profile details for applicant ID:{' '}
        <span className="font-mono">{params.id}</span>
      </p>
    </div>
  );
}
