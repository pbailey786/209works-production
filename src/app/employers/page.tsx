import Link from "next/link";

export default function EmployerLandingPage() {
  const features = [
    {
      icon: "🎯",
      title: "Targeted Job Posting",
      description: "Post jobs that reach qualified candidates in the Central Valley",
      href: "/employers/create-job-post"
    },
    {
      icon: "🤖",
      title: "AI-Powered Tools",
      description: "Use AI to create better job descriptions and optimize posts",
      href: "/employers/bulk-upload"
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track application rates, views, and hiring performance",
      href: "/employers/dashboard"
    },
    {
      icon: "👥",
      title: "Applicant Management",
      description: "Organize and manage candidates with advanced filtering",
      href: "/employers/applicants"
    },
    {
      icon: "💰",
      title: "Cost-Effective Hiring",
      description: "Competitive pricing with flexible credit system",
      href: "/employers/pricing"
    },
    {
      icon: "⚡",
      title: "Quick Setup",
      description: "Get started in minutes with our streamlined process",
      href: "/employers/signup"
    }
  ];

  const testimonials = [
    {
      quote: "209 Works helped us find qualified local talent faster than any other platform.",
      author: "Sarah Chen",
      company: "Central Valley Tech"
    },
    {
      quote: "The AI-powered job posting tools saved us hours of manual work.",
      author: "Michael Rodriguez",
      company: "Valley Manufacturing"
    },
    {
      quote: "Best ROI for recruitment in the Central Valley region.",
      author: "Jennifer Martinez",
      company: "Modesto Healthcare Group"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#9fdf9f]/10 to-[#ff6b35]/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Top Talent in the
              <span className="text-[#2d4a3e]"> Central Valley</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with qualified job seekers in Modesto, Stockton, Fresno, and throughout
              California's Central Valley. Post jobs, screen candidates with AI, and hire faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/employers/post-job"
                className="bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
              >
                Post Your First Job
              </Link>
              <Link
                href="/employers/dashboard"
                className="border border-[#2d4a3e] text-[#2d4a3e] hover:bg-[#2d4a3e]/5 px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
              >
                Employer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Hire Successfully
            </h2>
            <p className="text-lg text-gray-600">
              Streamline your recruitment process with our comprehensive hiring platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href} className="group">
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#2d4a3e] hover:shadow-lg transition-all duration-200">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#2d4a3e]">
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
      <div className="py-16 bg-[#2d4a3e]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#2d4a3e] mb-2">10,000+</div>
              <div className="text-gray-600">Active Job Seekers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2d4a3e] mb-2">500+</div>
              <div className="text-gray-600">Employers Hiring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2d4a3e] mb-2">95%</div>
              <div className="text-gray-600">Job Fill Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2d4a3e] mb-2">24hrs</div>
              <div className="text-gray-600">Average Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Central Valley Employers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-gray-600 mb-4">"{testimonial.quote}"</div>
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-sm text-gray-500">{testimonial.company}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-[#2d4a3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Next Great Hire?
          </h2>
          <p className="text-xl text-[#9fdf9f]/80 mb-8">
            Join hundreds of employers already hiring on 209 Works
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employers/signup"
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Get Started Free
            </Link>
            <Link
              href="/employers/contact"
              className="border border-[#9fdf9f] text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e] px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="py-8 bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Link href="/employers/pricing" className="text-gray-600 hover:text-[#2d4a3e]">
              Pricing
            </Link>
            <Link href="/employers/faq" className="text-gray-600 hover:text-[#2d4a3e]">
              FAQ
            </Link>
            <Link href="/employers/bulk-upload" className="text-gray-600 hover:text-[#2d4a3e]">
              AI Tools
            </Link>
            <Link href="/employers/contact" className="text-gray-600 hover:text-[#2d4a3e]">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 