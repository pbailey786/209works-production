'use client';

import React from 'react';
import { MapPin, Clock, DollarSign, CheckCircle, Building, Calendar } from 'lucide-react';
import { extractColorFromLogo } from '@/lib/utils/colorExtractor';

interface BenefitOption {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  key: string;
}

interface JobData {
  title?: string;
  company?: string;
  companyLogo?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
  schedule?: string;
  benefits?: string;
  benefitOptions?: BenefitOption[];
}

interface JobPreviewModernProps {
  jobData: JobData;
  headerColor?: string;
}


export default function JobPreviewModern({ jobData, headerColor }: JobPreviewModernProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get active benefits (all benefits in the array are considered active now)
  const activeBenefits = jobData.benefitOptions || [];
  
  // Filter out benefits with empty titles
  const validBenefits = activeBenefits.filter(b => b.title && b.title.trim() !== '');

  const gradientStyle = headerColor 
    ? { background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%)` }
    : { background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <div className="relative text-white p-8" style={gradientStyle}>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            {jobData.companyLogo ? (
              <img 
                src={jobData.companyLogo} 
                alt={jobData.company} 
                className="w-16 h-16 rounded-xl bg-white p-1 object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl font-bold">
                {getInitials(jobData.company || 'Company')}
              </div>
            )}
            <div>
              <div className="text-xl font-medium opacity-90">{jobData.company || 'Your Company'}</div>
              {jobData.urgency && (
                <div className="text-sm opacity-75 mt-1">🔥 {jobData.urgency}</div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-6">{jobData.title}</h1>
          <div className="flex flex-wrap gap-3">
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {jobData.location}
            </span>
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {jobData.jobType || 'Full-time'}
            </span>
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Posted today
            </span>
            {jobData.urgency && (
              <span className="bg-red-500/80 backdrop-blur px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium">
                🔥 {jobData.urgency}
              </span>
            )}
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className="w-full h-full rounded-full bg-white/20 blur-3xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* About This Role */}
        {jobData.description && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-lg">
                📝
              </span>
              About This Role
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{jobData.description}</p>
          </div>
        )}

        {/* Requirements */}
        {jobData.requirements && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-lg">
                ⚡
              </span>
              Nice to Have
            </h2>
            <div className="space-y-2">
              {jobData.requirements.split('\n').map((req, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{req.replace(/^[-•*]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Range */}
        {jobData.salary && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl text-center mb-8">
            <div className="text-sm opacity-90 mb-2">Competitive Salary Range</div>
            <div className="text-3xl font-bold">{jobData.salary}</div>
          </div>
        )}

        {/* Benefits */}
        {validBenefits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg">
                🎁
              </span>
              What We Offer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validBenefits.map((benefit, index) => (
                <div 
                  key={benefit.key || index} 
                  className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <div className="font-semibold text-gray-800 mb-1">{benefit.title}</div>
                  {benefit.description && (
                    <div className="text-sm text-gray-600">{benefit.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal Breakers / Priorities */}
        {(jobData.dealBreakers?.length || jobData.priorities?.length) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {jobData.priorities && jobData.priorities.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-3">What We Value Most</h3>
                <ul className="space-y-2">
                  {jobData.priorities.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-blue-800">
                      <span className="text-blue-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {jobData.dealBreakers && jobData.dealBreakers.length > 0 && (
              <div className="bg-red-50 p-6 rounded-xl">
                <h3 className="font-semibold text-red-900 mb-3">Important Requirements</h3>
                <ul className="space-y-2">
                  {jobData.dealBreakers.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-red-800">
                      <span className="text-red-500">!</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
        <h2 className="text-2xl font-semibold mb-3">Ready to Join Our Team?</h2>
        <p className="mb-6 opacity-90">We'd love to hear from you! Take the next step in your career.</p>
        
        <button className="bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
          📝 Apply Now
        </button>
        
        <div className="text-sm opacity-75 mt-6">
          <p className="mb-2">✉️ Employer gets notified instantly • Application tracked in your dashboard</p>
          <p>209jobs.com - Your Central Valley Career Connection</p>
          <p className="mt-1">Equal Opportunity Employer</p>
        </div>
      </div>
    </div>
  );
}