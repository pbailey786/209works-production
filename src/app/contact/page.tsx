import { useState } from '@/components/ui/card';
import { motion } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

'use client';

  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  Headphones,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'admin@209.works',
      response: '24-48 hours',
      color: 'blue',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our team',
      contact: 'Available on website',
      response: 'Instant during business hours',
      color: 'green',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak with our team',
      contact: '(209) 555-WORK',
      response: 'Mon-Fri 9AM-6PM PST',
      color: 'purple',
    },
  ];

  const supportCategories = [
    'General Inquiry',
    'Technical Support',
    'Account Issues',
    'Job Posting Help',
    'Billing Questions',
    'Feature Request',
    'Partnership Inquiry',
    'Media/Press',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
              Get in Touch
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-[#9fdf9f]/80 md:text-2xl">
              Have questions or need support? We're here to help you succeed in
              the Central Valley job market.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              How Can We Help?
            </h2>
            <p className="text-lg text-gray-600">
              Choose the best way to reach us
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div
                    className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full ${
                      method.color === 'blue'
                        ? 'bg-[#2d4a3e]/10 text-[#2d4a3e]'
                        : method.color === 'green'
                          ? 'bg-[#9fdf9f]/20 text-[#2d4a3e]'
                          : 'bg-[#ff6b35]/10 text-[#ff6b35]'
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {method.title}
                  </h3>
                  <p className="mb-4 text-gray-600">{method.description}</p>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {method.contact}
                    </p>
                    <p className="text-sm text-gray-500">{method.response}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Send Us a Message
            </h2>
            <p className="text-lg text-gray-600">
              We'll get back to you within 24 hours
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 flex items-center rounded-lg border border-green-200 bg-green-50 p-4"
              >
                <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                <p className="text-green-800">
                  Thank you! Your message has been sent successfully. We'll get
                  back to you soon.
                </p>
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 flex items-center rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle className="mr-3 h-5 w-5 text-red-600" />
                <p className="text-red-800">
                  Sorry, there was an error sending your message. Please try
                  again or contact us directly.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
                  >
                    <option value="">Select a category</option>
                    {supportCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
                    placeholder="Brief description of your inquiry"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#2d4a3e]"
                  placeholder="Please provide details about your inquiry..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>



      {/* FAQ Quick Links */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Quick Help
            </h2>
            <p className="text-lg text-gray-600">
              Find answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Users className="mb-4 h-8 w-8 text-[#2d4a3e]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                For Job Seekers
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Get help with your profile, applications, and job search.
              </p>
              <a
                href="/faq#job-seekers"
                className="text-sm font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
              >
                View FAQ →
              </a>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Building className="mb-4 h-8 w-8 text-[#9fdf9f]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                For Employers
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Learn about posting jobs, managing candidates, and billing.
              </p>
              <a
                href="/faq#employers"
                className="text-sm font-medium text-[#9fdf9f] hover:text-[#8fd08f]"
              >
                View FAQ →
              </a>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Headphones className="mb-4 h-8 w-8 text-[#ff6b35]" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Technical Support
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Troubleshoot technical issues and platform features.
              </p>
              <a
                href="/faq#technical"
                className="text-sm font-medium text-[#ff6b35] hover:text-[#e55a2b]"
              >
                View FAQ →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
