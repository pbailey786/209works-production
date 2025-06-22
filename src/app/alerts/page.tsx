export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Job Alerts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set up personalized job alerts to get notified when new opportunities match your criteria.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Job Alert</h2>
          <p className="text-gray-600 mb-6">
            Sign in to create and manage your job alerts.
          </p>
          <div className="space-y-4">
            <a href="/sign-in" className="block w-full bg-primary text-white text-center py-3 px-6 rounded-md hover:bg-primary/90 transition-colors">
              Sign In to Create Alerts
            </a>
            <a href="/sign-up" className="block w-full border border-primary text-primary text-center py-3 px-6 rounded-md hover:bg-primary/5 transition-colors">
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}