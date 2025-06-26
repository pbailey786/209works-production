'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpWrapper() {
  return (
    <SignUp
      appearance={{
        baseTheme: undefined,
        elements: {
          rootBox: 'mx-auto',
          card: 'bg-white shadow-lg',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
          formButtonPrimary: 'bg-[#ff6b35] hover:bg-[#e55a2b]',
          footerActionLink: 'text-[#2d4a3e] hover:text-[#1d3a2e]',
        },
        variables: {
          colorPrimary: '#ff6b35',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          borderRadius: '0.5rem',
        },
      }}
      fallbackRedirectUrl="/auth-redirect"
      signInUrl="/sign-in"
    />
  );
}