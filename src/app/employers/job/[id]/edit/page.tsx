import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import EditJobForm from './EditJobForm';
import type { Session } from 'next-auth';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  categories: string[];
  status: string;
  postedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication
  if (!session?.user?.email) {
    redirect('/signin');
  }

  // Get user and verify they're an employer
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'employer') {
    redirect('/employers/dashboard');
  }

  // Fetch the job and verify ownership
  const job = await prisma.job.findFirst({
    where: {
      id: id,
      employerId: user.id,
    },
  });

  if (!job) {
    notFound();
  }

  return <EditJobForm job={job} />;

