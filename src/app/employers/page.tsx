import Link from 'next/link';

export default function EmployerLandingPage() {
  const features = [
    {
      icon: '🎯',
      title: 'Targeted Job Posting',
      description:
        'Post jobs that reach qualified candidates in the Central Valley',
      href: '/employers/create-job-post',
    },
    {
      icon: '🤖',
      title: 'AI-Powered Tools',
      description:
        'Use AI to create better job descriptions and optimize posts',
      href: '/employers/bulk-upload',
    },
    {
      icon: '📊',
      title: 'Dashboard Overview',
      description: 'Manage your jobs and track hiring progress',
      href: '/employers/dashboard',
    },
    {
      icon: '👥',
      title: 'Applicant Management',
      description: 'Organize and manage candidates with advanced filtering',
      href: '/employers/applicants',
    },
    {
      icon: '💰',
      title: 'Cost-Effective Hiring',
      description: 'Competitive pricing with flexible credit system',
      href: '/employers/pricing',
    },
    {
      icon: '⚡',
      title: 'Quick Setup',
      description: 'Get started in minutes with our streamlined process',
      href: '/employers/signup',
    },
  ];

  const testimonials = [
    {
      quote:
        '209 Works helped us find qualified local talent faster than any other platform.',
      author: 'Sarah Chen',
      company: 'Central Valley Tech',
    },
    {
      quote: 'The AI-powered job posting tools saved us hours of manual work.',
      author: 'Michael Rodriguez',
      company: 'Valley Manufacturing',
    },
    {
      quote: 'Best ROI for recruitment in the Central Valley region.',
      author: 'Jennifer Martinez',
      company: 'Modesto Healthcare Group',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#9fdf9f]/10 to-[#ff6b35]/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Find Top Talent in the
              <span className="text-[#2d4a3e]"> Central Valley</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Connect with qualified job seekers in Modesto, Stockton, Fresno,
              and throughout California's Central Valley. Post jobs, screen
              candidates with AI, and hire faster.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/employers/post-job"
                className="rounded-lg bg-[#2d4a3e] px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#1d3a2e]"
              >
                Post Your First Job
              </Link>
              <Link
                href="/employers/dashboard"
                className="rounded-lg border border-[#2d4a3e] px-8 py-3 text-lg font-semibold text-[#2d4a3e] transition-colors duration-200 hover:bg-[#2d4a3e]/5"
              >
                Employer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Everything You Need to Hire Successfully
            </h2>
            <p className="text-lg text-gray-600">
              Streamline your recruitment process with our comprehensive hiring
              platform
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href} className="group">
                <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-[#2d4a3e] hover:shadow-lg">
                  <div className="mb-4 text-3xl">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-[#2d4a3e]">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#2d4a3e]/5 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-3xl font-bold text-[#2d4a3e]">
                10,000+
              </div>
              <div className="text-gray-600">Active Job Seekers</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-[#2d4a3e]">500+</div>
              <div className="text-gray-600">Employers Hiring</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-[#2d4a3e]">95%</div>
              <div className="text-gray-600">Job Fill Rate</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-[#2d4a3e]">
                24hrs
              </div>
              <div className="text-gray-600">Average Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Trusted by Central Valley Employers
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-lg bg-gray-50 p-6">
                <div className="mb-4 text-gray-600">"{testimonial.quote}"</div>
                <div className="font-semibold text-gray-900">
                  {testimonial.author}
                </div>
                <div className="text-sm text-gray-500">
                  {testimonial.company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#2d4a3e] py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="mb-8 text-xl text-[#9fdf9f]/80">
            Join hundreds of employers already hiring on 209 Works
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/employers/signup"
              className="rounded-lg bg-[#ff6b35] px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#e55a2b]"
            >
              Get Started Free
            </Link>
            <Link
              href="/employers/contact"
              className="rounded-lg border border-[#9fdf9f] px-8 py-3 text-lg font-semibold text-[#9fdf9f] transition-colors duration-200 hover:bg-[#9fdf9f] hover:text-[#2d4a3e]"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="border-t border-gray-200 bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <Link
              href="/employers/pricing"
              className="text-gray-600 hover:text-[#2d4a3e]"
            >
              Pricing
            </Link>
            <Link
              href="/employers/faq"
              className="text-gray-600 hover:text-[#2d4a3e]"
            >
              FAQ
            </Link>
            <Link
              href="/employers/bulk-upload"
              className="text-gray-600 hover:text-[#2d4a3e]"
            >
              AI Tools
            </Link>
            <Link
              href="/employers/contact"
              className="text-gray-600 hover:text-[#2d4a3e]"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
