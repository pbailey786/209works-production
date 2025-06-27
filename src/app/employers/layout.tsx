'use client';
import { ReactNode } from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

interface EmployerLayoutProps {
  children: ReactNode;
}

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  return (
    <RoleGuard allowedRoles={['employer', 'admin']} redirectTo="/sign-in">
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </RoleGuard>
  );
}