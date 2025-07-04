/**
 * Progressive Onboarding Flow for JobsGPT
 * 
 * Guides new users through AI capabilities and sets expectations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface OnboardingFlowProps {
  onComplete: (exampleQuery?: string) => void;
  onSkip: () => void;
  fromHomepage?: boolean;
  homepageQuery?: string;
}

export default function OnboardingFlow({ 
  onComplete, 
  onSkip, 
  fromHomepage = false,
  homepageQuery 
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-advance if user came from homepage with query
  useEffect(() => {
    if (fromHomepage && homepageQuery) {
      // Short welcome, then proceed with their query
      const timer = setTimeout(() => {
        onComplete(homepageQuery);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fromHomepage, homepageQuery, onComplete]);

  const steps = [
    {
      id: 'welcome',
      title: "👋 I'm JobsGPT",
      subtitle: "Your Central Valley job search assistant",
      content: "I know every city from Stockton to Fresno, and I understand what jobs are actually available locally.",
      icon: <SparklesIcon className="h-8 w-8 text-orange-500" />,
      examples: []
    },
    {
      id: 'capabilities',
      title: "🎯 What I Can Do",
      subtitle: "Natural language job search",
      content: "Ask me questions like you'd ask a local friend who knows all the employers.",
      icon: <MapPinIcon className="h-8 w-8 text-orange-500" />,
      examples: [
        "Find warehouse jobs in Stockton that pay over $20/hour",
        "Show me healthcare jobs in Modesto with good benefits",
        "What manufacturing jobs are hiring in Tracy right now?"
      ]
    },
    {
      id: 'local_focus',
      title: "🏠 Hyperlocal Intelligence", 
      subtitle: "No more competing with San Francisco",
      content: "Every job I show you is within driving distance. No remote-only bait and switch.",
      icon: <ClockIcon className="h-8 w-8 text-orange-500" />,
      examples: [
        "Jobs near the Stockton mall",
        "Walking distance from downtown Modesto", 
        "Companies along Highway 99"
      ]
    }
  ];

  const exampleQueries = [
    "Find warehouse jobs in Stockton",
    "Healthcare jobs in Modesto",
    "Customer service jobs near me",
    "What jobs pay well in Tracy?"
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = (query?: string) => {
    setIsVisible(false);
    setTimeout(() => onComplete(query), 300);
  };

  const handleExampleClick = (query: string) => {
    handleComplete(query);
  };

  // If user came from homepage, show simplified welcome
  if (fromHomepage && homepageQuery) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-2xl text-center py-8"
          >
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center mb-4">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect! Let me search for that...</h2>
              <p className="text-gray-600">
                Searching Central Valley jobs: "{homepageQuery}"
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 relative"
          >
            {/* Close button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Progress indicator */}
            <div className="flex justify-center mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 mx-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="text-center">
              <div className="mb-4">
                {currentStepData.icon}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              
              <p className="text-lg font-medium text-orange-600 mb-4">
                {currentStepData.subtitle}
              </p>
              
              <p className="text-gray-600 mb-6">
                {currentStepData.content}
              </p>

              {/* Examples */}
              {currentStepData.examples.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
                  <div className="space-y-2">
                    {currentStepData.examples.map((example, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        "{example}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Skip intro
              </button>
              
              {currentStep === steps.length - 1 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Ready to start? Try one:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {exampleQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(query)}
                        className="flex items-center justify-between bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg p-3 text-sm font-medium transition-colors"
                      >
                        <span>"{query}"</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}