'use client';
import { useState } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';

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
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">Password Reset</h1>
      <p className="mb-8 text-gray-700">
        Enter your email address and we'll send you a link to reset your password for your 209 Works account.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      {message && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-blue-800">{message}</p>
        </div>
      )}
    </div>
  );
}
