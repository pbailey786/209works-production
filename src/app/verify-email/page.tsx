import { useState, useEffect, Suspense } from '@/components/ui/card';
import { useSearchParams } from '@/components/ui/card';
import { motion } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

'use client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam === 'expired') {
      setError('Your verification link has expired. Please request a new one below.');
    } else if (errorParam === 'server') {
      setError('Something went wrong. Please try again.');
    }
  }, [searchParams]);

  async function handleResendVerification(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || 'Verification email sent successfully!');
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
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
              Verify Your Email
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[#9fdf9f]/80 md:text-xl">
              Check your inbox for a verification link, or request a new one below.
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
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Verification Email Sent!
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm text-blue-800 font-medium">
                        Check your email
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        The verification link will expire in 24 hours. Don't forget to check your spam folder!
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/signin">
                  <Button className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Resend Verification Email
                  </h2>
                  <p className="text-gray-600">
                    Enter your email address to receive a new verification link.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleResendVerification} className="space-y-6">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Why verify your email?
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Apply to jobs and contact employers</li>
                      <li>• Receive job alerts and notifications</li>
                      <li>• Access all 209 Works features</li>
                      <li>• Keep your account secure</li>
                    </ul>
                  </div>

                  <div className="text-sm text-gray-500">
                    Already verified?{' '}
                    <Link 
                      href="/signin" 
                      className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
                    >
                      Sign in here
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#2d4a3e] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
