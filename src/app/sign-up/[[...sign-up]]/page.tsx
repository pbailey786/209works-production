import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join 209 Works
          </h2>
          <p className="text-gray-600">
            Create your account and start finding local jobs in the Central Valley
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-[#ff6b35] hover:bg-[#e55a2b] text-white',
              card: 'shadow-lg',
              headerTitle: 'text-[#ff6b35]',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton:
                'border-gray-300 hover:bg-gray-50',
              formFieldInput:
                'border-gray-300 focus:border-[#ff6b35] focus:ring-[#ff6b35]',
              footerActionLink: 'text-[#2d4a3e] hover:text-[#1a3329]'
            }
          }}
          redirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
