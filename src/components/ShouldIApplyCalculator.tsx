'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface ShouldIApplyCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  company: string;
  isAuthenticated: boolean;
  userId?: string;
}

interface CalculatorResult {
  recommendation: 'yes' | 'maybe' | 'no';
  confidence: number;
  explanation: string;
  skillMatch: {
    matching: string[];
    missing: string[];
    score: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  applicationTips?: string[];
  usageInfo?: {
    usageToday: number;
    dailyLimit: number;
    userTier: string;
    analysisType: string;
  };
  upgradeSuggestions?: {
    shouldSuggestUpgrade: boolean;
    reason: string;
    suggestedTier: string;
    benefits: string[];
  };
}

export default function ShouldIApplyCalculator({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  company,
  isAuthenticated,
  userId,
}: ShouldIApplyCalculatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [usageInfo, setUsageInfo] = useState<any>(null);

  const handleCalculate = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to use the Should I Apply calculator.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // First check if user profile is complete enough
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      const user = profileData.user;

      // Check if profile has minimum required information
      const hasBasicInfo = user.name && user.skills && user.skills.length > 0;
      if (!hasBasicInfo) {
        setProfileIncomplete(true);
        setIsLoading(false);
        return;
      }

      // Call the Should I Apply API
      const response = await fetch('/api/should-i-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle usage limit exceeded
        if (response.status === 429 && errorData.upgradeRequired) {
          setUsageLimitReached(true);
          setUsageInfo(errorData.usageInfo);
          setError(errorData.reason);
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to analyze job fit');
      }

      const calculatorResult = await response.json();
      setResult(calculatorResult);
      setUsageInfo(calculatorResult.usageInfo);
    } catch (err) {
      console.error('Calculator error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'yes':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'maybe':
        return <QuestionMarkCircleIcon className="h-8 w-8 text-yellow-500" />;
      case 'no':
        return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'yes':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'maybe':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'no':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'yes':
        return 'You should apply!';
      case 'maybe':
        return 'Consider applying';
      case 'no':
        return 'Not recommended';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Should I Apply?</h2>
                  <p className="text-sm text-gray-600">
                    AI analysis for {jobTitle} at {company}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close calculator"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result && !isLoading && !error && !profileIncomplete && !usageLimitReached && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <SparklesIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Get AI-Powered Job Fit Analysis
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Our AI will analyze your profile against this job&apos;s requirements and provide 
                    personalized recommendations on whether you should apply.
                  </p>
                </div>
                <button
                  onClick={handleCalculate}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Analyze Job Fit
                </button>
              </div>
            )}

            {/* Profile Incomplete State */}
            {profileIncomplete && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <UserIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Complete Your Profile First
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    To get accurate job fit analysis, please complete your profile with your skills, 
                    experience, and other relevant information.
                  </p>
                  <div className="space-y-3">
                    <a
                      href="/profile/settings"
                      className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      Complete Profile
                    </a>
                    <button
                      onClick={onClose}
                      className="block w-full text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Limit Reached State */}
            {usageLimitReached && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <ExclamationCircleIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Daily Limit Reached
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-4">
                    {error}
                  </p>
                  {usageInfo && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Today's usage:</span>
                          <span className="font-medium">{usageInfo.usageToday}/{usageInfo.dailyLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current plan:</span>
                          <span className="font-medium capitalize">{usageInfo.userTier}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <a
                      href="/pricing"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Upgrade for Unlimited Access
                    </a>
                    <button
                      onClick={onClose}
                      className="block w-full text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <SparklesIcon className="h-8 w-8 text-purple-600" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Analyzing Job Fit...
                  </h3>
                  <p className="text-gray-600">
                    Our AI is comparing your profile with the job requirements
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>This usually takes a few seconds</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Analysis Failed
                  </h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <div className="space-x-3">
                    <button
                      onClick={handleCalculate}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Overall Recommendation */}
                <div className={`p-6 rounded-xl border-2 ${getRecommendationColor(result.recommendation)}`}>
                  <div className="flex items-center space-x-4">
                    {getRecommendationIcon(result.recommendation)}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">
                        {getRecommendationText(result.recommendation)}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Confidence:</span>
                        <div className="flex-1 bg-white bg-opacity-50 rounded-full h-2 max-w-32">
                          <div
                            className="h-2 rounded-full bg-current"
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{result.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                    AI Analysis
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
                </div>

                {/* Skill Match */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Skill Match Analysis
                  </h4>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Match</span>
                      <span className="text-sm font-semibold text-gray-900">{result.skillMatch.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${result.skillMatch.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matching Skills */}
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                        <CheckCircleSolidIcon className="h-4 w-4 mr-1" />
                        Matching Skills ({result.skillMatch.matching.length})
                      </h5>
                      <div className="space-y-1">
                        {result.skillMatch.matching.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        Skills to Develop ({result.skillMatch.missing.length})
                      </h5>
                      <div className="space-y-1">
                        {result.skillMatch.missing.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Key Factors
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Positive Factors */}
                    {result.factors.positive.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
                        <ul className="space-y-1">
                          {result.factors.positive.map((factor, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Negative Factors */}
                    {result.factors.negative.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-2">Areas of Concern</h5>
                        <ul className="space-y-1">
                          {result.factors.negative.map((factor, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Neutral Factors */}
                    {result.factors.neutral.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Considerations</h5>
                        <ul className="space-y-1">
                          {result.factors.neutral.map((factor, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Premium Application Tips */}
                {result.applicationTips && result.applicationTips.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Premium Application Tips
                    </h4>
                    <ul className="space-y-2">
                      {result.applicationTips.map((tip, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <CheckCircleIcon className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Usage Info & Upgrade Suggestions */}
                {(usageInfo || result.upgradeSuggestions) && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {usageInfo && (
                          <div className="flex items-center space-x-4">
                            <span>
                              Usage today: <span className="font-medium">{usageInfo.usageToday}/{usageInfo.dailyLimit === -1 ? '∞' : usageInfo.dailyLimit}</span>
                            </span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full capitalize">
                              {usageInfo.userTier} {usageInfo.analysisType === 'premium' ? '• Premium Analysis' : '• Basic Analysis'}
                            </span>
                          </div>
                        )}
                      </div>
                      {result.upgradeSuggestions && (
                        <a
                          href="/pricing"
                          className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                        >
                          Upgrade for More
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Got it, thanks!
                  </button>
                  <button
                    onClick={() => {
                      // Save result functionality could be added here
                      onClose();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Save Result
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 