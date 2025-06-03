'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  Briefcase,
  Heart,
  Target,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Building,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const stats = [
  { number: '50,000+', label: 'Jobs Posted', icon: Briefcase },
  { number: '25,000+', label: 'Job Seekers', icon: Users },
  { number: '1,200+', label: 'Employers', icon: Building },
  { number: '95%', label: 'Success Rate', icon: TrendingUp },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Search',
    description:
      'Our ChatGPT-style search understands natural language, making job hunting as easy as having a conversation.',
  },
  {
    icon: MapPin,
    title: 'Central Valley Focus',
    description:
      'Dedicated exclusively to the Central Valley region, ensuring relevant local opportunities.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description:
      'Jobs are updated in real-time, so you never miss out on the latest opportunities.',
  },
  {
    icon: Shield,
    title: 'Verified Employers',
    description:
      'All employers are verified to ensure legitimate job postings and protect job seekers.',
  },
  {
    icon: Clock,
    title: 'Quick Applications',
    description:
      'Apply to multiple jobs with one click using our streamlined application process.',
  },
  {
    icon: Heart,
    title: 'Community First',
    description:
      'Built by locals, for locals. We understand the unique needs of Central Valley workers.',
  },
];

const milestones = [
  {
    year: '2023',
    title: 'Founded',
    description:
      'Started with a simple mission: connect Central Valley workers with local opportunities.',
  },
  {
    year: '2024',
    title: 'AI Integration',
    description:
      'Launched our revolutionary ChatGPT-style job search, making job hunting conversational.',
  },
  {
    year: 'Late 2024',
    title: '50K+ Jobs',
    description:
      'Reached 50,000+ job postings across Stockton, Modesto, Tracy, Lodi, and Manteca.',
  },
  {
    year: '2025',
    title: 'Regional Leader',
    description:
      'Became the #1 job platform in the Central Valley with 95% user satisfaction.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white">
        {/* Background Pattern */}
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
              About 209 Works
            </h1>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-[#9fdf9f]/80 md:text-2xl">
              Connecting Central Valley workers with meaningful opportunities
              through innovative technology and genuine community care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e]">
                    <Icon className="h-8 w-8 text-[#9fdf9f]" />
                  </div>
                  <div className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                    {stat.number}
                  </div>
                  <div className="font-medium text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Our Mission
              </h2>
              <p className="mb-6 text-xl leading-relaxed text-gray-700">
                The Central Valley is the backbone of California's economy, home
                to hardworking families who deserve access to quality employment
                opportunities. We believe that finding a job shouldn't be a
                full-time job itself.
              </p>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                That's why we built 209.works - a platform that understands the
                unique needs of our community, from warehouse workers in
                Stockton to administrative professionals in Modesto, from retail
                associates in Tracy to skilled tradespeople in Manteca.
              </p>
              <div className="flex items-center gap-4">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-[#9fdf9f]" />
                <span className="text-gray-700">
                  Local jobs for local people
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-[#9fdf9f]" />
                <span className="text-gray-700">
                  Technology that actually helps
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-[#9fdf9f]" />
                <span className="text-gray-700">Community-first approach</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-2xl bg-gradient-to-br from-[#2d4a3e] to-[#1d3a2e] p-8 text-white">
                <Target className="mb-6 h-12 w-12 text-[#9fdf9f]" />
                <h3 className="mb-4 text-2xl font-bold">Our Vision</h3>
                <p className="leading-relaxed text-[#9fdf9f]/80">
                  To become the most trusted employment platform in the Central
                  Valley, where every job seeker finds meaningful work and every
                  employer finds the right talent to grow their business.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              What Makes Us Different
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              We're not just another job board. We're a technology company built
              specifically for the Central Valley, with features designed around
              how people actually search for jobs.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-gray-50 p-8 transition-shadow duration-300 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e]">
                    <Icon className="h-6 w-6 text-[#9fdf9f]" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              From a simple idea to the Central Valley's leading job platform
            </p>
          </motion.div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-center gap-8 ${index % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div
                    className={`rounded-2xl bg-white p-6 shadow-sm ${index % 2 === 1 ? 'text-right' : ''}`}
                  >
                    <div className="mb-2 text-2xl font-bold text-[#2d4a3e]">
                      {milestone.year}
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35]"></div>
                <div className="flex-1"></div>
              </motion.div>
            ))}
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
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-[#9fdf9f]/80">
              Join thousands of Central Valley workers who have found their
              dream jobs through 209 Works. Our AI-powered search makes it
              easier than ever to find the perfect role.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/jobs">
                <Button
                  size="lg"
                  className="bg-[#ff6b35] px-8 py-4 font-semibold text-white hover:bg-[#e55a2b]"
                >
                  Search Jobs Now
                </Button>
              </Link>
              <Link href="/employers/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#9fdf9f] px-8 py-4 font-semibold text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e]"
                >
                  Post a Job
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
