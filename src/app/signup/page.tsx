'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
  Star,
  Briefcase,
  Search,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SignUpPage() {
  const [selectedUserType, setSelectedUserType] = useState<
    'jobseeker' | 'employer' | null
  >(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation helper
  const getPasswordValidation = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };

    return {
      isValid: Object.values(checks).every(Boolean),
      checks,
    };
  };

  const passwordValidation = getPasswordValidation(form.password);
  const passwordsMatch = form.password === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserType) {
      setError("Please select whether you're looking for work or hiring.");
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: selectedUserType }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || data.message || 'Registration failed');
      } else {
        setSuccess(true);
        // Redirect to sign-in with a message to complete onboarding after login
        setTimeout(() => {
          window.location.href =
            '/signin?message=Please sign in to complete your account setup';
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    }
  }

  async function handleGoogleSignUp() {
    if (!selectedUserType) {
      setError(
        "Please select whether you're looking for work or hiring first."
      );
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        callbackUrl:
          selectedUserType === 'employer'
            ? '/employers/dashboard'
            : '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        setError('Google sign-up failed. Please try again.');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      console.error('Google sign-up error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }

  const userTypes = [
    {
      id: 'jobseeker' as const,
      title: "I'm looking for work",
      subtitle: 'Find your next opportunity',
      icon: Search,
      benefits: [
        'Browse thousands of local jobs',
        'Get personalized job recommendations',
        'Apply with one click',
        'Track your applications',
      ],
      color: 'blue',
    },
    {
      id: 'employer' as const,
      title: "I'm hiring",
      subtitle: 'Find qualified candidates',
      icon: Building2,
      benefits: [
        'Post unlimited job listings',
        'Access to 10,000+ candidates',
        'AI-powered candidate matching',
        'Advanced hiring analytics',
      ],
      color: 'purple',
    },
  ];

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 sm:py-12 md:py-16">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Welcome to 209.works!
          </h1>
          <p className="mb-6 text-gray-600">
            Your account has been created successfully. Check your email to
            verify your account and get started.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Sign In to Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9fdf9f]/10 via-white to-[#ff6b35]/10">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              209 Works
            </Link>
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {!selectedUserType ? (
          // User Type Selection
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Join the Central Valley's
              <span className="text-[#2d4a3e]"> Premier Job Platform</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Connect with opportunities and talent across Modesto, Stockton,
              Fresno, and the entire Central Valley region.
            </p>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              {userTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedUserType(type.id)}
                    className={`rounded-xl border-2 p-8 text-left transition-all duration-200 hover:shadow-lg ${
                      type.color === 'blue'
                        ? 'border-[#2d4a3e]/20 hover:border-[#2d4a3e]/40 hover:bg-[#9fdf9f]/10'
                        : 'border-[#ff6b35]/20 hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/10'
                    }`}
                  >
                    <div className="mb-6 flex items-start">
                      <div
                        className={`rounded-lg p-3 ${
                          type.color === 'blue'
                            ? 'bg-[#2d4a3e]/10'
                            : 'bg-[#ff6b35]/10'
                        }`}
                      >
                        <IconComponent
                          className={`h-8 w-8 ${
                            type.color === 'blue'
                              ? 'text-[#2d4a3e]'
                              : 'text-[#ff6b35]'
                          }`}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="mb-1 text-xl font-bold text-gray-900">
                          {type.title}
                        </h3>
                        <p className="text-gray-600">{type.subtitle}</p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {type.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm text-gray-700"
                        >
                          <CheckCircle
                            className={`mr-3 h-4 w-4 ${
                              type.color === 'blue'
                                ? 'text-[#9fdf9f]'
                                : 'text-[#ff6b35]'
                            }`}
                          />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`mt-6 inline-flex items-center text-sm font-medium ${
                        type.color === 'blue'
                          ? 'text-[#2d4a3e]'
                          : 'text-[#ff6b35]'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-[#9fdf9f]" />
                  Secure & Private
                </div>
                <div className="flex items-center">
                  <Star className="mr-2 h-4 w-4 text-[#ff6b35]" />
                  500+ Local Employers
                </div>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-[#2d4a3e]" />
                  10,000+ Job Seekers
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Registration Form
          <div className="mx-auto max-w-md">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {/* Back Button */}
              <button
                onClick={() => setSelectedUserType(null)}
                className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to selection
              </button>

              <div className="mb-6 text-center">
                <div
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                    selectedUserType === 'jobseeker'
                      ? 'bg-[#2d4a3e]/10'
                      : 'bg-[#ff6b35]/10'
                  }`}
                >
                  {selectedUserType === 'jobseeker' ? (
                    <Search className="h-8 w-8 text-[#2d4a3e]" />
                  ) : (
                    <Building2 className="h-8 w-8 text-[#ff6b35]" />
                  )}
                </div>
                <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
                  {selectedUserType === 'jobseeker'
                    ? 'Find Your Next Job'
                    : 'Start Hiring Today'}
                </h1>
                <p className="text-gray-600">
                  {selectedUserType === 'jobseeker'
                    ? 'Create your account to access thousands of local opportunities'
                    : 'Join hundreds of employers finding great candidates'}
                </p>
              </div>

              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="mb-4 flex min-h-[48px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
              >
                {googleLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-gray-700"></div>
                    Signing up with Google...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
                    Continue with Google
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
                    value={form.email}
                    onChange={e =>
                      setForm(f => ({ ...f, email: e.target.value }))
                    }
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
                      placeholder="Create a password"
                      className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-base transition-colors duration-200 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e] sm:p-4"
                      value={form.password}
                      onChange={e =>
                        setForm(f => ({ ...f, password: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <p className="mb-1 text-xs text-gray-600">
                        Password must contain:
                      </p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div
                          className={`flex items-center ${passwordValidation.checks.length ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span className="mr-1">
                            {passwordValidation.checks.length ? '✓' : '○'}
                          </span>
                          At least 8 characters
                        </div>
                        <div
                          className={`flex items-center ${passwordValidation.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span className="mr-1">
                            {passwordValidation.checks.lowercase ? '✓' : '○'}
                          </span>
                          One lowercase letter
                        </div>
                        <div
                          className={`flex items-center ${passwordValidation.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span className="mr-1">
                            {passwordValidation.checks.uppercase ? '✓' : '○'}
                          </span>
                          One uppercase letter
                        </div>
                        <div
                          className={`flex items-center ${passwordValidation.checks.number ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span className="mr-1">
                            {passwordValidation.checks.number ? '✓' : '○'}
                          </span>
                          One number
                        </div>
                        <div
                          className={`flex items-center ${passwordValidation.checks.special ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span className="mr-1">
                            {passwordValidation.checks.special ? '✓' : '○'}
                          </span>
                          One special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm your password"
                      className={`w-full rounded-lg border p-3 pr-12 text-base transition-colors duration-200 focus:ring-2 focus:ring-[#2d4a3e] sm:p-4 ${
                        form.confirmPassword && !passwordsMatch
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#2d4a3e]'
                      }`}
                      value={form.confirmPassword}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {form.confirmPassword && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-600">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`flex min-h-[48px] w-full items-center justify-center rounded-lg py-3 font-semibold text-white transition-colors duration-200 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 ${
                    selectedUserType === 'jobseeker'
                      ? 'bg-[#2d4a3e] hover:bg-[#1d3a2e] focus:ring-[#2d4a3e]'
                      : 'bg-[#ff6b35] hover:bg-[#e55a2b] focus:ring-[#ff6b35]'
                  }`}
                  disabled={
                    loading ||
                    googleLoading ||
                    !passwordValidation.isValid ||
                    !passwordsMatch
                  }
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
