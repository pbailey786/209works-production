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
  EyeOff
} from 'lucide-react';

export default function SignUpPage() {
  const [selectedUserType, setSelectedUserType] = useState<'jobseeker' | 'employer' | null>(null);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
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
      setError('Please select whether you\'re looking for work or hiring.');
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
          window.location.href = '/signin?message=Please sign in to complete your account setup';
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
      setError('Please select whether you\'re looking for work or hiring first.');
      return;
    }

    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await signIn('google', {
        callbackUrl: selectedUserType === 'employer' ? '/employers/dashboard' : '/dashboard',
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
      title: 'I\'m looking for work',
      subtitle: 'Find your next opportunity',
      icon: Search,
      benefits: [
        'Browse thousands of local jobs',
        'Get personalized job recommendations',
        'Apply with one click',
        'Track your applications'
      ],
      color: 'blue'
    },
    {
      id: 'employer' as const,
      title: 'I\'m hiring',
      subtitle: 'Find qualified candidates',
      icon: Building2,
      benefits: [
        'Post unlimited job listings',
        'Access to 10,000+ candidates',
        'AI-powered candidate matching',
        'Advanced hiring analytics'
      ],
      color: 'purple'
    }
  ];

  if (success) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-12 md:py-16 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to 209.works!</h1>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. Check your email to verify your account and get started.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9fdf9f]/10 via-white to-[#ff6b35]/10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              209 Works
            </Link>
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {!selectedUserType ? (
          // User Type Selection
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Join the Central Valley's
              <span className="text-[#2d4a3e]"> Premier Job Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with opportunities and talent across Modesto, Stockton, Fresno, and the entire Central Valley region.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {userTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedUserType(type.id)}
                    className={`p-8 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
                      type.color === 'blue'
                        ? 'border-[#2d4a3e]/20 hover:border-[#2d4a3e]/40 hover:bg-[#9fdf9f]/10'
                        : 'border-[#ff6b35]/20 hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/10'
                    }`}
                  >
                    <div className="flex items-start mb-6">
                      <div className={`p-3 rounded-lg ${
                        type.color === 'blue' ? 'bg-[#2d4a3e]/10' : 'bg-[#ff6b35]/10'
                      }`}>
                        <IconComponent className={`w-8 h-8 ${
                          type.color === 'blue' ? 'text-[#2d4a3e]' : 'text-[#ff6b35]'
                        }`} />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{type.title}</h3>
                        <p className="text-gray-600">{type.subtitle}</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-3">
                      {type.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className={`w-4 h-4 mr-3 ${
                            type.color === 'blue' ? 'text-[#9fdf9f]' : 'text-[#ff6b35]'
                          }`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <div className={`mt-6 inline-flex items-center text-sm font-medium ${
                      type.color === 'blue' ? 'text-[#2d4a3e]' : 'text-[#ff6b35]'
                    }`}>
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#9fdf9f]" />
                  Secure & Private
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-[#ff6b35]" />
                  500+ Local Employers
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-[#2d4a3e]" />
                  10,000+ Job Seekers
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Registration Form
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Back Button */}
              <button
                onClick={() => setSelectedUserType(null)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6"
              >
                ← Back to selection
              </button>

              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedUserType === 'jobseeker' ? 'bg-[#2d4a3e]/10' : 'bg-[#ff6b35]/10'
                }`}>
                  {selectedUserType === 'jobseeker' ? (
                    <Search className="w-8 h-8 text-[#2d4a3e]" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#ff6b35]" />
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  {selectedUserType === 'jobseeker' ? 'Find Your Next Job' : 'Start Hiring Today'}
                </h1>
                <p className="text-gray-600">
                  {selectedUserType === 'jobseeker' 
                    ? 'Create your account to access thousands of local opportunities'
                    : 'Join hundreds of employers finding great candidates'
                  }
                </p>
              </div>

              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-50 focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center mb-4"
              >
                {googleLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-2"></div>
                    Signing up with Google...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input 
                    id="email"
                    type="email" 
                    required 
                    placeholder="Enter your email" 
                    className="w-full border border-gray-300 p-3 sm:p-4 rounded-lg focus:ring-2 focus:ring-[#2d4a3e] focus:border-[#2d4a3e] transition-colors duration-200 text-base"
                    value={form.email} 
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create a password"
                      className="w-full border border-gray-300 p-3 sm:p-4 pr-12 rounded-lg focus:ring-2 focus:ring-[#2d4a3e] focus:border-[#2d4a3e] transition-colors duration-200 text-base"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600 mb-1">Password must contain:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center ${passwordValidation.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="mr-1">{passwordValidation.checks.length ? '✓' : '○'}</span>
                          At least 8 characters
                        </div>
                        <div className={`flex items-center ${passwordValidation.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="mr-1">{passwordValidation.checks.lowercase ? '✓' : '○'}</span>
                          One lowercase letter
                        </div>
                        <div className={`flex items-center ${passwordValidation.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="mr-1">{passwordValidation.checks.uppercase ? '✓' : '○'}</span>
                          One uppercase letter
                        </div>
                        <div className={`flex items-center ${passwordValidation.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="mr-1">{passwordValidation.checks.number ? '✓' : '○'}</span>
                          One number
                        </div>
                        <div className={`flex items-center ${passwordValidation.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className="mr-1">{passwordValidation.checks.special ? '✓' : '○'}</span>
                          One special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm your password"
                      className={`w-full border p-3 sm:p-4 pr-12 rounded-lg focus:ring-2 focus:ring-[#2d4a3e] transition-colors duration-200 text-base ${
                        form.confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2d4a3e]'
                      }`}
                      value={form.confirmPassword}
                      onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.confirmPassword && !passwordsMatch && (
                    <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button 
                  type="submit" 
                  className={`w-full text-white py-3 sm:py-4 rounded-lg font-semibold focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center ${
                    selectedUserType === 'jobseeker'
                      ? 'bg-[#2d4a3e] hover:bg-[#1d3a2e] focus:ring-[#2d4a3e]'
                      : 'bg-[#ff6b35] hover:bg-[#e55a2b] focus:ring-[#ff6b35]'
                  }`}
                  disabled={loading || googleLoading || !passwordValidation.isValid || !passwordsMatch}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 