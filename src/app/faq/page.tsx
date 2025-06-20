import { useState } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

'use client';

import {
  import {
  ChevronDown,
  ChevronUp,
  Users,
  Building,
  Headphones,
  Search,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'job-seekers' | 'employers' | 'technical';
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'job-seekers' | 'employers' | 'technical'
  >('all');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const faqData: FAQItem[] = [
    // Job Seekers
    {
      question: 'How do I create a profile on 209 Works?',
      answer:
        "Creating a profile is easy! Click 'Sign Up' in the top right corner, choose 'Job Seeker', and fill out your basic information. You can then enhance your profile with your resume, skills, work preferences, and make it visible to employers.",
      category: 'job-seekers',
    },
    {
      question: 'How does the AI job search work?',
      answer:
        "Our AI-powered search understands natural language queries. Instead of using complex filters, just type what you're looking for like 'warehouse jobs in Stockton' or 'part-time administrative work near me'. The AI will find relevant matches and suggest similar opportunities.",
      category: 'job-seekers',
    },
    {
      question: 'Can I apply to jobs without creating an account?',
      answer:
        "While you can browse jobs without an account, you'll need to create a free profile to apply. This helps employers learn about you and allows you to track your applications, save jobs, and receive personalized job alerts.",
      category: 'job-seekers',
    },
    {
      question: 'How do I upload my resume?',
      answer:
        "Go to your profile page and scroll to the 'Resume' section. You can upload PDF, DOC, or DOCX files up to 5MB. Your resume will be attached to job applications and visible to employers if you make your profile public.",
      category: 'job-seekers',
    },
    {
      question: "What's the difference between Free and Premium accounts?",
      answer:
        'Free accounts can apply to jobs and create basic profiles. Premium accounts ($19/month) get enhanced profiles visible to employers, priority application delivery, advanced search filters, resume reviews, and priority support.',
      category: 'job-seekers',
    },
    {
      question: 'How do I set up job alerts?',
      answer:
        "In your dashboard, click 'Job Alerts' and create custom alerts based on keywords, location, job type, and salary range. You'll receive email notifications when matching jobs are posted.",
      category: 'job-seekers',
    },
    {
      question: "Can employers see my profile if I don't want them to?",
      answer:
        'Your profile visibility is completely under your control. By default, profiles are private. You can choose to make your profile public to employers in your privacy settings. You can change this anytime.',
      category: 'job-seekers',
    },
    {
      question: 'How do I track my job applications?',
      answer:
        "Your dashboard includes an application tracker that shows all jobs you've applied to, application dates, and status updates from employers. Premium users get enhanced tracking with detailed analytics.",
      category: 'job-seekers',
    },

    // Employers
    {
      question: 'How much does it cost to post a job?',
      answer:
        'Job posting starts at $99 per job for 30 days. We also offer subscription plans: Starter ($199/month for 5 jobs), Professional ($399/month for 15 jobs), and Enterprise (custom pricing). All plans include candidate management tools.',
      category: 'employers',
    },
    {
      question: 'How long do job postings stay active?',
      answer:
        'Standard job postings are active for 30 days. You can renew, edit, or remove them anytime. Premium plans include automatic renewal options and extended posting periods.',
      category: 'employers',
    },
    {
      question: "Can I edit my job posting after it's published?",
      answer:
        "Yes! You can edit job details, requirements, salary, and other information anytime from your employer dashboard. Changes are reflected immediately and don't affect your posting duration.",
      category: 'employers',
    },
    {
      question: 'How do I manage applications and candidates?',
      answer:
        'Your employer dashboard includes a full applicant tracking system. You can review resumes, send messages, schedule interviews, leave notes, and track candidates through your hiring process.',
      category: 'employers',
    },
    {
      question: 'Do you offer bulk job posting?',
      answer:
        'Yes! Professional and Enterprise plans include bulk upload tools. You can upload multiple jobs via CSV or integrate with your existing HR systems. Contact our sales team for custom integration options.',
      category: 'employers',
    },
    {
      question: 'Can I search for candidates proactively?',
      answer:
        'Absolutely! Professional and Enterprise plans include access to our candidate database. You can search profiles, view resumes, and reach out to potential candidates directly.',
      category: 'employers',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, MasterCard, American Express), ACH bank transfers, and can set up invoicing for Enterprise customers. All payments are processed securely through Stripe.',
      category: 'employers',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        "We offer full refunds within 7 days of posting if you haven't received any applications. For subscription plans, you can cancel anytime and won't be charged for the next billing cycle.",
      category: 'employers',
    },

    // Technical
    {
      question: "Why can't I log into my account?",
      answer:
        "First, try resetting your password using the 'Forgot Password' link. If that doesn't work, check if you're using the correct email address. Clear your browser cache and cookies, or try a different browser. Contact support if issues persist.",
      category: 'technical',
    },
    {
      question: "My job search isn't returning results. What's wrong?",
      answer:
        "Try broadening your search terms or location radius. Check your filters - you might have settings that are too restrictive. Our AI search works best with natural language, so try phrases like 'marketing jobs near Modesto' instead of exact keywords.",
      category: 'technical',
    },
    {
      question: "I'm not receiving email notifications. How do I fix this?",
      answer:
        'Check your spam/junk folder first. Add notifications@209.works to your contacts. Verify your email address in your profile settings. Check your notification preferences to ensure alerts are enabled.',
      category: 'technical',
    },
    {
      question: 'The website is loading slowly. Is there an issue?',
      answer:
        'Slow loading can be caused by internet connection, browser cache, or high traffic. Try refreshing the page, clearing your browser cache, or using a different browser. We monitor site performance 24/7 and address issues quickly.',
      category: 'technical',
    },
    {
      question: 'Can I use 209 Works on my mobile phone?',
      answer:
        "Yes! Our website is fully responsive and works great on mobile devices. We're also developing a mobile app. For the best mobile experience, use the latest version of Chrome, Safari, or Firefox.",
      category: 'technical',
    },
    {
      question: 'How do I delete my account?',
      answer:
        "Go to your profile settings and scroll to the bottom for 'Delete Account'. This permanently removes all your data. Alternatively, you can contact support to delete your account. Note: this action cannot be undone.",
      category: 'technical',
    },
    {
      question: 'Is my personal information secure?',
      answer:
        "Yes! We use industry-standard encryption, secure servers, and never sell your personal information. We're GDPR compliant and follow strict data protection protocols. Read our Privacy Policy for complete details.",
      category: 'technical',
    },
    {
      question: 'Do you have an API for integrations?',
      answer:
        'Yes! We offer REST APIs for job posting, candidate management, and data export. API access is available for Professional and Enterprise plans. Contact our technical team for documentation and integration support.',
      category: 'technical',
    },
  ];

  const categories = [
    {
      id: 'all',
      label: 'All Questions',
      icon: HelpCircle,
      count: faqData.length,
    },
    {
      id: 'job-seekers',
      label: 'Job Seekers',
      icon: Users,
      count: faqData.filter(item => item.category === 'job-seekers').length,
    },
    {
      id: 'employers',
      label: 'Employers',
      icon: Building,
      count: faqData.filter(item => item.category === 'employers').length,
    },
    {
      id: 'technical',
      label: 'Technical',
      icon: Headphones,
      count: faqData.filter(item => item.category === 'technical').length,
    },
  ];

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchTerm === '' ||
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-[#9fdf9f]/80 md:text-2xl">
              Find answers to common questions about using 209 Works for your
              job search or hiring needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Categories */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-4 pl-12 pr-4 text-lg focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as any)}
                  className={`flex items-center rounded-xl px-6 py-3 font-medium transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-[#2d4a3e] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {category.label}
                  <span
                    className={`ml-2 rounded-full px-2 py-1 text-xs ${
                      activeCategory === category.id
                        ? 'bg-[#1d3a2e] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length === 0 ? (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No questions found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or category filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <h3 className="pr-4 text-lg font-semibold text-gray-900">
                      {item.question}
                    </h3>
                    {openItems.includes(index) ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {openItems.includes(index) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 px-6 pb-4">
                          <p className="pt-4 leading-relaxed text-gray-700">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] p-8 text-center text-white">
            <MessageCircle className="mx-auto mb-6 h-16 w-16 text-[#9fdf9f]" />
            <h2 className="mb-4 text-3xl font-bold">Still Have Questions?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-[#9fdf9f]/80">
              Can't find what you're looking for? Our support team is here to
              help you succeed in the Central Valley job market.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/contact"
                className="rounded-lg bg-[#ff6b35] px-8 py-3 font-medium text-white transition-colors hover:bg-[#e55a2b]"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@209.works"
                className="rounded-lg border border-[#9fdf9f] px-8 py-3 font-medium text-[#9fdf9f] transition-colors hover:bg-[#9fdf9f] hover:text-[#2d4a3e]"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Popular Help Topics
            </h2>
            <p className="text-lg text-gray-600">
              Quick links to common help topics
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="/profile"
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Users className="mb-4 h-8 w-8 text-[#2d4a3e]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Profile Setup
              </h3>
              <p className="text-sm text-gray-600">
                Learn how to create and optimize your job seeker profile.
              </p>
            </a>

            <a
              href="/jobs"
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Search className="mb-4 h-8 w-8 text-[#9fdf9f]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Job Search Tips
              </h3>
              <p className="text-sm text-gray-600">
                Get the most out of our AI-powered job search.
              </p>
            </a>

            <a
              href="/employers"
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Building className="mb-4 h-8 w-8 text-[#ff6b35]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Employer Guide
              </h3>
              <p className="text-sm text-gray-600">
                Everything you need to know about posting jobs and hiring.
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
