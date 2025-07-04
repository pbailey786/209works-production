import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default function AdminLayout() {
  // Temporarily redirect admin to homepage during redesign
  redirect('/');
}
