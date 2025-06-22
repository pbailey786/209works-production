export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our career services and tools to help you succeed in your job search.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Resume Review</h2>
            <p className="text-gray-600 mb-6">
              Get professional feedback on your resume from our career experts.
            </p>
            <a href="/services/resume-review" className="text-primary hover:text-primary/80 font-medium">
              Learn More →
            </a>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Career Courses</h2>
            <p className="text-gray-600 mb-6">
              Enhance your skills with our professional development courses.
            </p>
            <a href="/services/courses" className="text-primary hover:text-primary/80 font-medium">
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}