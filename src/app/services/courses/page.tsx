import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Development Courses - 209Jobs',
  description: 'Advance your career with expert-led courses on job search, resume writing, interview skills, and professional development.',
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
      description: 'Comprehensive job search strategy from networking to salary negotiation.',
      features: ['Job search strategy', 'Networking techniques', 'Salary negotiation', 'Interview preparation'],
      level: 'All Levels'
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
      description: 'Create compelling resumes that get past ATS systems and impress hiring managers.',
      features: ['ATS optimization', 'Industry-specific templates', 'Achievement writing', 'Cover letter basics'],
      level: 'Beginner to Intermediate'
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
      description: 'Master behavioral, technical, and executive-level interview techniques.',
      features: ['STAR method', 'Technical interviews', 'Behavioral questions', 'Salary discussion'],
      level: 'Intermediate to Advanced'
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
      description: 'Build a powerful professional brand that attracts recruiters and opportunities.',
      features: ['LinkedIn optimization', 'Personal branding', 'Content strategy', 'Networking online'],
      level: 'All Levels'
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
      description: 'Successfully navigate career changes with proven strategies and frameworks.',
      features: ['Skills assessment', 'Industry research', 'Transition planning', 'Risk management'],
      level: 'Intermediate'
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
      description: 'Develop essential soft skills that employers value most in today\'s workplace.',
      features: ['Communication skills', 'Leadership basics', 'Emotional intelligence', 'Team collaboration'],
      level: 'All Levels'
    }
  ];

  const categories = [
    { name: 'Job Search Strategy', count: 15, icon: '🎯' },
    { name: 'Resume & Cover Letters', count: 12, icon: '📄' },
    { name: 'Interview Skills', count: 18, icon: '🎤' },
    { name: 'Professional Branding', count: 8, icon: '💼' },
    { name: 'Career Development', count: 22, icon: '📈' },
    { name: 'Soft Skills', count: 14, icon: '🤝' }
  ];

  const benefits = [
    {
      icon: '🎓',
      title: 'Expert Instructors',
      description: 'Learn from industry professionals, hiring managers, and career coaches with proven track records.'
    },
    {
      icon: '📅',
      title: 'Flexible Learning',
      description: 'Self-paced courses that fit your schedule with lifetime access to all materials.'
    },
    {
      icon: '🏆',
      title: 'Certificates',
      description: 'Earn completion certificates to showcase your commitment to professional development.'
    },
    {
      icon: '👥',
      title: 'Community Access',
      description: 'Connect with fellow learners and get ongoing support from our career community.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">🎓</span>
            <h1 className="text-4xl font-bold text-gray-900">Career Development Courses</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advance your career with expert-led courses on job search strategies, resume writing, 
            interview skills, and professional development. Curated partnerships with top educators.
          </p>
        </div>

        {/* Special Offer Banner */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 mb-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Limited Time: 30% Off All Courses</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Invest in your career development with our carefully curated course collection. 
            All courses include lifetime access and completion certificates.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors">
              Browse All Courses
            </button>
            <span className="text-green-200 text-sm">✨ Over 15,000 students enrolled</span>
          </div>
        </div>

        {/* Course Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Course Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h3>
                <p className="text-gray-500 text-xs">{category.count} courses</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Courses */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{course.image}</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">{course.originalPrice}</div>
                      <div className="text-lg font-bold text-green-600">{course.price}</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">by {course.provider}</p>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">⭐</span>
                      <span>{course.rating}</span>
                      <span className="mx-2">•</span>
                      <span>{course.students.toLocaleString()} students</span>
                    </div>
                    <span>{course.duration}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">What you'll learn:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {course.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{course.level}</span>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Choose Our Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Path Suggestion */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold text-center mb-6">📚 Recommended Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Resume Writing</h3>
              <p className="text-purple-100 text-sm">Start with a strong foundation</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Job Search Strategy</h3>
              <p className="text-purple-100 text-sm">Learn effective search methods</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Interview Excellence</h3>
              <p className="text-purple-100 text-sm">Master the interview process</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Career Development</h3>
              <p className="text-purple-100 text-sm">Long-term growth strategies</p>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SA
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah Anderson</h4>
                  <p className="text-gray-500 text-sm">Marketing Manager</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "The resume writing course helped me land 3 interviews in two weeks after months of applying with no responses."
              </p>
              <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MJ
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Michael Johnson</h4>
                  <p className="text-gray-500 text-sm">Software Engineer</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "Interview Excellence course gave me the confidence to negotiate a 25% salary increase in my new role."
              </p>
              <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  LW
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Lisa Wang</h4>
                  <p className="text-gray-500 text-sm">Data Analyst</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "Career Transition Blueprint helped me successfully switch from finance to tech in just 6 months."
              </p>
              <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I get lifetime access?</h3>
              <p className="text-gray-600 text-sm mb-4">Yes, all course purchases include lifetime access to materials and any future updates.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Are certificates provided?</h3>
              <p className="text-gray-600 text-sm mb-4">You'll receive a completion certificate for each course that you can add to your LinkedIn profile.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I'm not satisfied?</h3>
              <p className="text-gray-600 text-sm mb-4">We offer a 30-day money-back guarantee if you're not completely satisfied with your course.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I get help if I'm stuck?</h3>
              <p className="text-gray-600 text-sm mb-4">All courses include access to our community forum and instructor support.</p>
            </div>
          </div>
        </div>

        {/* Related Services */}
        <div className="bg-gray-900 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Career Development</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/services/resume-review" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="text-lg font-semibold mb-2">Resume Review</h3>
              <p className="text-gray-300 text-sm">Get professional feedback on your resume from career experts.</p>
            </Link>
            
            <Link href="/services/interview-prep" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">🎤</div>
              <h3 className="text-lg font-semibold mb-2">Interview Prep</h3>
              <p className="text-gray-300 text-sm">One-on-one interview coaching sessions with industry professionals.</p>
            </Link>
            
            <Link href="/tools" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">🛠️</div>
              <h3 className="text-lg font-semibold mb-2">AI Tools</h3>
              <p className="text-gray-300 text-sm">Use our AI-powered tools to enhance your job search.</p>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Advance Your Career?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join over 15,000 professionals who have accelerated their careers with our expert-led courses. 
              Start learning today with our 30% discount.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors">
              Browse All Courses →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 