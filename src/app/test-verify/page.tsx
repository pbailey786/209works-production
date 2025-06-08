'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, AlertCircle, Search } from 'lucide-react';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function TestVerifyPage() {
  const [email, setEmail] = useState('onethoughtstudio@gmail.com');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  async function handleVerifyUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/test/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        setUserInfo(data.user);
      } else {
        setError(data.error || 'Failed to verify user');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus() {
    setCheckLoading(true);
    setError('');
    setUserInfo(null);

    try {
      const res = await fetch(`/api/test/verify-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok) {
        setUserInfo(data.user);
        setMessage('');
      } else {
        setError(data.error || 'Failed to check user status');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg"
        >
          <div className="text-center mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#2d4a3e]/10">
              <CheckCircle className="h-6 w-6 text-[#2d4a3e]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Test Email Verification
            </h1>
            <p className="text-gray-600">
              Verify test accounts for development purposes
            </p>
          </div>

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

          {userInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4"
            >
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                👤 User Information
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Name:</strong> {userInfo.name || 'Not set'}</p>
                <p><strong>Email Verified:</strong> 
                  <span className={`ml-1 font-medium ${userInfo.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {userInfo.isEmailVerified ? '✅ Yes' : '❌ No'}
                  </span>
                </p>
                <p><strong>Created:</strong> {new Date(userInfo.createdAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <Input
              type="email"
              label="Test Account Email"
              placeholder="Enter test account email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            
            <div className="flex gap-3">
              <Button 
                onClick={handleCheckStatus}
                disabled={checkLoading}
                variant="outline"
                className="flex-1"
              >
                {checkLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#2d4a3e] border-t-transparent" />
                    Checking...
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>

              <Button 
                onClick={handleVerifyUser}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </div>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Verify Email
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              🧪 Development Tool
            </h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• Only works for test accounts</p>
              <p>• Sets isEmailVerified = true in database</p>
              <p>• User can then sign in normally</p>
              <p>• Remove this page in production!</p>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              <strong>Test Account:</strong> onethoughtstudio@gmail.com
            </p>
            <p className="text-xs text-gray-400">
              After verification, try signing in at <a href="/signin" className="text-[#2d4a3e] hover:underline">/signin</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
