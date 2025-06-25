import { SignUp } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  // Check if user is already authenticated
  const user = await currentUser();
  
  if (user) {
    // User is already signed in, redirect to auth-redirect for proper routing
    redirect('/auth-redirect');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
        forceRedirectUrl="/auth-redirect"
        signInFallbackRedirectUrl="/auth-redirect"
        signInUrl="/sign-in"
      />
    </div>
  );
}