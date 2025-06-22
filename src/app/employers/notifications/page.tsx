export default function EmployerNotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#2d4a3e]/10">
          <span className="text-4xl">🔔</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Notification Center</h1>
        <p className="mb-8 text-lg text-gray-600">
          Stay updated with job applications, candidate activities, and platform updates.
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">No notifications yet</h2>
            <p className="mt-2 text-gray-600">
              When you have active job postings, you'll receive notifications about applications,
              candidate activities, and important updates here.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/employers/create-job-post"
              className="inline-flex items-center justify-center rounded-lg bg-[#2d4a3e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1d3a2e]"
            >
              Post Your First Job
            </a>
            <a
              href="/employers/my-jobs"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              View My Jobs
            </a>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>💡 Tip: Enable email notifications in your settings to stay updated on the go.</p>
        </div>
      </div>
    </div>
  );
}
