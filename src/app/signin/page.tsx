'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ACCESSIBLE_ICONS } from '@/utils/accessibility';

// Component that uses search params - needs to be wrapped in Suspense
function SignInContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [showTotp, setShowTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now sign in.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        totp: showTotp ? totp : undefined,
      });

      if (res?.error === '2FA_REQUIRED') {
        setShowTotp(true);
        setError('Two-factor authentication required. Please enter your code.');
      } else if (res?.error) {
        // Provide more user-friendly error messages
        switch (res.error) {
          case 'Email not verified':
            setError(
              'Please verify your email address before signing in. Check your inbox for a verification link.'
            );
            break;
          case 'No user found':
            setError(
              'No account found with this email address. Please check your email or sign up.'
            );
            break;
          case 'Invalid password':
            setError('Incorrect password. Please try again.');
            break;
          default:
            setError(res.error);
        }
      } else if (res?.ok) {
        // Successful sign in
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12 md:py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold leading-tight sm:text-3xl">
          Sign In
        </h1>
        <p className="mb-6 text-center text-sm text-gray-700 sm:text-base">
          Sign in to your 209 Works account to access personalized features.
        </p>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="mb-4 flex min-h-[48px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
        >
          {googleLoading ? (
            <div className="flex items-center">
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-gray-700"></div>
              Signing in with Google...
            </div>
          ) : (
            <div className="flex items-center">
              <svg
                className="mr-3 h-5 w-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                role="img"
              >
                <title>Google logo</title>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 p-3 text-base transition-colors duration-200 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] sm:p-4"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-base transition-colors duration-200 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] sm:p-4"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Hide password</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <title>Show password</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {showTotp && (
            <div>
              <label
                htmlFor="totp"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                2FA Code
              </label>
              <input
                id="totp"
                type="text"
                required
                placeholder="Enter 2FA code"
                className="w-full rounded-lg border border-gray-300 p-3 text-base transition-colors duration-200 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] sm:p-4"
                value={totp}
                onChange={e => setTotp(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link
              href="/password-reset-request"
              className="text-sm font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#ff6b35] py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#e55a2b] focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
            disabled={loading || googleLoading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New to 209 Works?{' '}
            <Link
              href="/signup"
              className="font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
            >
              Join now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-8 sm:py-12 md:py-16">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#ff6b35]"></div>
            <p className="text-gray-600">Loading sign in form...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
