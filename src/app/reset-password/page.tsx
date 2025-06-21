'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// Component that uses search params - needs to be wrapped in Suspense
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || 'Password has been reset successfully.');
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/signin?message=Password reset successful. Please sign in with your new password.');
        }, 3000);
      } else {
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/password-reset-request">
            <Button>Request New Reset Link</Button>
          </Link>
        </div>
      </div>
    );
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
              <Lock className="h-8 w-8 text-[#9fdf9f]" />
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Create New Password
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[#9fdf9f]/80 md:text-xl">
              Enter a strong new password for your 209 Works account.
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h2>
                <p className="text-gray-600 mb-4">Your password has been updated successfully.</p>
                <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <PasswordInput
                  id="password"
                  label="New Password"
                  placeholder="Enter new password (min. 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {message && !success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{message}</p>
                </div>
              </motion.div>
            )}

            {!success && (
              <div className="mt-8 text-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center text-sm text-[#2d4a3e] hover:text-[#1d3a2e] transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Main export component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading reset form...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
