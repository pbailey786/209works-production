'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
  });

  const [openItems, setOpenItems] = useState<number[]>([]);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley',
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno',
      });
    }
  }, []);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const jobSeekerFAQs: FAQItem[] = [
    {
      question: "How is this different from other job sites?",
      answer: `${domainConfig.displayName} focuses exclusively on local jobs in the ${domainConfig.region}. We don't list remote positions or jobs outside our area code. Every opportunity is within commuting distance, and our AI-powered JobsGPT helps you find the perfect local match.`
    },
    {
      question: "What is JobsGPT?",
      answer: "JobsGPT is our AI-powered job search assistant that works like ChatGPT but specifically for finding local jobs. Instead of browsing through hundreds of listings, you can have a conversation about what you're looking for and get personalized recommendations."
    },
    {
      question: "Is the service free for job seekers?",
      answer: "Yes! Creating an account, searching for jobs, applying to positions, and using JobsGPT is completely free for job seekers. We make money by helping local employers find great candidates like you."
    },
    {
      question: "How do I apply for jobs?",
      answer: "You can apply directly through our platform or be redirected to the employer's website, depending on their preference. We also offer tools to help you optimize your applications and track your progress."
    },
    {
      question: "Can I save jobs to apply later?",
      answer: "Absolutely! You can save jobs to your profile and apply when you're ready. We'll also send you alerts if similar positions become available."
    },
    {
      question: "Do you have part-time and entry-level positions?",
      answer: "Yes! We have opportunities for all experience levels, from entry-level positions to executive roles, and everything from part-time to full-time positions."
    }
  ];

  const employerFAQs: FAQItem[] = [
    {
      question: "How much does it cost to post a job?",
      answer: "Our pricing starts at $50 for a basic job posting. We also offer enhanced packages with social media promotion, featured placement, and AI optimization. Check our pricing page for current rates and packages."
    },
    {
      question: "How long do job postings stay active?",
      answer: "Standard job postings are active for 30 days. You can renew or extend postings as needed, and we'll notify you before they expire."
    },
    {
      question: "What makes your platform better for local hiring?",
      answer: `We only serve the ${domainConfig.region}, so every candidate who sees your job actually lives in your area. No more sifting through applications from people across the country who didn't read the location requirements.`
    },
    {
      question: "Can you help optimize my job posting?",
      answer: "Yes! Our AI can help rewrite job descriptions to be more appealing and effective. We can also provide social media graphics and promotional content to help your posting get more visibility."
    },
    {
      question: "Do you offer bulk posting for multiple positions?",
      answer: "Absolutely! We have tools for bulk job uploads and management, perfect for companies hiring for multiple positions. Contact us for volume pricing."
    },
    {
      question: "How do I track applications and candidates?",
      answer: "Our employer dashboard provides complete applicant tracking, including application status, candidate communications, and hiring analytics to help you make better decisions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {domainConfig.areaCode}
                </span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {domainConfig.displayName}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Local jobs in the {domainConfig.region}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-700 hover:text-primary">
                Jobs
              </Link>
              <Link
                href="/employers"
                className="text-gray-700 hover:text-primary"
              >
                Employers
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary">
                About
              </Link>
              <Link href="/faq" className="font-medium text-primary">
                FAQ
              </Link>
              <Link
                href="/sign-in"
                className="text-gray-700 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="from-primary/5 to-primary/10 bg-gradient-to-br py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700 md:text-2xl">
              Everything you need to know about {domainConfig.displayName}
            </p>
          </div>
        </div>
      </section>

      {/* Job Seekers FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              For Job Seekers
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about finding jobs in the {domainConfig.region}
            </p>
          </div>

          <div className="space-y-4">
            {jobSeekerFAQs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white">
                <button
                  className="flex w-full items-center justify-between p-6 text-left"
                  onClick={() => toggleItem(index)}
                >
                  <span className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      openItems.includes(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openItems.includes(index) && (
                  <div className="border-t border-gray-200 px-6 pb-6">
                    <p className="pt-4 text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employers FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              For Employers
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about hiring locally
            </p>
          </div>

          <div className="space-y-4">
            {employerFAQs.map((faq, index) => {
              const employerIndex = index + jobSeekerFAQs.length;
              return (
                <div key={employerIndex} className="rounded-lg border border-gray-200 bg-white">
                  <button
                    className="flex w-full items-center justify-between p-6 text-left"
                    onClick={() => toggleItem(employerIndex)}
                  >
                    <span className="text-lg font-medium text-gray-900">
                      {faq.question}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        openItems.includes(employerIndex) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openItems.includes(employerIndex) && (
                    <div className="border-t border-gray-200 px-6 pb-6">
                      <p className="pt-4 text-gray-700">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Still Have Questions?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
              We're here to help! Reach out to us and we'll get back to you quickly.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-md bg-white px-8 py-4 text-lg text-primary transition-colors hover:bg-gray-100"
              >
                Contact Us
              </Link>
              <Link
                href="/chat"
                className="rounded-md border border-white px-8 py-4 text-lg text-white transition-colors hover:bg-white/10"
              >
                Try JobsGPT
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
