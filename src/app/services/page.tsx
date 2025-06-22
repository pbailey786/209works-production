export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Services</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Explore our career services and tools to help you succeed in your
            job search.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Resume Review
            </h2>
            <p className="mb-6 text-gray-600">
              Get professional feedback on your resume from our career experts.
            </p>
            <a
              href="/services/resume-review"
              className="hover:text-primary/80 font-medium text-primary"
            >
              Learn More →
            </a>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Career Courses
            </h2>
            <p className="mb-6 text-gray-600">
              Enhance your skills with our professional development courses.
            </p>
            <a
              href="/services/courses"
              className="hover:text-primary/80 font-medium text-primary"
            >
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
