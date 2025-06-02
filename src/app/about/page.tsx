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
  Sparkles
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
    description: 'Our ChatGPT-style search understands natural language, making job hunting as easy as having a conversation.',
  },
  {
    icon: MapPin,
    title: 'Central Valley Focus',
    description: 'Dedicated exclusively to the Central Valley region, ensuring relevant local opportunities.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Jobs are updated in real-time, so you never miss out on the latest opportunities.',
  },
  {
    icon: Shield,
    title: 'Verified Employers',
    description: 'All employers are verified to ensure legitimate job postings and protect job seekers.',
  },
  {
    icon: Clock,
    title: 'Quick Applications',
    description: 'Apply to multiple jobs with one click using our streamlined application process.',
  },
  {
    icon: Heart,
    title: 'Community First',
    description: 'Built by locals, for locals. We understand the unique needs of Central Valley workers.',
  },
];

const milestones = [
  {
    year: '2023',
    title: 'Founded',
    description: 'Started with a simple mission: connect Central Valley workers with local opportunities.',
  },
  {
    year: '2024',
    title: 'AI Integration',
    description: 'Launched our revolutionary ChatGPT-style job search, making job hunting conversational.',
  },
  {
    year: 'Late 2024',
    title: '50K+ Jobs',
    description: 'Reached 50,000+ job postings across Stockton, Modesto, Tracy, Lodi, and Manteca.',
  },
  {
    year: '2025',
    title: 'Regional Leader',
    description: 'Became the #1 job platform in the Central Valley with 95% user satisfaction.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white overflow-hidden">
        {/* Background Pattern */}
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
              About 209 Works
            </h1>
            <p className="text-xl md:text-2xl text-[#9fdf9f]/80 max-w-3xl mx-auto leading-relaxed">
              Connecting Central Valley workers with meaningful opportunities through
              innovative technology and genuine community care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-full mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[#9fdf9f]" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                The Central Valley is the backbone of California's economy, home to hardworking 
                families who deserve access to quality employment opportunities. We believe that 
                finding a job shouldn't be a full-time job itself.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                That's why we built 209.works - a platform that understands the unique needs of 
                our community, from warehouse workers in Stockton to administrative professionals 
                in Modesto, from retail associates in Tracy to skilled tradespeople in Manteca.
              </p>
              <div className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-[#9fdf9f] flex-shrink-0" />
                <span className="text-gray-700">Local jobs for local people</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <CheckCircle className="w-6 h-6 text-[#9fdf9f] flex-shrink-0" />
                <span className="text-gray-700">Technology that actually helps</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <CheckCircle className="w-6 h-6 text-[#9fdf9f] flex-shrink-0" />
                <span className="text-gray-700">Community-first approach</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#2d4a3e] to-[#1d3a2e] rounded-2xl p-8 text-white">
                <Target className="w-12 h-12 mb-6 text-[#9fdf9f]" />
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-[#9fdf9f]/80 leading-relaxed">
                  To become the most trusted employment platform in the Central Valley,
                  where every job seeker finds meaningful work and every employer finds
                  the right talent to grow their business.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another job board. We're a technology company built specifically 
              for the Central Valley, with features designed around how people actually search for jobs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-xl mb-6">
                    <Icon className="w-6 h-6 text-[#9fdf9f]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
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
                  <div className={`bg-white rounded-2xl p-6 shadow-sm ${index % 2 === 1 ? 'text-right' : ''}`}>
                    <div className="text-2xl font-bold text-[#2d4a3e] mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">
                      {milestone.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-4 h-4 bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] rounded-full flex-shrink-0">
                </div>
                <div className="flex-1"></div>
              </motion.div>
            ))}
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
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="text-xl text-[#9fdf9f]/80 mb-8 leading-relaxed">
              Join thousands of Central Valley workers who have found their dream jobs through 209 Works.
              Our AI-powered search makes it easier than ever to find the perfect role.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs">
                <Button size="lg" className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-semibold px-8 py-4">
                  Search Jobs Now
                </Button>
              </Link>
              <Link href="/employers/signup">
                <Button size="lg" variant="outline" className="border-[#9fdf9f] text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e] font-semibold px-8 py-4">
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