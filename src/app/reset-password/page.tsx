'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Input from '../../components/Input';
import Button from '../../components/Button';

// Component that uses search params - needs to be wrapped in Suspense
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Password has been reset.');
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
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Reset Password</h1>
      <p className="text-gray-700">
        Enter your email to reset your password for 209jobs.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
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
