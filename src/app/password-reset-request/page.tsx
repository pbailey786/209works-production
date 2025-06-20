import { useState } from '@/components/ui/card';
import { motion } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

'use client';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          data.message || 'If that email exists, a reset link has been sent.'
        );
      } else {
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#9fdf9f]/20">
              <Mail className="h-8 w-8 text-[#9fdf9f]" />
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Reset Your Password
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[#9fdf9f]/80 md:text-xl">
              Enter your email address and we'll send you a secure link to reset your password for your 209 Works account.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Sending Reset Link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`mt-6 rounded-lg p-4 ${
                  message.includes('sent') || message.includes('exists')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {message.includes('sent') || message.includes('exists') ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <p className={`text-sm ${
                    message.includes('sent') || message.includes('exists')
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {message}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/signin"
                className="inline-flex items-center text-sm text-[#2d4a3e] hover:text-[#1d3a2e] transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
