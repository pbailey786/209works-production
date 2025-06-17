import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function EmailSubscriptionCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // TODO: Replace with actual API endpoint for newsletter subscription
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock success response
      setStatus('success');
      setMessage("Welcome! You'll receive job alerts and updates via email.");
      setEmail('');

      // Track email subscription for analytics
      if (typeof window !== 'undefined' && window.trackEmailSubscription) {
        window.trackEmailSubscription();
      }

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <section className="w-full bg-gradient-to-r from-blue-600 to-purple-700 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Never Miss a Local Job Opportunity
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100 md:text-xl">
            Get personalized job alerts and weekly updates on the best
            opportunities in the 209 area delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-transparent px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="flex items-center">
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Get Job Alerts'
                )}
              </button>
            </div>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-md p-3 ${
                status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </motion.div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-6 text-sm text-blue-100 sm:flex-row">
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Weekly job roundups
            </div>
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5z"
                />
              </svg>
              Instant job alerts
            </div>
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              No spam, unsubscribe anytime
            </div>
          </div>

          <p className="mt-6 text-xs text-blue-200">
            Join 1,200+ local professionals already receiving our job updates.
            By subscribing, you agree to our privacy policy and terms of
            service.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
