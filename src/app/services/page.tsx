'use client';

import { motion } from 'framer-motion';
import { 
  Search, 
  Building, 
  MapPin, 
  Sparkles, 
  Users, 
  TrendingUp,
  Briefcase,
  Bell,
  BarChart3,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const services = [
  {
    category: 'For Job Seekers',
    icon: Users,
    color: 'from-[#2d4a3e] to-[#1d3a2e]',
    services: [
      {
        name: 'AI-Powered Job Search',
        description: 'Use our ChatGPT-style search to find jobs using natural language. Just describe what you want!',
        features: [
          'Conversational job search interface',
          'Natural language understanding',
          'Personalized job recommendations',
          'Local market insights'
        ],
        cta: 'Search Jobs Now',
        href: '/jobs',
        icon: Sparkles
      },
      {
        name: 'Job Alerts & Notifications',
        description: 'Get notified instantly when new jobs matching your criteria are posted in the Central Valley.',
        features: [
          'Real-time email notifications',
          'Custom search criteria',
          'Daily/weekly digest options',
          'Mobile push notifications'
        ],
        cta: 'Set Up Alerts',
        href: '/alerts',
        icon: Bell
      },
      {
        name: 'Local Market Intelligence',
        description: 'Access detailed information about Central Valley employers, salary ranges, and career opportunities.',
        features: [
          'Company profiles and insights',
          'Salary comparison tools',
          'Industry trend analysis',
          'Commute vs. local job guidance'
        ],
        cta: 'Explore Market Data',
        href: '/jobs',
        icon: BarChart3
      }
    ]
  },
  {
    category: 'For Employers',
    icon: Building,
    color: 'from-[#ff6b35] to-[#e55a2b]',
    services: [
      {
        name: 'Job Posting & Management',
        description: 'Post jobs and manage applications with our easy-to-use employer dashboard.',
        features: [
          'AI-enhanced job descriptions',
          'Applicant tracking system',
          'Bulk job posting options',
          'Performance analytics'
        ],
        cta: 'Post a Job',
        href: '/employers/create-job-post',
        icon: Briefcase
      },
      {
        name: 'Local Talent Pipeline',
        description: 'Connect with qualified Central Valley workers who understand the local market.',
        features: [
          'Local candidate database',
          'Skills-based matching',
          'Cultural fit assessment',
          'Retention insights'
        ],
        cta: 'Find Talent',
        href: '/employers/signup',
        icon: Target
      },
      {
        name: 'Hiring Analytics',
        description: 'Get insights into your hiring performance and local market trends.',
        features: [
          'Application tracking metrics',
          'Time-to-hire analysis',
          'Salary benchmarking',
          'Competitor insights'
        ],
        cta: 'View Analytics',
        href: '/employers/dashboard',
        icon: TrendingUp
      }
    ]
  },
  {
    category: 'For Local Businesses',
    icon: MapPin,
    color: 'from-[#9fdf9f] to-[#7bc97b]',
    services: [
      {
        name: 'Local Business Advertising',
        description: 'Promote your Central Valley business to local job seekers and community members.',
        features: [
          'Targeted local advertising',
          'Business profile listings',
          'Community event promotion',
          'Local SEO optimization'
        ],
        cta: 'Advertise Your Business',
        href: '/contact',
        icon: Building
      },
      {
        name: 'Community Partnerships',
        description: 'Partner with 209 Works to support local workforce development and economic growth.',
        features: [
          'Workforce development programs',
          'Community event sponsorship',
          'Local hiring initiatives',
          'Economic development support'
        ],
        cta: 'Partner With Us',
        href: '/contact',
        icon: Users
      }
    ]
  }
];

const benefits = [
  {
    icon: Sparkles,
    title: 'AI-Powered Technology',
    description: 'Our ChatGPT-style search understands natural language, making job hunting as easy as having a conversation.'
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Focus',
    description: 'Exclusively serving the Central Valley (209 area code) with deep local market knowledge and connections.'
  },
  {
    icon: TrendingUp,
    title: 'Real Results',
    description: 'Connecting thousands of Central Valley workers with local employers who understand the community.'
  },
  {
    icon: CheckCircle,
    title: 'Community First',
    description: 'Built by locals, for locals. We understand the unique needs of Central Valley workers and employers.'
  }
];

const stats = [
  { number: '50,000+', label: 'Active Job Listings' },
  { number: '25,000+', label: 'Registered Job Seekers' },
  { number: '1,200+', label: 'Local Employers' },
  { number: '95%', label: 'User Satisfaction' }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#9fdf9f] rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b35] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#9fdf9f] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white to-[#9fdf9f] bg-clip-text text-transparent">
              Our Services
            </h1>
            <p className="text-xl md:text-2xl text-[#9fdf9f]/80 max-w-3xl mx-auto leading-relaxed">
              Connecting Central Valley workers and employers through innovative
              AI-powered job matching and local business solutions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Sections */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {services.map((category, categoryIndex) => {
          const CategoryIcon = category.icon;
          return (
            <motion.section
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.2 }}
              className="mb-20"
            >
              {/* Category Header */}
              <div className="text-center mb-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${category.color} rounded-full mb-6`}>
                  <CategoryIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {category.category}
                </h2>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.services.map((service, serviceIndex) => {
                  const ServiceIcon = service.icon;
                  return (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: serviceIndex * 0.1 }}
                      className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl mb-6`}>
                        <ServiceIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {service.name}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {service.description}
                      </p>
                      
                      <ul className="space-y-2 mb-8">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Link href={service.href}>
                        <Button className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 transition-opacity`}>
                          {service.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose 209 Works?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another job board. We're the Central Valley's dedicated
              employment platform, built specifically for our local community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-full mx-auto mb-6">
                    <Icon className="w-8 h-8 text-[#9fdf9f]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-[#9fdf9f]/80 mb-8 leading-relaxed">
              Whether you're looking for your next opportunity or searching for talent,
              209 Works has the tools and local expertise to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs">
                <Button size="lg" className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-semibold px-8 py-4">
                  Find Jobs
                </Button>
              </Link>
              <Link href="/employers/signup">
                <Button size="lg" variant="outline" className="border-[#9fdf9f] text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e] font-semibold px-8 py-4">
                  Post Jobs
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-[#9fdf9f] text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e] font-semibold px-8 py-4">
                  Advertise Business
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 