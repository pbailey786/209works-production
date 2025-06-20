import { motion } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

'use client';

import {
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
  ArrowRight,
} from 'lucide-react';

const services = [
  {
    category: 'For Job Seekers',
    icon: Users,
    color: 'from-[#2d4a3e] to-[#1d3a2e]',
    services: [
      {
        name: 'AI-Powered Job Search',
        description:
          'Use our ChatGPT-style search to find jobs using natural language. Just describe what you want!',
        features: [
          'Conversational job search interface',
          'Natural language understanding',
          'Personalized job recommendations',
          'Local market insights',
        ],
        cta: 'Search Jobs Now',
        href: '/jobs',
        icon: Sparkles,
      },
      {
        name: 'Job Alerts & Notifications',
        description:
          'Get notified instantly when new jobs matching your criteria are posted in the Central Valley.',
        features: [
          'Real-time email notifications',
          'Custom search criteria',
          'Daily/weekly digest options',
          'Mobile push notifications',
        ],
        cta: 'Set Up Alerts',
        href: '/alerts',
        icon: Bell,
      },
      {
        name: 'Local Market Intelligence',
        description:
          'Access detailed information about Central Valley employers, salary ranges, and career opportunities.',
        features: [
          'Company profiles and insights',
          'Salary comparison tools',
          'Industry trend analysis',
          'Commute vs. local job guidance',
        ],
        cta: 'Explore Market Data',
        href: '/jobs',
        icon: BarChart3,
      },
    ],
  },
  {
    category: 'For Employers',
    icon: Building,
    color: 'from-[#ff6b35] to-[#e55a2b]',
    services: [
      {
        name: 'Job Posting & Management',
        description:
          'Post jobs and manage applications with our easy-to-use employer dashboard.',
        features: [
          'AI-enhanced job descriptions',
          'Applicant tracking system',
          'Bulk job posting options',
          'Performance analytics',
        ],
        cta: 'Post a Job',
        href: '/employers/create-job-post',
        icon: Briefcase,
      },
      {
        name: 'Local Talent Pipeline',
        description:
          'Connect with qualified Central Valley workers who understand the local market.',
        features: [
          'Local candidate database',
          'Skills-based matching',
          'Cultural fit assessment',
          'Retention insights',
        ],
        cta: 'Find Talent',
        href: '/employers/signup',
        icon: Target,
      },
      {
        name: 'Hiring Analytics',
        description:
          'Get insights into your hiring performance and local market trends.',
        features: [
          'Application tracking metrics',
          'Time-to-hire analysis',
          'Salary benchmarking',
          'Competitor insights',
        ],
        cta: 'View Analytics',
        href: '/employers/dashboard',
        icon: TrendingUp,
      },
    ],
  },
  {
    category: 'For Local Businesses',
    icon: MapPin,
    color: 'from-[#9fdf9f] to-[#7bc97b]',
    services: [
      {
        name: 'Local Business Advertising',
        description:
          'Promote your Central Valley business to local job seekers and community members.',
        features: [
          'Targeted local advertising',
          'Business profile listings',
          'Community event promotion',
          'Local SEO optimization',
        ],
        cta: 'Advertise Your Business',
        href: '/contact',
        icon: Building,
      },
      {
        name: 'Community Partnerships',
        description:
          'Partner with 209 Works to support local workforce development and economic growth.',
        features: [
          'Workforce development programs',
          'Community event sponsorship',
          'Local hiring initiatives',
          'Economic development support',
        ],
        cta: 'Partner With Us',
        href: '/contact',
        icon: Users,
      },
    ],
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: 'AI-Powered Technology',
    description:
      'Our ChatGPT-style search understands natural language, making job hunting as easy as having a conversation.',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Focus',
    description:
      'Exclusively serving the Central Valley (209 area code) with deep local market knowledge and connections.',
  },
  {
    icon: TrendingUp,
    title: 'Real Results',
    description:
      'Connecting thousands of Central Valley workers with local employers who understand the community.',
  },
  {
    icon: CheckCircle,
    title: 'Community First',
    description:
      'Built by locals, for locals. We understand the unique needs of Central Valley workers and employers.',
  },
];

const stats = [
  { number: '50,000+', label: 'Active Job Listings' },
  { number: '25,000+', label: 'Registered Job Seekers' },
  { number: '1,200+', label: 'Local Employers' },
  { number: '95%', label: 'User Satisfaction' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="animate-blob absolute left-0 top-0 h-96 w-96 rounded-full bg-[#9fdf9f] mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-2000 absolute right-0 top-0 h-96 w-96 rounded-full bg-[#ff6b35] mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-96 w-96 rounded-full bg-[#9fdf9f] mix-blend-multiply blur-xl filter"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-white to-[#9fdf9f] bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl">
              Our Services
            </h1>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-[#9fdf9f]/80 md:text-2xl">
              Connecting Central Valley workers and employers through innovative
              AI-powered job matching and local business solutions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                  {stat.number}
                </div>
                <div className="font-medium text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Sections */}
      <div className="mx-auto max-w-7xl px-4 py-16">
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
              <div className="mb-12 text-center">
                <div
                  className={`inline-flex h-16 w-16 items-center justify-center bg-gradient-to-r ${category.color} mb-6 rounded-full`}
                >
                  <CategoryIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-4 text-4xl font-bold text-gray-900">
                  {category.category}
                </h2>
              </div>

              {/* Services Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service, serviceIndex) => {
                  const ServiceIcon = service.icon;
                  return (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: serviceIndex * 0.1 }}
                      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-lg"
                    >
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center bg-gradient-to-r ${category.color} mb-6 rounded-xl`}
                      >
                        <ServiceIcon className="h-6 w-6 text-white" />
                      </div>

                      <h3 className="mb-4 text-xl font-bold text-gray-900">
                        {service.name}
                      </h3>

                      <p className="mb-6 leading-relaxed text-gray-600">
                        {service.description}
                      </p>

                      <ul className="mb-8 space-y-2">
                        {service.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center text-gray-700"
                          >
                            <CheckCircle className="mr-3 h-4 w-4 flex-shrink-0 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link href={service.href}>
                        <Button
                          className={`w-full bg-gradient-to-r ${category.color} transition-opacity hover:opacity-90`}
                        >
                          {service.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Why Choose 209 Works?
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              We're not just another job board. We're the Central Valley's
              dedicated employment platform, built specifically for our local
              community.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e]">
                    <Icon className="h-8 w-8 text-[#9fdf9f]" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="leading-relaxed text-gray-600">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-[#9fdf9f]/80">
              Whether you're looking for your next opportunity or searching for
              talent, 209 Works has the tools and local expertise to help you
              succeed.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/jobs">
                <Button
                  size="lg"
                  className="bg-[#ff6b35] px-8 py-4 font-semibold text-white hover:bg-[#e55a2b]"
                >
                  Find Jobs
                </Button>
              </Link>
              <Link href="/employers/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#9fdf9f] px-8 py-4 font-semibold text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e]"
                >
                  Post Jobs
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#9fdf9f] px-8 py-4 font-semibold text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e]"
                >
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
