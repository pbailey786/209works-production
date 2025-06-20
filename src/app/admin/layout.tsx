import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily redirect admin to homepage during redesign
  redirect('/');
}
