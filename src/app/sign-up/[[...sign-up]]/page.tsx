import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Join 209 Works</h1>
          <p className="text-muted-foreground">Create your account and find local opportunities</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'shadow-none border-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }}
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Built for the 209. Made for the people who work here.
          </p>
        </div>
      </div>
    </div>
  );
}
