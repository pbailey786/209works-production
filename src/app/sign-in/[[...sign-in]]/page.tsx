import { SignIn } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  // Check if user is already authenticated
  const user = await currentUser();
  
  if (user) {
    // User is already signed in, redirect to auth-redirect for proper routing
    redirect('/auth-redirect');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          baseTheme: undefined,
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white shadow-lg',
            headerTitle: 'text-2xl font-bold text-gray-900',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
            formButtonPrimary: 'bg-[#2d4a3e] hover:bg-[#1d3a2e]',
            footerActionLink: 'text-[#ff6b35] hover:text-[#e55a2b]',
          },
          variables: {
            colorPrimary: '#2d4a3e',
            colorText: '#1f2937',
            colorTextSecondary: '#6b7280',
            colorBackground: '#ffffff',
            colorInputBackground: '#ffffff',
            colorInputText: '#1f2937',
            borderRadius: '0.5rem',
          },
        }}
        forceRedirectUrl="/auth-redirect"
        signUpUrl="/sign-up"
      />
    </div>
  );
}