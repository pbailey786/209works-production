"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

export default function EmployerSigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [signInSuccess, setSignInSuccess] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Debug session on signin page
  console.log('🔐 Signin - Session status:', status);
  console.log('🔐 Signin - Session data:', session);
  
  if (typeof window !== 'undefined') {
    console.log('🔐 Window location:', window.location.origin);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submitted with:", { email, password });
    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting sign-in with NextAuth for:", email);
      console.log("🔐 Calling signIn with provider: credentials");
      
      const result = await signIn("credentials", {
        email,
        password,
        totp: twoFactorCode,
        redirect: false,
      });

      console.log("🔐 NextAuth result:", result);
      console.log("🔐 Result.ok:", result?.ok);
      console.log("🔐 Result.error:", result?.error);
      console.log("🔐 Result.status:", result?.status);
      console.log("🔐 Result.url:", result?.url);

      if (result?.error) {
        console.log("❌ Sign-in error:", result.error);
        if (result.error === "2FA_REQUIRED") {
          setShowTwoFactor(true);
          setError("Please enter your 2FA code");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        console.log("✅ Sign-in successful! Attempting redirect...");
        setError("");
        setSignInSuccess(true);
        
        // Simple redirect after session is established
        setTimeout(() => {
          window.location.href = "/employers/dashboard";
        }, 1000);
      } else {
        console.log("❓ Unexpected result:", result);
        setError("Sign-in failed. Please try again.");
      }
    } catch (err) {
      console.error("💥 Sign-in error:", err);
      setError("An error occurred during sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider.toLowerCase(), { 
        callbackUrl: "/employers/dashboard" 
      });
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex min-h-screen">
        {/* Left Side - Sign In Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-3 rounded-full shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                Welcome to 209 Works
              </h1>
              <h2 className="text-xl font-semibold text-gray-900">
                Employer Sign In
              </h2>
              <p className="mt-2 text-gray-600">
                Access your hiring dashboard and connect with local talent in the 209
              </p>
            </div>

            {/* Success Message */}
            {signInSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm mb-3">✅ Sign-in successful! Redirecting to dashboard...</p>
                <button
                  onClick={() => window.location.href = "/employers/dashboard"}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Go to Dashboard Manually
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Sign In Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                {showTwoFactor && (
                  <div>
                    <label htmlFor="twoFactor" className="block text-sm font-medium text-gray-700 mb-1">
                      Two-Factor Authentication Code
                    </label>
                    <input
                      id="twoFactor"
                      name="twoFactor"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/password-reset-request"
                    className="text-sm text-blue-600 hover:text-green-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <ArrowRight className="h-5 w-5 text-white/80 group-hover:text-white" />
                  )}
                </span>
                {isLoading ? "Signing In..." : "Sign In to Dashboard"}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("LinkedIn")}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="#0077B5" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="ml-2">LinkedIn</span>
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/employers/signup"
                  className="font-medium bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-green-700"
                >
                  Sign up for free
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Join local businesses hiring in the 209 area
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Features & Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-600 to-green-600">
          <div className="max-w-md mx-auto text-white">
            <h3 className="text-2xl font-bold mb-2">
              Why Choose 209 Works?
            </h3>
            <p className="text-blue-100 text-sm mb-6">
              Built for the 209. Made for the people who work here.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-200 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">JobsGPT AI Matching</h4>
                  <p className="text-blue-100 text-sm">
                    Our AI chatbot connects you with qualified local candidates and promotes your jobs to the right people.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-200 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Hyper-Local Focus</h4>
                  <p className="text-blue-100 text-sm">
                    Target talent specifically in the 209 area code - Stockton, Modesto, Tracy, Manteca, and surrounding communities.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-200 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Social Media Promotion</h4>
                  <p className="text-blue-100 text-sm">
                    Boost your job visibility with Instagram and X promotion to reach local job seekers where they are.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-200 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Simple Pricing</h4>
                  <p className="text-blue-100 text-sm">
                    Transparent pricing starting at $50/month. No hidden fees, no complicated contracts.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-200 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Local Support</h4>
                  <p className="text-blue-100 text-sm">
                    Get help from a team that understands the 209 area and local business needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-blue-700 to-green-700 rounded-lg">
              <h4 className="font-semibold mb-2">Chamber Member Benefits</h4>
              <p className="text-blue-100 text-sm">
                Chamber of Commerce members get 25% off their first year plus priority support and exclusive features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 