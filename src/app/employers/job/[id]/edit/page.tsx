import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import EditJobForm from './EditJobForm';

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
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication
  if (!user?.email) {
    redirect('/signin');
  }

  // Get user and verify they're an employer
  const dbUser = await prisma.user.findUnique({
    where: { email: user?.email },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== 'employer') {
    redirect('/employers/dashboard');
  }

  // Fetch the job and verify ownership
  const jobData = await prisma.job.findFirst({
    where: {
      id: id,
      employerId: dbUser.id,
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
    salaryMin: jobData.salaryMin ?? undefined, // Convert null to undefined
    salaryMax: jobData.salaryMax ?? undefined, // Convert null to undefined
    categories: jobData.categories,
    status: jobData.status,
    postedAt: jobData.postedAt.toISOString(),
  };

  return <EditJobForm job={job} />;
}

