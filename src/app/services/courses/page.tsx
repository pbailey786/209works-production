import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Development Courses - 209Jobs',
  description:
    'Advance your career with expert-led courses on job search, resume writing, interview skills, and professional development.',
};

export default function CoursesPage() {
  const courses = [
    {
      title: 'Master the Job Search',
      provider: 'Career Academy Pro',
      rating: 4.8,
      students: 12547,
      duration: '6 weeks',
      price: '$199',
      originalPrice: '$299',
      image: '🎯',
      description:
        'Comprehensive job search strategy from networking to salary negotiation.',
      features: [
        'Job search strategy',
        'Networking techniques',
        'Salary negotiation',
        'Interview preparation',
      ],
      level: 'All Levels',
    },
    {
      title: 'Resume Writing Mastery',
      provider: 'Professional Writers Guild',
      rating: 4.9,
      students: 8934,
      duration: '3 weeks',
      price: '$149',
      originalPrice: '$199',
      image: '📄',
      description:
        'Create compelling resumes that get past ATS systems and impress hiring managers.',
      features: [
        'ATS optimization',
        'Industry-specific templates',
        'Achievement writing',
        'Cover letter basics',
      ],
      level: 'Beginner to Intermediate',
    },
    {
      title: 'Interview Excellence',
      provider: 'Executive Interview Institute',
      rating: 4.7,
      students: 6789,
      duration: '4 weeks',
      price: '$179',
      originalPrice: '$249',
      image: '🎤',
      description:
        'Master behavioral, technical, and executive-level interview techniques.',
      features: [
        'STAR method',
        'Technical interviews',
        'Behavioral questions',
        'Salary discussion',
      ],
      level: 'Intermediate to Advanced',
    },
    {
      title: 'LinkedIn & Professional Branding',
      provider: 'Digital Career Institute',
      rating: 4.6,
      students: 9521,
      duration: '2 weeks',
      price: '$99',
      originalPrice: '$149',
      image: '💼',
      description:
        'Build a powerful professional brand that attracts recruiters and opportunities.',
      features: [
        'LinkedIn optimization',
        'Personal branding',
        'Content strategy',
        'Networking online',
      ],
      level: 'All Levels',
    },
    {
      title: 'Career Transition Blueprint',
      provider: 'Transition Masters',
      rating: 4.8,
      students: 4567,
      duration: '8 weeks',
      price: '$249',
      originalPrice: '$349',
      image: '🔄',
      description:
        'Successfully navigate career changes with proven strategies and frameworks.',
      features: [
        'Skills assessment',
        'Industry research',
        'Transition planning',
        'Risk management',
      ],
      level: 'Intermediate',
    },
    {
      title: 'Soft Skills for Success',
      provider: 'Leadership Development Co.',
      rating: 4.5,
      students: 7832,
      duration: '5 weeks',
      price: '$129',
      originalPrice: '$179',
      image: '🤝',
      description:
        "Develop essential soft skills that employers value most in today's workplace.",
      features: [
        'Communication skills',
        'Leadership basics',
        'Emotional intelligence',
        'Team collaboration',
      ],
      level: 'All Levels',
    },
  ];

  const categories = [
    { name: 'Job Search Strategy', count: 15, icon: '🎯' },
    { name: 'Resume & Cover Letters', count: 12, icon: '📄' },
    { name: 'Interview Skills', count: 18, icon: '🎤' },
    { name: 'Professional Branding', count: 8, icon: '💼' },
    { name: 'Career Development', count: 22, icon: '📈' },
    { name: 'Soft Skills', count: 14, icon: '🤝' },
  ];

  const benefits = [
    {
      icon: '🎓',
      title: 'Expert Instructors',
      description:
        'Learn from industry professionals, hiring managers, and career coaches with proven track records.',
    },
    {
      icon: '📅',
      title: 'Flexible Learning',
      description:
        'Self-paced courses that fit your schedule with lifetime access to all materials.',
    },
    {
      icon: '🏆',
      title: 'Certificates',
      description:
        'Earn completion certificates to showcase your commitment to professional development.',
    },
    {
      icon: '👥',
      title: 'Community Access',
      description:
        'Connect with fellow learners and get ongoing support from our career community.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <span className="mr-4 text-6xl">🎓</span>
            <h1 className="text-4xl font-bold text-gray-900">
              Career Development Courses
            </h1>
          </div>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Advance your career with expert-led courses on job search
            strategies, resume writing, interview skills, and professional
            development. Curated partnerships with top educators.
          </p>
        </div>

        {/* Special Offer Banner */}
        <div className="mb-12 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">
            🎉 Limited Time: 30% Off All Courses
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-green-100">
            Invest in your career development with our carefully curated course
            collection. All courses include lifetime access and completion
            certificates.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="rounded-lg bg-white px-6 py-3 font-medium text-green-600 transition-colors hover:bg-gray-100">
              Browse All Courses
            </button>
            <span className="text-sm text-green-200">
              ✨ Over 15,000 students enrolled
            </span>
          </div>
        </div>

        {/* Course Categories */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Course Categories
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="cursor-pointer rounded-lg bg-white p-4 text-center transition-shadow hover:shadow-md"
              >
                <div className="mb-2 text-3xl">{category.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {category.count} courses
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Courses */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Featured Courses
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-4xl">{course.image}</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">
                        {course.originalPrice}
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {course.price}
                      </div>
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="mb-3 text-sm text-gray-500">
                    by {course.provider}
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    {course.description}
                  </p>

                  <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-1 text-yellow-400">⭐</span>
                      <span>{course.rating}</span>
                      <span className="mx-2">•</span>
                      <span>{course.students.toLocaleString()} students</span>
                    </div>
                    <span>{course.duration}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                      What you'll learn:
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {course.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {course.level}
                    </span>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-12 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Why Choose Our Courses
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 text-4xl">{benefit.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Path Suggestion */}
        <div className="mb-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
          <h2 className="mb-6 text-center text-2xl font-bold">
            📚 Recommended Learning Path
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="mb-2 font-semibold">Resume Writing</h3>
              <p className="text-sm text-purple-100">
                Start with a strong foundation
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="mb-2 font-semibold">Job Search Strategy</h3>
              <p className="text-sm text-purple-100">
                Learn effective search methods
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="mb-2 font-semibold">Interview Excellence</h3>
              <p className="text-sm text-purple-100">
                Master the interview process
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="mb-2 font-semibold">Career Development</h3>
              <p className="text-sm text-purple-100">
                Long-term growth strategies
              </p>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Success Stories
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                  SA
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Sarah Anderson
                  </h4>
                  <p className="text-sm text-gray-500">Marketing Manager</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-gray-700">
                "The resume writing course helped me land 3 interviews in two
                weeks after months of applying with no responses."
              </p>
              <div className="text-sm text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 font-bold text-white">
                  MJ
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Michael Johnson
                  </h4>
                  <p className="text-sm text-gray-500">Software Engineer</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-gray-700">
                "Interview Excellence course gave me the confidence to negotiate
                a 25% salary increase in my new role."
              </p>
              <div className="text-sm text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
                  LW
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Lisa Wang</h4>
                  <p className="text-sm text-gray-500">Data Analyst</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-gray-700">
                "Career Transition Blueprint helped me successfully switch from
                finance to tech in just 6 months."
              </p>
              <div className="text-sm text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Do I get lifetime access?
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Yes, all course purchases include lifetime access to materials
                and any future updates.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Are certificates provided?
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                You'll receive a completion certificate for each course that you
                can add to your LinkedIn profile.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                What if I'm not satisfied?
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                We offer a 30-day money-back guarantee if you're not completely
                satisfied with your course.
              </p>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Can I get help if I'm stuck?
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                All courses include access to our community forum and instructor
                support.
              </p>
            </div>
          </div>
        </div>

        {/* Related Services */}
        <div className="rounded-xl bg-gray-900 p-8 text-white">
          <h2 className="mb-6 text-center text-2xl font-bold">
            Complete Your Career Development
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link
              href="/services/resume-review"
              className="rounded-lg bg-gray-800 p-6 transition-colors hover:bg-gray-700"
            >
              <div className="mb-3 text-3xl">📄</div>
              <h3 className="mb-2 text-lg font-semibold">Resume Review</h3>
              <p className="text-sm text-gray-300">
                Get professional feedback on your resume from career experts.
              </p>
            </Link>

            <Link
              href="/services/interview-prep"
              className="rounded-lg bg-gray-800 p-6 transition-colors hover:bg-gray-700"
            >
              <div className="mb-3 text-3xl">🎤</div>
              <h3 className="mb-2 text-lg font-semibold">Interview Prep</h3>
              <p className="text-sm text-gray-300">
                One-on-one interview coaching sessions with industry
                professionals.
              </p>
            </Link>

            <Link
              href="/tools"
              className="rounded-lg bg-gray-800 p-6 transition-colors hover:bg-gray-700"
            >
              <div className="mb-3 text-3xl">🛠️</div>
              <h3 className="mb-2 text-lg font-semibold">AI Tools</h3>
              <p className="text-sm text-gray-300">
                Use our AI-powered tools to enhance your job search.
              </p>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Ready to Advance Your Career?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-gray-600">
              Join over 15,000 professionals who have accelerated their careers
              with our expert-led courses. Start learning today with our 30%
              discount.
            </p>
            <button className="rounded-lg bg-green-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-green-700">
              Browse All Courses →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
