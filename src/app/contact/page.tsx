'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Here you would typically send the form data to your API
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Link href="/contact" className="font-medium text-primary">
                Contact
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
              Contact {domainConfig.displayName}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700 md:text-2xl">
              Have questions? We're here to help you succeed in the {domainConfig.region} job market.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {submitStatus === 'success' && (
              <div className="mb-8 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Thank you for your message! We'll get back to you within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-8 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      There was an error sending your message. Please try again or email us directly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-12 text-3xl font-bold text-gray-900">
              Other Ways to Reach Us
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Email</h3>
                <p className="text-gray-600">
                  <a href="mailto:hello@209.works" className="text-primary hover:underline">
                    hello@{domainConfig.areaCode}.works
                  </a>
                </p>
              </div>

              <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Location</h3>
                <p className="text-gray-600">
                  Serving the entire<br />
                  {domainConfig.region} region
                </p>
              </div>

              <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Response Time</h3>
                <p className="text-gray-600">
                  We typically respond<br />
                  within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
