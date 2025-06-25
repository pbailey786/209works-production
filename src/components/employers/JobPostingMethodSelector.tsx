'use client';

import React, { useState } from 'react';
import { MessageCircle, FileText, Upload, ArrowRight, Sparkles, Zap } from 'lucide-react';

interface JobPostingMethodSelectorProps {
  onSelectMethod: (method: 'ai-chat' | 'traditional-form' | 'bulk-csv') => void;
}

export default function JobPostingMethodSelector({ onSelectMethod }: JobPostingMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'ai-chat' | 'traditional-form' | 'bulk-csv' | null>(null);

  const methods = [
    {
      id: 'ai-chat' as const,
      title: '🤖 AI-Powered Job Creation',
      subtitle: 'Recommended',
      description: 'Chat with our AI to create optimized job posts. Just tell us what you need and we\'ll handle the rest.',
      features: [
        'Natural conversation interface',
        'AI optimization suggestions', 
        'Automatic local insights',
        'Perfect for first-time posters'
      ],
      icon: MessageCircle,
      gradient: 'from-blue-500 to-purple-600',
      badge: 'SMART'
    },
    {
      id: 'traditional-form' as const,
      title: '📝 Traditional Form',
      subtitle: 'Classic approach',
      description: 'Fill out a structured form with job details. Great if you know exactly what you want to post.',
      features: [
        'Familiar form interface',
        'Complete control over details',
        'Quick for experienced posters',
        'All standard job fields'
      ],
      icon: FileText,
      gradient: 'from-green-500 to-emerald-600',
      badge: 'CLASSIC'
    },
    {
      id: 'bulk-csv' as const,
      title: '📊 Bulk CSV Upload',
      subtitle: 'For power users',
      description: 'Upload multiple jobs at once with a CSV file. Perfect for hiring multiple positions or seasonal hiring.',
      features: [
        'Upload 50+ jobs at once',
        'AI processes each job',
        'Bulk review interface',
        'Template provided'
      ],
      icon: Upload,
      gradient: 'from-orange-500 to-red-600',
      badge: 'BULK'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How would you like to create your job post?
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the method that works best for you. All paths lead to great job posts that attract top talent in the Central Valley.
        </p>
      </div>

      {/* Method Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative cursor-pointer transform transition-all duration-200 ${
                isSelected 
                  ? 'scale-105 shadow-2xl' 
                  : 'hover:scale-102 hover:shadow-lg'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${method.gradient} rounded-2xl opacity-10 ${
                isSelected ? 'opacity-20' : ''
              }`} />
              
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 h-full">
                {/* Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r ${method.gradient} text-white`}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {method.badge}
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {method.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {method.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${method.gradient}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                  {method.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {method.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      {selectedMethod && (
        <div className="text-center">
          <button
            onClick={() => onSelectMethod(selectedMethod)}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            {selectedMethod === 'ai-chat' && 'Start AI Chat'}
            {selectedMethod === 'traditional-form' && 'Open Form'}
            {selectedMethod === 'bulk-csv' && 'Upload CSV'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>
          Need help deciding? The AI chat is perfect for most users and creates better job posts.
          <br />
          You can always switch methods on your next job posting.
        </p>
      </div>
    </div>
  );
}