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
  Sparkles,
  RefreshCw,
  Lightbulb
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
      title: "🎉 Welcome to 209 Works Credits!",
      subtitle: "Your flexible way to post, promote, and boost jobs",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#2d4a3e] to-[#9fdf9f] rounded-2xl mb-4 shadow-lg">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Credits are like tokens — each action on 209 Works costs 1 credit, whether you're posting a job,
              boosting it to the top, or promoting it on social media.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Standard Job Posting</span>
            </div>
            <p className="text-blue-700 text-sm">
              5 credits = 5 ways to get seen — post, boost, or promote any way you like.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Each action = 1 credit — you choose how to use them",
      subtitle: "Post, boost, or promote — it's all up to you",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-[#9fdf9f]/20 border border-[#2d4a3e]/20 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-[#2d4a3e]/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-[#2d4a3e]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#2d4a3e]">📝 Standard Job Posting</h4>
                <p className="text-sm text-gray-700">5 credits = 5 ways to get seen — post, boost, or promote any way you like.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-800">⭐ Feature a Job</h4>
                <p className="text-sm text-orange-700">Top placement in search + email boost to top candidates using our Should I Apply AI. 1 credit gets you there.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">📣 Promote on Social Media</h4>
                <p className="text-sm text-purple-700">Share your job across our social channels — 1 credit per promo.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🧾 How Credits Work - No stress. Just smart hiring.",
      subtitle: "Simple, transparent, and flexible",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800">🕒 30 Days to Use</h4>
                <p className="text-sm text-blue-700">Each credit is good for 30 days — post, promote, or boost before it expires.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">♻️ Roll It Over</h4>
                <p className="text-sm text-green-700">Need more time? Unused credits roll over for up to 60 days.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">💡 Pro Tip</h4>
                <p className="text-sm text-yellow-700">Test the waters with 2 credits for $50, then upgrade to 5 credits for $99 when you're ready to hire like a pro.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Ready to start hiring? Choose your credit package and get your first job posted today!
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
        <div className="bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{slides[currentSlide].title}</h2>
            <p className="text-[#2d4a3e]/80">{slides[currentSlide].subtitle}</p>
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
