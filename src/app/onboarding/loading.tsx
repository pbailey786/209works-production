export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Loading onboarding...
        </h2>
        <p className="text-gray-600">
          Setting up your personalized experience
        </p>
      </div>
    </div>
  );
}