export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Job Alerts</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Set up personalized job alerts to get notified when new
            opportunities match your criteria.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-lg border bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Create Job Alert
          </h2>
          <p className="mb-6 text-gray-600">
            Sign in to create and manage your job alerts.
          </p>
          <div className="space-y-4">
            <a
              href="/sign-in"
              className="hover:bg-primary/90 block w-full rounded-md bg-primary px-6 py-3 text-center text-white transition-colors"
            >
              Sign In to Create Alerts
            </a>
            <a
              href="/sign-up"
              className="hover:bg-primary/5 block w-full rounded-md border border-primary px-6 py-3 text-center text-primary transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
