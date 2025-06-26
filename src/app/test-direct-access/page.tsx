import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function TestDirectAccess() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return <div>Not authenticated</div>;
  }

  // Just redirect directly to employer dashboard - bypass all onboarding logic
  redirect('/employers/dashboard');
}