'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  HelpCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center text-[#2d4a3e] hover:text-[#1d3a2e] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              How can we help you?
            </h1>
            <p className="text-gray-600 text-lg">
              Get support for your job search on 209 Works
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Email Support */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#2d4a3e]/10 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-[#2d4a3e]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Email Support</h3>
                <p className="text-gray-600">We'll get back to you within 24 hours</p>
              </div>
            </div>
            <a
              href="mailto:support@209.works"
              className="inline-flex items-center px-6 py-3 bg-[#2d4a3e] text-white rounded-xl font-medium hover:bg-[#1d3a2e] transition-colors"
            >
              Send Email
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>

          {/* Live Chat */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#ff6b35]/10 rounded-xl flex items-center justify-center mr-4">
                <MessageCircle className="w-6 h-6 text-[#ff6b35]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Live Chat</h3>
                <p className="text-gray-600">Chat with our AI assistant JobsGPT</p>
              </div>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
            >
              Start Chat
              <MessageCircle className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-[#2d4a3e]" />
              Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            
            <div className="px-6 py-4">
              <h3 className="font-medium text-gray-900 mb-2">How do I save jobs for later?</h3>
              <p className="text-gray-600 text-sm">
                Click the heart icon on any job listing to save it to your dashboard. You can view all saved jobs from your dashboard or profile.
              </p>
            </div>

            <div className="px-6 py-4">
              <h3 className="font-medium text-gray-900 mb-2">How do I set up job alerts?</h3>
              <p className="text-gray-600 text-sm">
                Visit the <Link href="/alerts" className="text-[#2d4a3e] hover:underline">alerts page</Link> to create custom job alerts. You'll receive weekly email notifications when new jobs match your criteria.
              </p>
            </div>

            <div className="px-6 py-4">
              <h3 className="font-medium text-gray-900 mb-2">Can I track my job applications?</h3>
              <p className="text-gray-600 text-sm">
                Yes! Go to your <Link href="/profile/applications" className="text-[#2d4a3e] hover:underline">applications page</Link> to see all your applied, saved, and archived jobs in one place.
              </p>
            </div>

            <div className="px-6 py-4">
              <h3 className="font-medium text-gray-900 mb-2">What areas does 209 Works cover?</h3>
              <p className="text-gray-600 text-sm">
                We specialize in California's Central Valley (209 area code), plus Sacramento (916), East Bay (510), and broader Northern California regions.
              </p>
            </div>

            <div className="px-6 py-4">
              <h3 className="font-medium text-gray-900 mb-2">How do I update my profile?</h3>
              <p className="text-gray-600 text-sm">
                Visit your <Link href="/profile" className="text-[#2d4a3e] hover:underline">profile page</Link> to update your resume, skills, experience, and job preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] rounded-xl p-6 text-white text-center">
          <h2 className="text-xl font-semibold mb-4">Need immediate help?</h2>
          <div className="flex justify-center space-x-4">
            <Link
              href="/jobs"
              className="inline-flex items-center px-6 py-3 bg-white text-[#2d4a3e] rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Browse Jobs
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
            >
              Ask JobsGPT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}