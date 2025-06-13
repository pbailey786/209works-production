'use client';

import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Star, 
  Megaphone, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface CreditSystemExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export default function CreditSystemExplanationModal({
  isOpen,
  onClose,
  onGetStarted,
}: CreditSystemExplanationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Welcome to 209 Works Credits! 🎉",
      subtitle: "Your simple, flexible way to post jobs",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-green-500 rounded-2xl mb-4 shadow-lg">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Credits are your currency for posting jobs on 209 Works. Think of them like tokens - 
              each job posting uses one credit, and you can use them whenever you need to hire.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Quick Example</span>
            </div>
            <p className="text-blue-700 text-sm">
              Buy 5 credits → Post 5 different jobs → Attract qualified candidates from the 209 area
            </p>
          </div>
        </div>
      )
    },
    {
      title: "What Can You Do With Credits? 💼",
      subtitle: "More than just basic job posting",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Standard Job Posting</h4>
                <p className="text-sm text-green-700">1 credit = 1 job posting for 30 days</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-800">Featured Placement</h4>
                <p className="text-sm text-orange-700">Extra credits to boost your job to the top</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">Social Media Promotion</h4>
                <p className="text-sm text-purple-700">Share your job across social platforms</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How Credits Work ⏰",
      subtitle: "Simple, transparent, and flexible",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-800 mb-1">30-Day Duration</h4>
              <p className="text-sm text-blue-700">Credits expire after 30 days to keep your hiring fresh</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800 mb-1">Roll Over Period</h4>
              <p className="text-sm text-green-700">Unused credits can roll over for 30-60 days</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-yellow-700">
              Start with our Starter Pack (2 credits for $50) to test the waters, 
              then upgrade to Standard (5 credits for $99) when you're ready to scale your hiring.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onGetStarted();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{slides[currentSlide].title}</h2>
            <p className="text-blue-100">{slides[currentSlide].subtitle}</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {slides[currentSlide].content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentSlide === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            {currentSlide + 1} of {slides.length}
          </div>
          
          <button
            onClick={nextSlide}
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-colors flex items-center"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
