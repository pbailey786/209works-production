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
  const jobData = await prisma.job.findFirst({
    where: {
      id: id,
      employerId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      company: true,
      location: true,
      jobType: true, // This maps to 'type' in the interface
      salaryMin: true,
      salaryMax: true,
      categories: true,
      status: true,
      postedAt: true,
    },
  });

  if (!jobData) {
    notFound();
  }

  // Transform the data to match the expected interface
  const job = {
    id: jobData.id,
    title: jobData.title,
    description: jobData.description,
    company: jobData.company,
    location: jobData.location,
    type: jobData.jobType, // Map jobType to type
    salaryMin: jobData.salaryMin,
    salaryMax: jobData.salaryMax,
    categories: jobData.categories,
    status: jobData.status,
    postedAt: jobData.postedAt.toISOString(),
  };

  return <EditJobForm job={job} />;
}

