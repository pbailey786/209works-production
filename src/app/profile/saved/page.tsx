import { redirect } from 'next/navigation';

export default async function SavedJobsPage() {
  // Redirect to the new applications page with saved tab
  redirect('/profile/applications?tab=saved');
}
