'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

export default function VerifyUsersPage() {
  const [email, setEmail] = useState('onethoughtstudio@gmail.com');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleVerifyUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, adminKey }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ User ${email} has been verified successfully!`);
      } else {
        setError(data.error || 'Failed to verify user');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual User Verification</h1>
        <p className="mt-2 text-gray-600">
          Manually verify user email addresses for testing purposes
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4"
          >
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          </motion.div>
        )}

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

        <form onSubmit={handleVerifyUser} className="space-y-6">
          <Input
            type="email"
            label="User Email"
            placeholder="Enter user email to verify"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Admin Key"
            placeholder="Enter admin verification key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </div>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Verify User Email
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            🔧 For Testing Only
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Use admin key: <code className="bg-blue-100 px-1 rounded">admin123</code></p>
            <p>• This manually sets isEmailVerified = true</p>
            <p>• User can then sign in normally</p>
            <p>• Remove this page in production!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
