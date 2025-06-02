"use client";import { useParams } from "next/navigation";export default function ApplicantProfilePage() {
  const params = useParams();
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Applicant Profile</h1>
      <p className="text-gray-700">Profile details for applicant ID: <span className="font-mono">{params.id}</span></p>
    </div>
  );
} 