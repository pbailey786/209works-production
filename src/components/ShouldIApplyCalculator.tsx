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
  success: boolean;
  recommendation: 'strong' | 'good' | 'fair' | 'poor';
  shouldApply: boolean;
  message: string;
  score: number;
  maxScore: number;
  reasons: string[];
  analysis: {
    matchPercentage: number;
    strengthAreas: string[];
    tips: string[];
    skillGaps?: string[];
  };
  // Enhanced AI analysis fields
  aiAnalysis?: {
    matchScore: number;
    summary: string;
    strengths: string[];
    skillGaps: string[];
    advice: string[];
    localInsights?: string[];
  };
  // Legacy fields for backward compatibility
  confidence?: number;
  explanation?: string;
  skillMatch?: {
    matching: string[];
    missing: string[];
    score: number;
  };
  factors?: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  applicationTips?: string[];
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
      // Call the Should I Apply API directly
      const response = await fetch('/api/should-i-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle profile required error
        if (response.status === 400 && errorData.redirectTo) {
          setProfileIncomplete(true);
          setError(errorData.message);
          setIsLoading(false);
          return;
        }

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
    } catch (err) {
      console.error('Calculator error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'strong':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'good':
        return <CheckCircleIcon className="h-8 w-8 text-blue-500" />;
      case 'fair':
        return <QuestionMarkCircleIcon className="h-8 w-8 text-yellow-500" />;
      case 'poor':
        return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'fair':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong':
        return 'Strong Match - Apply Now!';
      case 'good':
        return 'Good Match - Consider Applying';
      case 'fair':
        return 'Fair Match - Worth Considering';
      case 'poor':
        return 'Poor Match - Not Recommended';
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
          className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 rounded-t-xl border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Should I Apply?
                  </h2>
                  <p className="text-sm text-gray-600">
                    AI analysis for {jobTitle} at {company}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Close calculator"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result &&
              !isLoading &&
              !error &&
              !profileIncomplete &&
              !usageLimitReached && (
                <div className="py-8 text-center">
                  <div className="mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                      <SparklesIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      Get AI-Powered Job Fit Analysis
                    </h3>
                    <p className="mx-auto max-w-md text-gray-600">
                      Our AI will analyze your profile against this job&apos;s
                      requirements and provide personalized recommendations on
                      whether you should apply.
                    </p>
                  </div>
                  <button
                    onClick={handleCalculate}
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <SparklesIcon className="mr-3 h-6 w-6" />
                    Get AI Analysis
                    <span className="ml-2 rounded-full bg-white bg-opacity-20 px-2 py-1 text-xs font-bold">
                      NEW
                    </span>
                  </button>
                </div>
              )}

            {/* Profile Incomplete State */}
            {profileIncomplete && (
              <div className="py-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                    <UserIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Complete Your Profile First
                  </h3>
                  <p className="mx-auto mb-6 max-w-md text-gray-600">
                    To get accurate job fit analysis, please complete your
                    profile with your skills, experience, and other relevant
                    information.
                  </p>
                  <div className="space-y-3">
                    <a
                      href="/onboarding/jobseeker"
                      className="inline-flex items-center rounded-lg bg-[#2d4a3e] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1d3a2e]"
                    >
                      <UserIcon className="mr-2 h-5 w-5" />
                      Complete Profile
                    </a>
                    <button
                      onClick={onClose}
                      className="block w-full text-gray-600 transition-colors hover:text-gray-800"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Limit Reached State */}
            {usageLimitReached && (
              <div className="py-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <ExclamationCircleIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Daily Limit Reached
                  </h3>
                  <p className="mx-auto mb-4 max-w-md text-gray-600">{error}</p>
                  {usageInfo && (
                    <div className="mx-auto mb-6 max-w-sm rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Today's usage:</span>
                          <span className="font-medium">
                            {usageInfo.usageToday}/{usageInfo.dailyLimit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current plan:</span>
                          <span className="font-medium capitalize">
                            {usageInfo.userTier}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <a
                      href="/pricing"
                      className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700"
                    >
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Upgrade for Unlimited Access
                    </a>
                    <button
                      onClick={onClose}
                      className="block w-full text-gray-600 transition-colors hover:text-gray-800"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="py-12 text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <SparklesIcon className="h-8 w-8 text-purple-600" />
                    </motion.div>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
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
              <div className="py-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Analysis Failed
                  </h3>
                  <p className="mb-6 text-gray-600">{error}</p>
                  <div className="space-x-3">
                    <button
                      onClick={handleCalculate}
                      className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
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
                <div
                  className={`rounded-xl border-2 p-6 ${getRecommendationColor(result.recommendation)}`}
                >
                  <div className="flex items-center space-x-4">
                    {getRecommendationIcon(result.recommendation)}
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-semibold">
                        {getRecommendationText(result.recommendation)}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Match Score:</span>
                        <div className="h-2 max-w-32 flex-1 rounded-full bg-white bg-opacity-50">
                          <div
                            className="h-2 rounded-full bg-current"
                            style={{ width: `${result.aiAnalysis?.matchScore || result.analysis.matchPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {result.aiAnalysis?.matchScore || result.analysis.matchPercentage}%
                          {!result.aiAnalysis && ` (${result.score}/${result.maxScore})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced AI Analysis */}
                <div className="rounded-xl bg-gray-50 p-6">
                  <h4 className="mb-3 flex items-center font-semibold text-gray-900">
                    <SparklesIcon className="mr-2 h-5 w-5 text-purple-600" />
                    AI Match Analysis
                  </h4>
                  <p className="leading-relaxed text-gray-700 mb-4">
                    {result.aiAnalysis?.summary || result.message}
                  </p>

                  {/* Strengths */}
                  {(result.aiAnalysis?.strengths || result.reasons).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Your Strengths:</h5>
                      <ul className="space-y-1">
                        {(result.aiAnalysis?.strengths || result.reasons).map((strength, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {result.aiAnalysis?.skillGaps && result.aiAnalysis.skillGaps.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Areas for Growth:</h5>
                      <ul className="space-y-1">
                        {result.aiAnalysis.skillGaps.map((gap, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                            <ExclamationCircleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Local Insights */}
                  {result.aiAnalysis?.localInsights && result.aiAnalysis.localInsights.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">209 Area Insights:</h5>
                      <ul className="space-y-1">
                        {result.aiAnalysis.localInsights.map((insight, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                            <SparklesIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Enhanced Application Tips */}
                {(result.aiAnalysis?.advice || result.analysis.tips).length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h4 className="mb-4 flex items-center font-semibold text-gray-900">
                      <AcademicCapIcon className="mr-2 h-5 w-5 text-blue-600" />
                      Personalized Application Advice
                    </h4>
                    <ul className="space-y-2">
                      {(result.aiAnalysis?.advice || result.analysis.tips).map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                          <SparklesIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Legacy Skill Match - for backward compatibility */}
                {result.skillMatch && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h4 className="mb-4 flex items-center font-semibold text-gray-900">
                      <AcademicCapIcon className="mr-2 h-5 w-5 text-blue-600" />
                      Skill Match Analysis
                    </h4>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Overall Match
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {result.skillMatch.score}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${result.skillMatch.score}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Matching Skills */}
                      <div>
                        <h5 className="mb-2 flex items-center text-sm font-medium text-green-700">
                          <CheckCircleSolidIcon className="mr-1 h-4 w-4" />
                          Matching Skills ({result.skillMatch.matching.length})
                        </h5>
                        <div className="space-y-1">
                          {result.skillMatch.matching.map((skill, index) => (
                            <span
                              key={index}
                              className="mb-1 mr-1 inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Skills */}
                      <div>
                        <h5 className="mb-2 flex items-center text-sm font-medium text-red-700">
                          <ExclamationCircleIcon className="mr-1 h-4 w-4" />
                          Skills to Develop ({result.skillMatch.missing.length})
                        </h5>
                        <div className="space-y-1">
                          {result.skillMatch.missing.map((skill, index) => (
                            <span
                              key={index}
                              className="mb-1 mr-1 inline-block rounded-full bg-red-100 px-2 py-1 text-xs text-red-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Factors */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h4 className="mb-4 flex items-center font-semibold text-gray-900">
                    <ChartBarIcon className="mr-2 h-5 w-5 text-purple-600" />
                    Key Factors
                  </h4>

                  <div className="space-y-4">
                    {/* Positive Factors */}
                    {result.factors?.positive && result.factors.positive.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium text-green-700">
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {result.factors.positive.map((factor, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm text-gray-700"
                            >
                              <CheckCircleIcon className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Negative Factors */}
                    {result.factors?.negative && result.factors.negative.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium text-red-700">
                          Areas of Concern
                        </h5>
                        <ul className="space-y-1">
                          {result.factors.negative.map((factor, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm text-gray-700"
                            >
                              <ExclamationCircleIcon className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Neutral Factors */}
                    {result.factors?.neutral && result.factors.neutral.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium text-gray-700">
                          Additional Considerations
                        </h5>
                        <ul className="space-y-1">
                          {result.factors.neutral.map((factor, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm text-gray-700"
                            >
                              <QuestionMarkCircleIcon className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Premium Application Tips */}
                {result.applicationTips &&
                  result.applicationTips.length > 0 && (
                    <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
                      <h4 className="mb-4 flex items-center font-semibold text-gray-900">
                        <SparklesIcon className="mr-2 h-5 w-5 text-purple-600" />
                        Premium Application Tips
                      </h4>
                      <ul className="space-y-2">
                        {result.applicationTips.map((tip, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm text-gray-700"
                          >
                            <CheckCircleIcon className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Usage Info */}
                {usageInfo && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>
                            Usage today:{' '}
                            <span className="font-medium">
                              {usageInfo.usageToday}/
                              {usageInfo.dailyLimit === -1
                                ? '∞'
                                : usageInfo.dailyLimit}
                            </span>
                          </span>
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs capitalize">
                            {usageInfo.userTier}{' '}
                            {usageInfo.analysisType === 'premium'
                              ? '• Premium Analysis'
                              : '• Basic Analysis'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Got it, thanks!
                  </button>
                  <button
                    onClick={() => {
                      // Save result functionality could be added here
                      onClose();
                    }}
                    className="flex-1 rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
