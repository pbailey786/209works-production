import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import ProfileSetupClient from './ProfileSetupClient';

export default async function ProfileSetupPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/signin');
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/signin');
  }

  if (user.role !== 'jobseeker') {
    redirect('/dashboard');
  }

  // Check if user already has a job seeker profile
  const existingProfile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {existingProfile ? 'Update Your Profile' : 'Complete Your Job Seeker Profile'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {existingProfile 
              ? 'Update your preferences to get better job matches'
              : 'Help us find the perfect job opportunities for you'
            }
          </p>
        </div>

        <ProfileSetupClient 
          userId={user.id}
          initialProfile={existingProfile}
        />
      </div>
    </div>
  );
}
